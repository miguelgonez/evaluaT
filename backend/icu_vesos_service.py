#!/usr/bin/env python3
"""
ICU-VESOS Service - Innovation Driven by Utility Framework
Implementa la metodología ICU-VESOS para evaluación y priorización de iniciativas
de salud digital e insurtech basada en los documentos proporcionados.
"""

import os
import uuid
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
import math

logger = logging.getLogger(__name__)

class VESIntervalModel(BaseModel):
    """Modelo para intervalos de confianza VES"""
    lower_bound: float = Field(ge=0, le=1)
    upper_bound: float = Field(ge=0, le=1)
    confidence_level: float = Field(ge=0.5, le=0.99, default=0.95)

class UtilityIndicators(BaseModel):
    """Indicadores de utilidad técnica y aspiracional"""
    technical_utility: float = Field(ge=0, le=10, description="Utilidad Técnica (UT)")
    aspirational_utility: float = Field(ge=0, le=10, description="Utilidad Aspiracional (UA)")
    
class FeasibilityFactors(BaseModel):
    """Factores de factibilidad"""
    technological_maturity: float = Field(ge=0, le=10)
    budget_availability: float = Field(ge=0, le=10)
    team_competence: float = Field(ge=0, le=10)
    regulatory_clarity: float = Field(ge=0, le=10)

class RiskAssessment(BaseModel):
    """Evaluación de riesgos con matriz Probabilidad x Impacto"""
    probability: float = Field(ge=0, le=1, description="Probabilidad (0-1)")
    impact: float = Field(ge=0, le=10, description="Impacto (0-10)")
    mitigation_measures: List[str] = []
    
class VESOSInput(BaseModel):
    """Input completo para cálculo VESOS"""
    project_id: str
    project_name: str
    organization: str
    sector: str  # "digital_health" or "insurtech"
    
    # Utilidad
    utility: UtilityIndicators
    
    # Factibilidad
    feasibility: FeasibilityFactors
    
    # Coste (en euros)
    cost: float = Field(gt=0)
    
    # Riesgo
    risks: List[RiskAssessment]
    
    # Tiempo (en meses)
    time_months: float = Field(gt=0)
    
    # Contexto adicional
    problem_statement: str
    expected_users: int
    compliance_requirements: List[str] = []

class VESOSResult(BaseModel):
    """Resultado del análisis VESOS"""
    vesos_score: float
    recommendation: str  # "ESCALAR", "ITERAR", "DETENER"
    confidence_interval: VESIntervalModel
    detailed_analysis: Dict
    risk_level: str  # "LOW", "MEDIUM", "HIGH"
    compliance_score: float
    next_steps: List[str]

