from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import hashlib
import jwt
from passlib.context import CryptContext

# Import our new services
from document_manager import document_manager, initialize_documents, start_scheduler
from chat_service import ChatService
from news_service import NewsService, start_news_scheduler
from admin_service import admin_service
from icu_vesos_service import get_icu_vesos_service, VESOSInput, VESOSResult

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-here"  # In production, use environment variable
ALGORITHM = "HS256"

# Create the main app
app = FastAPI(title="AI Compliance SaaS", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Initialize services
chat_service = ChatService(client)
news_service = NewsService(client)

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    company_name: str
    company_type: str  # "digital_health" or "insurtech"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    company_name: str
    company_type: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Assessment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    company_name: str
    assessment_type: str  # "initial", "follow_up"
    responses: Dict[str, Any]
    risk_score: float
    risk_level: str  # "minimal", "limited", "high", "unacceptable"
    recommendations: List[str]
    compliance_status: str  # "compliant", "partially_compliant", "non_compliant"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssessmentCreate(BaseModel):
    responses: Dict[str, Any]

class ComplianceReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assessment_id: str
    user_id: str
    report_data: Dict[str, Any]
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Chat models
class ChatMessageCreate(BaseModel):
    message: str
    category: Optional[str] = None

class ChatSessionCreate(BaseModel):
    title: Optional[str] = None

# Admin models
class AdminLogin(BaseModel):
    username: str
    password: str

class AdminUpdateRequest(BaseModel):
    update_type: str = "all"  # "all", "documents", "news", "articles", "rag"

class DocumentMetadata(BaseModel):
    id: int
    title: str
    url: str
    source: str
    document_type: str
    summary_es: str
    keywords: str
    publication_date: str
    last_updated: str
    category: str
    relevance_score: float

# ICU-VESOS models
class FeasibilityFactorsModel(BaseModel):
    technological_maturity: float = Field(ge=0, le=10)
    budget_availability: float = Field(ge=0, le=10)
    team_competence: float = Field(ge=0, le=10)
    regulatory_clarity: float = Field(ge=0, le=10)

class UtilityIndicatorsModel(BaseModel):
    technical_utility: float = Field(ge=0, le=10)
    aspirational_utility: float = Field(ge=0, le=10)

class RiskAssessmentModel(BaseModel):
    probability: float = Field(ge=0, le=1)
    impact: float = Field(ge=0, le=10)
    mitigation_measures: List[str] = []

class VESOSInputModel(BaseModel):
    project_name: str
    organization: str
    sector: str  # "digital_health" or "insurtech"
    utility: UtilityIndicatorsModel
    feasibility: FeasibilityFactorsModel
    cost: float = Field(gt=0)
    risks: List[RiskAssessmentModel]
    time_months: float = Field(gt=0)
    problem_statement: str
    expected_users: int
    compliance_requirements: List[str] = []

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    encoded_jwt = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def calculate_risk_score(responses: Dict[str, Any]) -> tuple[float, str]:
    """Calculate risk score based on EU AI Act categories"""
    score = 0.0
    total_questions = len(responses)
    
    # High risk indicators
    high_risk_factors = [
        "medical_diagnosis", "medical_treatment", "automated_decision_making",
        "biometric_identification", "emotion_recognition", "critical_infrastructure"
    ]
    
    # Calculate weighted score
    for key, value in responses.items():
        if key in high_risk_factors and value == "yes":
            score += 3.0
        elif value == "yes":
            score += 1.0
        elif value == "partial":
            score += 0.5
    
    # Normalize score (0-10 scale)
    if total_questions > 0:
        normalized_score = min(10.0, (score / total_questions) * 4)
    else:
        normalized_score = 0.0
    
    # Determine risk level
    if normalized_score >= 8.0:
        risk_level = "unacceptable"
    elif normalized_score >= 6.0:
        risk_level = "high"
    elif normalized_score >= 3.0:
        risk_level = "limited"
    else:
        risk_level = "minimal"
    
    return normalized_score, risk_level

def generate_recommendations(responses: Dict[str, Any], risk_level: str) -> List[str]:
    """Generate personalized recommendations based on responses"""
    recommendations = []
    
    if risk_level == "unacceptable":
        recommendations.append("Acción inmediata requerida: Algunos sistemas de IA pueden estar prohibidos bajo el EU AI Act")
        recommendations.append("Realizar revisión legal con especialista en regulación de IA")
        recommendations.append("Considerar enfoques alternativos de IA que cumplan con las regulaciones")
    
    if risk_level in ["high", "unacceptable"]:
        recommendations.append("Implementar procedimientos de evaluación de conformidad")
        recommendations.append("Establecer sistema de gestión de calidad")
        recommendations.append("Asegurar mecanismos de supervisión humana")
        recommendations.append("Implementar sistema de gestión de riesgos")
        recommendations.append("Mantener documentación detallada y registros")
    
    if "medical_diagnosis" in responses and responses["medical_diagnosis"] == "yes":
        recommendations.append("Asegurar validación clínica de sistemas de IA médica")
        recommendations.append("Implementar cumplimiento de regulaciones de dispositivos médicos")
    
    if "data_processing" in responses and responses["data_processing"] in ["sensitive", "personal"]:
        recommendations.append("Asegurar cumplimiento del GDPR para procesamiento de datos personales")
        recommendations.append("Implementar principios de minimización de datos")
    
    if "automated_decision_making" in responses and responses["automated_decision_making"] == "yes":
        recommendations.append("Proporcionar información clara sobre toma de decisiones automatizada")
        recommendations.append("Implementar mecanismos de derecho a explicación")
    
    if "transparency" in responses and responses["transparency"] in ["none", "minimal"]:
        recommendations.append("Mejorar transparencia informando a usuarios sobre el uso de IA")
        recommendations.append("Desarrollar políticas claras de comunicación sobre sistemas de IA")
    
    if "human_oversight" in responses and responses["human_oversight"] in ["none", "exception"]:
        recommendations.append("Establecer supervisión humana continua o periódica")
        recommendations.append("Capacitar personal para supervisión efectiva de sistemas de IA")
    
    if "biometric_identification" in responses and responses["biometric_identification"] == "yes":
        recommendations.append("Evaluar necesidad legal y proporcionalidad de identificación biométrica")
        recommendations.append("Implementar salvaguardas adicionales para datos biométricos")
    
    if "emotion_recognition" in responses and responses["emotion_recognition"] == "yes":
        recommendations.append("Revisar bases legales para reconocimiento de emociones")
        recommendations.append("Considerar alternativas menos invasivas")
    
    # Recomendaciones generales por tipo de empresa
    if any("medical" in str(v) or "diagnosis" in str(v) for v in responses.values()):
        recommendations.append("Consultar con autoridades sanitarias sobre requisitos específicos")
        recommendations.append("Establecer procesos de validación clínica continua")
    
    if any("insurance" in str(v) or "risk_assessment" in str(v) for v in responses.values()):
        recommendations.append("Revisar políticas de no discriminación en evaluación de riesgos")
        recommendations.append("Asegurar transparencia en procesos de suscripción automática")
    
    # Recomendaciones adicionales basadas en nivel de riesgo
    if risk_level in ["limited", "minimal"]:
        recommendations.append("Mantener monitoreo continuo del sistema para detectar cambios en el riesgo")
        recommendations.append("Establecer proceso de revisión periódica del cumplimiento")
    
    return recommendations

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    user_obj = User(**user_dict)
    
    # Store user with hashed password
    user_doc = user_obj.dict()
    user_doc["hashed_password"] = hashed_password
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_obj.id})
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_obj}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_obj = User(**user)
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_obj}

