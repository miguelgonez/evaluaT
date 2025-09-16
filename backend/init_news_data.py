#!/usr/bin/env python3
"""
Script to initialize news data with sample regulatory news items
"""
import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import hashlib

# Add the backend directory to Python path
sys.path.append('/app/backend')

load_dotenv('/app/backend/.env')

# Sample news data for demonstration
SAMPLE_NEWS = [
    {
        "title": "Nuevo Reglamento de IA de la UE: Impacto en Startups de Salud Digital",
        "url": "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32024R1689",
        "summary": "El Reglamento de IA de la UE establece nuevos requisitos para sistemas de IA de alto riesgo en el sector sanitario, incluyendo evaluaciones de conformidad y supervisión humana obligatoria.",
        "ai_summary": "Para startups de salud digital, el EU AI Act requiere: 1) Evaluación de conformidad para sistemas de diagnóstico automático, 2) Implementación de supervisión humana continua, 3) Documentación detallada de algoritmos médicos. Las empresas tienen hasta mayo 2025 para cumplir con estos requisitos.",
        "source": "EUR-Lex",
        "category": "regulation",
        "language": "es",
        "relevance_score": 9.5,
        "tags": ["ai", "medical", "regulation", "eu", "gdpr"]
    },
    {
        "title": "AEMPS Publica Guía para Dispositivos Médicos con IA",
        "url": "https://www.aemps.gob.es/industria/uso-humano/productos-sanitarios-ps/ps-inteligencia-artificial/",
        "summary": "La Agencia Española de Medicamentos publica nuevas directrices para la evaluación de dispositivos médicos que incorporan inteligencia artificial.",
        "ai_summary": "La AEMPS establece que los dispositivos médicos con IA deben: 1) Demostrar validación clínica específica, 2) Implementar mecanismos de monitoreo post-comercialización, 3) Mantener actualizaciones de seguridad. Requisito especial para startups de salud digital en España.",
        "source": "AEMPS",
        "category": "regulation",
        "language": "es",
        "relevance_score": 8.8,
        "tags": ["medical", "ai", "spain", "regulation"]
    },
    {
        "title": "DGSFP Actualiza Normativa para Insurtech y uso de IA",
        "url": "https://www.dgsfp.mineco.gob.es/sector/documentos/circulares/",
        "summary": "La Dirección General de Seguros actualiza las regulaciones para empresas insurtech que utilizan algoritmos de IA en la evaluación de riesgos.",
        "ai_summary": "Para empresas insurtech, la nueva normativa requiere: 1) Transparencia en algoritmos de suscripción automática, 2) Derecho de explicación para decisiones automatizadas, 3) Auditorías periódicas de sesgo algorítmico. Implementación obligatoria en 2025.",
        "source": "DGSFP",
        "category": "regulation",
        "language": "es",
        "relevance_score": 9.0,
        "tags": ["insurance", "ai", "spain", "regulation"]
    },
    {
        "title": "GDPR y IA: Nuevas Directrices de la Comisión Europea",
        "url": "https://ec.europa.eu/commission/presscorner/detail/es/ip_2024_456",
        "summary": "La Comisión Europea publica nuevas directrices sobre la aplicación del GDPR a sistemas de inteligencia artificial.",
        "ai_summary": "Las nuevas directrices GDPR-IA establecen: 1) Consentimiento específico para procesamiento de IA, 2) Evaluaciones de impacto obligatorias para IA de alto riesgo, 3) Principios de minimización de datos para entrenamientos de modelos. Afecta especialmente a startups que procesan datos de salud.",
        "source": "Comisión Europea",
        "category": "regulation",
        "language": "es",
        "relevance_score": 8.5,
        "tags": ["gdpr", "ai", "eu", "data_protection"]
    },
    {
        "title": "BOE: Nueva Ley de Digitalización del Sistema Sanitario",
        "url": "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-3456",
        "summary": "El BOE publica la nueva Ley de Digitalización del Sistema Nacional de Salud que incluye disposiciones específicas para sistemas de IA médica.",
        "ai_summary": "La nueva ley establece un marco regulatorio específico para startups de salud digital en España: 1) Certificación obligatoria para IA de diagnóstico, 2) Interoperabilidad con sistemas públicos de salud, 3) Estándares de ciberseguridad reforzados. Entrada en vigor en julio 2025.",
        "source": "BOE",
        "category": "regulation",
        "language": "es",
        "relevance_score": 9.2,
        "tags": ["medical", "spain", "regulation", "health_law"]
    },
    {
        "title": "Fondo Europeo de Innovación: 500M€ para IA Responsable en Salud",
        "url": "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/horizon-hlth-2024-care-04-02",
        "summary": "La UE lanza un programa de financiación específico para startups que desarrollen soluciones de IA responsable en el sector sanitario.",
        "ai_summary": "El programa Horizon Europe destina 500 millones de euros para startups de salud digital que cumplan con el EU AI Act. Requisitos: 1) Demostración de cumplimiento normativo, 2) Validación clínica previa, 3) Plan de escalabilidad europea. Convocatoria abierta hasta marzo 2025.",
        "source": "Horizon Europe",
        "category": "funding",
        "language": "es",
        "relevance_score": 8.0,
        "tags": ["funding", "ai", "medical", "eu"]
    }
]

async def init_news_data():
    """Initialize news data in MongoDB"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        print("🗞️  Initializing news data...")
        
        # Clear existing news (optional)
        await db.news_items.delete_many({})
        print("   Cleared existing news items")
        
        # Insert sample news
        for news_item in SAMPLE_NEWS:
            # Generate unique ID
            item_id = hashlib.md5(news_item['url'].encode()).hexdigest()
            
            # Create complete news item
            complete_item = {
                "id": item_id,
                **news_item,
                "scraped_at": datetime.now(timezone.utc) - timedelta(days=1),  # Yesterday
            }
            
            await db.news_items.insert_one(complete_item)
            print(f"   ✅ Added: {news_item['title'][:50]}...")
        
        print(f"🎉 Successfully initialized {len(SAMPLE_NEWS)} news items!")
        
        # Create text indexes for search
        try:
            await db.news_items.create_index([("title", "text"), ("summary", "text"), ("ai_summary", "text")])
            print("   ✅ Created text search indexes")
        except Exception as e:
            print(f"   ⚠️  Index creation warning: {str(e)}")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Error initializing news data: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(init_news_data())
    sys.exit(0 if success else 1)