class ICUVESOSService:
    def __init__(self, db_client: AsyncIOMotorClient):
        self.db = db_client[os.environ.get('DB_NAME', 'ai_compliance')]
    
    def calculate_feasibility_score(self, feasibility: FeasibilityFactors) -> float:
        """Calcula puntuación de factibilidad ponderada"""
        weights = {
            'technological_maturity': 0.3,
            'budget_availability': 0.25,
            'team_competence': 0.25,
            'regulatory_clarity': 0.2
        }
        
        score = (
            feasibility.technological_maturity * weights['technological_maturity'] +
            feasibility.budget_availability * weights['budget_availability'] +
            feasibility.team_competence * weights['team_competence'] +
            feasibility.regulatory_clarity * weights['regulatory_clarity']
        )
        
        return min(score, 10.0)
    
    def calculate_risk_score(self, risks: List[RiskAssessment]) -> Tuple[float, str]:
        """Calcula puntuación de riesgo agregada"""
        if not risks:
            return 0.0, "LOW"
        
        # Agregación de riesgos usando probabilidad e impacto
        total_risk = 0.0
        for risk in risks:
            risk_value = risk.probability * risk.impact
            total_risk += risk_value
        
        # Normalizar a escala 0-10
        max_possible_risk = len(risks) * 10
        normalized_risk = (total_risk / max_possible_risk) * 10 if max_possible_risk > 0 else 0
        
        # Clasificar nivel de riesgo
        if normalized_risk <= 3:
            risk_level = "LOW"
        elif normalized_risk <= 7:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
        return normalized_risk, risk_level
    
    def calculate_compliance_score(self, sector: str, requirements: List[str]) -> float:
        """Calcula puntuación de compliance basada en regulaciones cubiertas"""
        # Regulaciones por sector según los documentos
        sector_regulations = {
            "digital_health": [
                "AI Act", "MDR", "GDPR", "LOPDGDD", "EHDS", "NIS2", 
                "Ley 41/2002", "ISO 27001", "ISO 13485", "ISO 14971"
            ],
            "insurtech": [
                "AI Act", "GDPR", "LOPDGDD", "NIS2", "Ley del Contrato de Seguro",
                "Solvencia II", "ISO 27001", "ISO 31000"
            ]
        }
        
        required_regs = sector_regulations.get(sector, [])
        if not required_regs:
            return 5.0  # Score neutral si sector desconocido
        
        # Porcentaje de regulaciones cubiertas
        covered = len([req for req in requirements if any(reg in req for reg in required_regs)])
        coverage_percentage = covered / len(required_regs)
        
        return min(coverage_percentage * 10, 10.0)
    
    def calculate_time_factor(self, time_months: float) -> float:
        """Calcula factor de tiempo usando función exponencial decreciente"""
        # Factor de tiempo que decrece exponencialmente
        # Proyectos más largos tienen menor factor de tiempo
        return math.exp(-time_months / 12)  # Factor basado en años
    
    def calculate_vesos_score(self, input_data: VESOSInput) -> VESOSResult:
        """Calcula el índice VESOS completo según la metodología"""
        
        # 1. Calcular componentes individuales
        utility_score = (input_data.utility.technical_utility + input_data.utility.aspirational_utility) / 2
        feasibility_score = self.calculate_feasibility_score(input_data.feasibility)
        risk_score, risk_level = self.calculate_risk_score(input_data.risks)
        compliance_score = self.calculate_compliance_score(input_data.sector, input_data.compliance_requirements)
        time_factor = self.calculate_time_factor(input_data.time_months)
        
        # 2. Normalizar coste (escala logarítmica)
        cost_factor = max(0.1, 10 - math.log10(max(input_data.cost, 1000)) + 3)
        
        # 3. Fórmula VESOS adaptada
        # VESOS = (UT + UA) * F * (1 - R/10) * T_factor * (C_factor/10) * (Compliance/10)
        vesos_score = (
            utility_score * 
            (feasibility_score / 10) * 
            (1 - risk_score / 10) * 
            time_factor * 
            (cost_factor / 10) * 
            (compliance_score / 10)
        )
        
        # 4. Determinar recomendación
        if vesos_score > 1.5:
            recommendation = "ESCALAR"
            next_steps = [
                "Proceder con implementación completa",
                "Asegurar presupuesto y recursos",
                "Establecer métricas de seguimiento",
                "Preparar plan de escalado"
            ]
        elif vesos_score > 0.8:
            recommendation = "ITERAR"
            next_steps = [
                "Realizar mejoras en las áreas de menor puntuación",
                "Ejecutar piloto controlado",
                "Revisar análisis de riesgos",
                "Re-evaluar en 3 meses"
            ]
        else:
            recommendation = "DETENER"
            next_steps = [
                "Suspender el proyecto actual",
                "Analizar lecciones aprendidas",
                "Considerar alternativas",
                "Re-plantear el problema"
            ]
        
        # 5. Calcular intervalo de confianza (simplificado)
        confidence_range = 0.1 * (1 - min(feasibility_score, compliance_score) / 10)
        confidence_interval = VESIntervalModel(
            lower_bound=max(0, vesos_score - confidence_range),
            upper_bound=min(2, vesos_score + confidence_range)
        )
        
        # 6. Análisis detallado
        detailed_analysis = {
            "utility_score": utility_score,
            "feasibility_score": feasibility_score,
            "risk_score": risk_score,
            "compliance_score": compliance_score,
            "cost_factor": cost_factor,
            "time_factor": time_factor,
            "component_breakdown": {
                "technical_utility": input_data.utility.technical_utility,
                "aspirational_utility": input_data.utility.aspirational_utility,
                "technological_maturity": input_data.feasibility.technological_maturity,
                "budget_availability": input_data.feasibility.budget_availability,
                "team_competence": input_data.feasibility.team_competence,
                "regulatory_clarity": input_data.feasibility.regulatory_clarity
            },
            "sector_specific_analysis": self._get_sector_analysis(input_data.sector),
            "compliance_gaps": self._identify_compliance_gaps(input_data.sector, input_data.compliance_requirements)
        }
        
        return VESOSResult(
            vesos_score=round(vesos_score, 3),
            recommendation=recommendation,
            confidence_interval=confidence_interval,
            detailed_analysis=detailed_analysis,
            risk_level=risk_level,
            compliance_score=round(compliance_score, 2),
            next_steps=next_steps
        )
    
    def _get_sector_analysis(self, sector: str) -> Dict:
        """Análisis específico por sector"""
        analyses = {
            "digital_health": {
                "key_regulations": ["AI Act", "MDR", "GDPR", "EHDS"],
                "critical_factors": ["Seguridad del paciente", "Interoperabilidad", "Evidencia clínica"],
                "typical_risks": ["Regulatorio", "Técnico", "Adopción clínica"],
                "success_metrics": ["Mejora en resultados clínicos", "Satisfacción del paciente", "Eficiencia operativa"]
            },
            "insurtech": {
                "key_regulations": ["AI Act", "GDPR", "Solvencia II"],
                "critical_factors": ["Gestión de riesgos", "Transparencia algorítmica", "Protección del consumidor"],
                "typical_risks": ["Regulatorio", "Actuarial", "Reputacional"],
                "success_metrics": ["Reducción de siniestralidad", "Satisfacción del cliente", "Eficiencia operativa"]
            }
        }
        
        return analyses.get(sector, {})
    
    def _identify_compliance_gaps(self, sector: str, current_requirements: List[str]) -> List[str]:
        """Identifica gaps de compliance"""
        sector_regulations = {
            "digital_health": ["AI Act", "MDR", "GDPR", "LOPDGDD", "EHDS", "NIS2"],
            "insurtech": ["AI Act", "GDPR", "LOPDGDD", "NIS2", "Solvencia II"]
        }
        
        required = sector_regulations.get(sector, [])
        gaps = []
        
        for regulation in required:
            if not any(regulation in req for req in current_requirements):
                gaps.append(regulation)
        
        return gaps
    
    async def save_vesos_analysis(self, analysis: VESOSResult, input_data: VESOSInput) -> str:
        """Guarda análisis VESOS en base de datos"""
        try:
            document = {
                "id": str(uuid.uuid4()),
                "project_id": input_data.project_id,
                "project_name": input_data.project_name,
                "organization": input_data.organization,
                "sector": input_data.sector,
                "vesos_score": analysis.vesos_score,
                "recommendation": analysis.recommendation,
                "risk_level": analysis.risk_level,
                "compliance_score": analysis.compliance_score,
                "input_data": input_data.dict(),
                "analysis_result": analysis.dict(),
                "created_at": datetime.now(timezone.utc),
                "status": "active"
            }
            
            result = await self.db.vesos_analyses.insert_one(document)
            return document["id"]
            
        except Exception as e:
            logger.error(f"Error saving VESOS analysis: {str(e)}")
            raise
    
    async def get_vesos_analyses(self, organization: str = None, sector: str = None, limit: int = 50) -> List[Dict]:
        """Obtiene análisis VESOS guardados"""
        try:
            query = {"status": "active"}
            if organization:
                query["organization"] = organization
            if sector:
                query["sector"] = sector
                
            cursor = self.db.vesos_analyses.find(query).sort("created_at", -1).limit(limit)
            analyses = await cursor.to_list(length=limit)
            
            return analyses
            
        except Exception as e:
            logger.error(f"Error retrieving VESOS analyses: {str(e)}")
            return []

# Instancia global del servicio
icu_vesos_service = None

def get_icu_vesos_service(db_client: AsyncIOMotorClient) -> ICUVESOSService:
    """Factory function para obtener instancia del servicio"""
    global icu_vesos_service
    if icu_vesos_service is None:
        icu_vesos_service = ICUVESOSService(db_client)
    return icu_vesos_service