# Assessment endpoints
@api_router.post("/assessments", response_model=Assessment)
async def create_assessment(assessment_data: AssessmentCreate, current_user: User = Depends(get_current_user)):
    # Calculate risk score and level
    risk_score, risk_level = calculate_risk_score(assessment_data.responses)
    
    # Generate recommendations
    recommendations = generate_recommendations(assessment_data.responses, risk_level)
    
    # Determine compliance status
    compliance_status = "compliant" if risk_level in ["minimal", "limited"] else "partially_compliant" if risk_level == "high" else "non_compliant"
    
    assessment = Assessment(
        user_id=current_user.id,
        company_name=current_user.company_name,
        assessment_type="initial",
        responses=assessment_data.responses,
        risk_score=risk_score,
        risk_level=risk_level,
        recommendations=recommendations,
        compliance_status=compliance_status
    )
    
    await db.assessments.insert_one(assessment.dict())
    return assessment

@api_router.get("/assessments", response_model=List[Assessment])
async def get_user_assessments(current_user: User = Depends(get_current_user)):
    assessments = await db.assessments.find({"user_id": current_user.id}).to_list(100)
    return [Assessment(**assessment) for assessment in assessments]

@api_router.get("/assessments/{assessment_id}", response_model=Assessment)
async def get_assessment(assessment_id: str, current_user: User = Depends(get_current_user)):
    assessment = await db.assessments.find_one({"id": assessment_id, "user_id": current_user.id})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return Assessment(**assessment)

