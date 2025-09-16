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
        recommendations.append("Immediate action required: Some AI systems may be prohibited under EU AI Act")
        recommendations.append("Conduct legal review with AI regulation specialist")
        recommendations.append("Consider alternative AI approaches that comply with regulations")
    
    if risk_level in ["high", "unacceptable"]:
        recommendations.append("Implement conformity assessment procedures")
        recommendations.append("Establish quality management system")
        recommendations.append("Ensure human oversight mechanisms")
        recommendations.append("Implement risk management system")
        recommendations.append("Maintain detailed documentation and logs")
    
    if "medical_diagnosis" in responses and responses["medical_diagnosis"] == "yes":
        recommendations.append("Ensure clinical validation of medical AI systems")
        recommendations.append("Implement proper medical device regulations compliance")
    
    if "data_processing" in responses and responses["data_processing"] == "yes":
        recommendations.append("Ensure GDPR compliance for personal data processing")
        recommendations.append("Implement data minimization principles")
    
    if "automated_decision_making" in responses and responses["automated_decision_making"] == "yes":
        recommendations.append("Provide clear information about automated decision-making")
        recommendations.append("Implement right to explanation mechanisms")
    
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()