# Dashboard stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    assessments = await db.assessments.find({"user_id": current_user.id}).to_list(100)
    
    if not assessments:
        return {
            "total_assessments": 0,
            "latest_risk_score": 0,
            "compliance_status": "not_assessed",
            "recommendations_count": 0
        }
    
    latest_assessment = max(assessments, key=lambda x: x["created_at"])
    
    return {
        "total_assessments": len(assessments),
        "latest_risk_score": latest_assessment["risk_score"],
        "compliance_status": latest_assessment["compliance_status"],
        "recommendations_count": len(latest_assessment["recommendations"])
    }

# Report generation
@api_router.post("/reports/generate/{assessment_id}")
async def generate_report(assessment_id: str, current_user: User = Depends(get_current_user)):
    assessment = await db.assessments.find_one({"id": assessment_id, "user_id": current_user.id})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    report_data = {
        "company_name": assessment["company_name"],
        "assessment_date": assessment["created_at"].isoformat(),
        "risk_score": assessment["risk_score"],
        "risk_level": assessment["risk_level"],
        "compliance_status": assessment["compliance_status"],
        "recommendations": assessment["recommendations"],
        "executive_summary": f"Based on the AI compliance assessment, {assessment['company_name']} has a risk score of {assessment['risk_score']:.1f}/10.0 and is classified as {assessment['risk_level']} risk according to EU AI Act regulations.",
        "next_steps": assessment["recommendations"][:3]  # Top 3 recommendations
    }
    
    report = ComplianceReport(
        assessment_id=assessment_id,
        user_id=current_user.id,
        report_data=report_data
    )
    
    await db.reports.insert_one(report.dict())
    return {"report_id": report.id, "report_data": report_data}

# Chat endpoints
@api_router.post("/chat/sessions")
async def create_chat_session(session_data: ChatSessionCreate, current_user: User = Depends(get_current_user)):
    session_id = await chat_service.create_chat_session(current_user.id, session_data.title)
    return {"session_id": session_id}

@api_router.get("/chat/sessions")
async def get_chat_sessions(current_user: User = Depends(get_current_user)):
    sessions = await chat_service.get_chat_sessions(current_user.id)
    return {"sessions": sessions}

@api_router.get("/chat/sessions/{session_id}/messages")
async def get_chat_messages(session_id: str, current_user: User = Depends(get_current_user)):
    messages = await chat_service.get_chat_messages(session_id, current_user.id)
    return {"messages": messages}

@api_router.post("/chat/sessions/{session_id}/messages")
async def send_chat_message(session_id: str, message_data: ChatMessageCreate, current_user: User = Depends(get_current_user)):
    try:
        response = await chat_service.generate_response(
            session_id=session_id,
            user_id=current_user.id,
            message=message_data.message,
            category=message_data.category
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@api_router.delete("/chat/sessions/{session_id}")
async def delete_chat_session(session_id: str, current_user: User = Depends(get_current_user)):
    try:
        await chat_service.delete_chat_session(session_id, current_user.id)
        return {"message": "Session deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@api_router.get("/chat/stats")
async def get_chat_stats(current_user: User = Depends(get_current_user)):
    stats = await chat_service.get_chat_statistics(current_user.id)
    return stats

# Document endpoints
@api_router.get("/documents/search")
async def search_documents(query: str, category: Optional[str] = None, k: int = 5):
    results = document_manager.search_documents(query, k=k, category_filter=category)
    return {"results": results}

@api_router.get("/documents/categories")
async def get_document_categories():
    categories = document_manager.get_document_categories()
    return {"categories": categories}

@api_router.get("/documents/stats")
async def get_document_stats():
    stats = document_manager.get_document_stats()
    return stats

@api_router.post("/documents/refresh")
async def refresh_documents():
    """Manually trigger document refresh"""
    try:
        await document_manager.update_documents()
        return {"message": "Document refresh completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing documents: {str(e)}")

# News endpoints
@api_router.get("/news")
async def get_recent_news(limit: int = 20, category: Optional[str] = None, days: int = 30):
    news = await news_service.get_recent_news(limit=limit, category=category, days=days)
    return {"news": news}

@api_router.get("/news/search")
async def search_news(query: str, limit: int = 10):
    results = await news_service.search_news(query, limit=limit)
    return {"results": results}

@api_router.get("/news/tags/{tag}")
async def get_news_by_tag(tag: str, limit: int = 10):
    news = await news_service.get_news_by_tags([tag], limit=limit)
    return {"news": news}

@api_router.post("/news/refresh")
async def refresh_news():
    """Manually trigger news collection"""
    try:
        await news_service.collect_all_news()
        return {"message": "News collection completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error collecting news: {str(e)}")

# Basic endpoints
@api_router.get("/")
async def root():
    return {"message": "AI Compliance SaaS API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# ADMIN ROUTES
# =============================================================================

@app.post("/api/admin/login")
async def admin_login(credentials: AdminLogin):
    """Autenticación de administrador"""
    try:
        if admin_service.authenticate_admin(credentials.username, credentials.password):
            # Crear token admin (simple, sin expiración para demo)
            admin_token = jwt.encode(
                {"user": "admin", "role": "admin"}, 
                SECRET_KEY, 
                algorithm=ALGORITHM
            )
            return {
                "message": "Admin authenticated successfully",
                "access_token": admin_token,
                "token_type": "bearer",
                "role": "admin"
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
    except Exception as e:
        logger.error(f"Admin login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Admin login failed")

@app.get("/api/admin/dashboard")
async def admin_dashboard():
    """Dashboard de administración con estadísticas"""
    try:
        # Obtener estadísticas generales
        documents = admin_service.get_documents_metadata(limit=10)
        logs = admin_service.get_update_logs(limit=10)
        
        # Estadísticas de la base de datos
        total_users = await db.users.count_documents({})
        total_assessments = await db.assessments.count_documents({})
        total_chat_sessions = await db.chat_sessions.count_documents({})
        
        return {
            "stats": {
                "total_users": total_users,
                "total_assessments": total_assessments,
                "total_chat_sessions": total_chat_sessions,
                "total_documents": len(documents),
                "last_update": logs[0]['timestamp'] if logs else None
            },
            "recent_documents": documents[:5],
            "recent_logs": logs[:5]
        }
        
    except Exception as e:
        logger.error(f"Admin dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error loading admin dashboard")

@app.post("/api/admin/update")
async def manual_update(request: AdminUpdateRequest):
    """Ejecutar actualización manual"""
    try:
        result = admin_service.manual_update(request.update_type)
        return {
            "message": "Manual update completed",
            "result": result
        }
    except Exception as e:
        logger.error(f"Manual update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Manual update failed")

@app.get("/api/admin/logs")
async def get_update_logs(limit: int = 50):
    """Obtener logs de actualizaciones"""
    try:
        logs = admin_service.get_update_logs(limit)
        return {"logs": logs}
    except Exception as e:
        logger.error(f"Get logs error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving logs")

@app.get("/api/admin/documents")
async def get_documents_admin(limit: int = 100, category: str = None):
    """Obtener documentos para administración"""
    try:
        documents = admin_service.get_documents_metadata(limit, category)
        return {"documents": documents}
    except Exception as e:
        logger.error(f"Get admin documents error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving documents")

# =============================================================================
# REPOSITORY ROUTES (Para usuarios finales)
# =============================================================================

@app.get("/api/repository/documents")
async def get_repository_documents(
    limit: int = 50, 
    category: str = None, 
    search: str = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Obtener documentos del repositorio para usuarios"""
    try:
        # Verificar token de usuario
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        documents = admin_service.get_documents_metadata(limit, category)
        
        # Filtrar por búsqueda si se proporciona
        if search:
            search_lower = search.lower()
            documents = [
                doc for doc in documents 
                if search_lower in doc['title'].lower() or 
                   search_lower in doc['summary_es'].lower() or
                   search_lower in doc['keywords'].lower()
            ]
        
        return {
            "documents": documents,
            "total": len(documents)
        }
        
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Repository documents error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving repository documents")

@app.get("/api/repository/categories")
async def get_repository_categories(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Obtener categorías disponibles en el repositorio"""
    try:
        # Verificar token
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        documents = admin_service.get_documents_metadata(1000)  # Obtener muchos para categorías
        categories = list(set(doc['category'] for doc in documents if doc['category']))
        
        return {"categories": sorted(categories)}
        
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Repository categories error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving categories")

@app.get("/api/repository/stats")
async def get_repository_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Obtener estadísticas del repositorio"""
    try:
        # Verificar token
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        documents = admin_service.get_documents_metadata(1000)
        
        # Contar por categorías
        category_counts = {}
        for doc in documents:
            category = doc['category'] or 'sin_categoria'
            category_counts[category] = category_counts.get(category, 0) + 1
        
        # Contar por tipos
        type_counts = {}
        for doc in documents:
            doc_type = doc['document_type'] or 'desconocido'
            type_counts[doc_type] = type_counts.get(doc_type, 0) + 1
        
        return {
            "total_documents": len(documents),
            "categories": category_counts,
            "document_types": type_counts,
            "last_updated": max(doc['last_updated'] for doc in documents) if documents else None
        }
        
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Repository stats error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving repository stats")

# =============================================================================
# ICU-VESOS ROUTES (Proyecto FENIX Integration)
# =============================================================================

@app.post("/api/vesos/analyze")
async def analyze_project_vesos(
    vesos_input: VESOSInputModel,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Analizar proyecto usando metodología ICU-VESOS"""
    try:
        # Verificar token
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        
        # Convertir a formato interno
        vesos_data = VESOSInput(
            project_id=str(uuid.uuid4()),
            **vesos_input.dict()
        )
        
        # Realizar análisis VESOS
        vesos_service = get_icu_vesos_service(client)
        analysis_result = vesos_service.calculate_vesos_score(vesos_data)
        
        # Guardar análisis
        analysis_id = await vesos_service.save_vesos_analysis(analysis_result, vesos_data)
        
        return {
            "analysis_id": analysis_id,
            "vesos_score": analysis_result.vesos_score,
            "recommendation": analysis_result.recommendation,
            "risk_level": analysis_result.risk_level,
            "compliance_score": analysis_result.compliance_score,
            "confidence_interval": analysis_result.confidence_interval.dict(),
            "detailed_analysis": analysis_result.detailed_analysis,
            "next_steps": analysis_result.next_steps
        }
        
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"VESOS analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error performing VESOS analysis")

@app.get("/api/vesos/analyses")
async def get_vesos_analyses(
    organization: str = None,
    sector: str = None,
    limit: int = 20,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Obtener análisis VESOS guardados"""
    try:
        # Verificar token
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        vesos_service = get_icu_vesos_service(client)
        analyses = await vesos_service.get_vesos_analyses(organization, sector, limit)
        
        return {"analyses": analyses}
        
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Get VESOS analyses error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving VESOS analyses")

@app.get("/api/vesos/compliance-requirements/{sector}")
async def get_compliance_requirements(
    sector: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Obtener requisitos de compliance por sector"""
    try:
        # Verificar token
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        requirements = {
            "digital_health": [
                {
                    "name": "AI Act",
                    "description": "Reglamento de IA de la UE - Clasificación de riesgos y requisitos",
                    "priority": "high",
                    "deadline": "2025-08-02"
                },
                {
                    "name": "MDR",
                    "description": "Reglamento de Dispositivos Médicos",
                    "priority": "high",
                    "deadline": "ongoing"
                },
                {
                    "name": "GDPR/LOPDGDD",
                    "description": "Protección de datos personales",
                    "priority": "high",
                    "deadline": "ongoing"
                },
                {
                    "name": "EHDS",
                    "description": "Espacio Europeo de Datos de Salud",
                    "priority": "medium",
                    "deadline": "2025-12-31"
                },
                {
                    "name": "NIS2",
                    "description": "Directiva de Ciberseguridad",
                    "priority": "medium",
                    "deadline": "2024-10-17"
                },
                {
                    "name": "ISO 13485",
                    "description": "Gestión de calidad para dispositivos médicos",
                    "priority": "medium",
                    "deadline": "ongoing"
                }
            ],
            "insurtech": [
                {
                    "name": "AI Act",
                    "description": "Reglamento de IA de la UE - Sistemas de alto riesgo en seguros",
                    "priority": "high",
                    "deadline": "2025-08-02"
                },
                {
                    "name": "GDPR/LOPDGDD",
                    "description": "Protección de datos personales",
                    "priority": "high",
                    "deadline": "ongoing"
                },
                {
                    "name": "Solvencia II",
                    "description": "Marco regulatorio de seguros",
                    "priority": "high",
                    "deadline": "ongoing"
                },
                {
                    "name": "Ley del Contrato de Seguro",
                    "description": "Regulación de contratos de seguro",
                    "priority": "medium",
                    "deadline": "ongoing"
                },
                {
                    "name": "NIS2",
                    "description": "Directiva de Ciberseguridad",
                    "priority": "medium",
                    "deadline": "2024-10-17"
                }
            ]
        }
        
        sector_requirements = requirements.get(sector, [])
        
        return {
            "sector": sector,
            "requirements": sector_requirements,
            "total_count": len(sector_requirements)
        }
        
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Get compliance requirements error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving compliance requirements")

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting AI Compliance SaaS...")
    
    # Initialize documents
    await initialize_documents()
    
    # Start document update scheduler
    start_scheduler()
    
    # Start news update scheduler
    start_news_scheduler()
    
    # Create database indexes
    try:
        await db.news_items.create_index([("title", "text"), ("summary", "text")])
        await db.chat_messages.create_index([("session_id", 1), ("created_at", 1)])
        await db.chat_sessions.create_index([("user_id", 1), ("updated_at", -1)])
        logger.info("Database indexes created")
    except Exception as e:
        logger.warning(f"Error creating indexes: {str(e)}")
    
    logger.info("AI Compliance SaaS initialized successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()