import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Alert, AlertDescription } from './components/ui/alert';
import { 
  Brain, 
  Eye, 
  Mic, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Clock,
  Users,
  Euro,
  FileText,
  Shield,
  ArrowRight,
  ChevronRight,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';

const AlzhermDemo = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoProgress, setDemoProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Datos del caso Alzherm-IA
  const projectData = {
    name: "Alzherm-IA",
    description: "Algoritmo de IA para diagnóstico temprano de Alzheimer",
    sector: "Salud Digital",
    timeline: "2025-2028",
    targetMarket: "Hospitales Europeos",
    businessModel: "B2B",
    fundingStage: "Serie A",
    
    // Métricas técnicas
    technology: {
      detection_time: "15 minutos",
      data_sources: ["Biomarcadores cognitivos", "Datos de voz", "Movimiento ocular", "Imágenes cerebrales"],
      accuracy: "85%",
      ml_approach: "Aprendizaje automático multimodal"
    },
    
    // Análisis VESOS
    vesos: {
      score: 0.88,
      recommendation: "NO ESCALAR",
      components: {
        technical_utility: 0.58,
        user_utility: 0.55,
        feasibility: 0.48,
        cost: 0.46,
        risk: 0.68,
        degradation: 1.00
      }
    },
    
    // Análisis de riesgos
    risks: [
      {
        category: "Regulatorio",
        description: "Clasificación incorrecta como Clase IIa (debería ser Clase III)",
        impact: "Alto",
        probability: "Alta",
        mitigation: "Reclasificar dispositivo y cumplir requisitos MDR Clase III"
      },
      {
        category: "AI Act",
        description: "Incumplimiento de requisitos para sistemas de alto riesgo",
        impact: "Alto", 
        probability: "Alta",
        mitigation: "Implementar gestión de riesgos, documentación técnica, logs, supervisión humana"
      },
      {
        category: "Privacidad",
        description: "Uso de biométricos sin DPIA adecuado",
        impact: "Medio",
        probability: "Media",
        mitigation: "Realizar evaluación de impacto de protección de datos completa"
      },
      {
        category: "Sesgo Algorítmico",
        description: "Posible sesgo en diagnósticos por falta de diversidad en datos",
        impact: "Alto",
        probability: "Media",
        mitigation: "Auditorías de sesgo y mejora de datasets de entrenamiento"
      },
      {
        category: "Ciberseguridad",
        description: "Vulnerabilidades en manejo de datos médicos sensibles",
        impact: "Alto",
        probability: "Media",
        mitigation: "Implementar ISO 27001 y auditorías de seguridad regulares"
      }
    ],
    
    // Compliance requerido
    compliance: [
      { name: "MDR Clase III", status: "No Cumple", priority: "Crítico" },
      { name: "AI Act Alto Riesgo", status: "No Cumple", priority: "Crítico" },
      { name: "GDPR/LOPDGDD", status: "Parcial", priority: "Alto" },
      { name: "ISO 13485", status: "No Iniciado", priority: "Alto" },
      { name: "ISO 14971", status: "Parcial", priority: "Alto" },
      { name: "ISO 27001", status: "No Iniciado", priority: "Medio" }
    ]
  };

  const demoSteps = [
    {
      id: "introduction",
      title: "Presentación del Caso",
      description: "Conoce Alzherm-IA y su innovadora propuesta",
      component: "intro"
    },
    {
      id: "technology",
      title: "Análisis Tecnológico",
      description: "Evaluación de la solución técnica",
      component: "technology"
    },
    {
      id: "vesos",
      title: "Análisis ICU-VESOS",
      description: "Metodología de evaluación de proyectos",
      component: "vesos"
    },
    {
      id: "risks",
      title: "Evaluación de Riesgos",
      description: "Identificación y análisis de riesgos",
      component: "risks"
    },
    {
      id: "compliance",
      title: "Análisis de Compliance",
      description: "Revisión de cumplimiento normativo",
      component: "compliance"
    },
    {
      id: "recommendations",
      title: "Recomendaciones",
      description: "Plan de acción y próximos pasos",
      component: "recommendations"
    }
  ];

  useEffect(() => {
    setDemoProgress((currentStep / (demoSteps.length - 1)) * 100);
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 3000);
  };

  const renderIntroduction = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl text-white mb-6">
          <Brain className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">{projectData.name}</h2>
          <p className="text-xl opacity-90">{projectData.description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Información del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Sector:</span>
              <Badge variant="outline">{projectData.sector}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Modelo de negocio:</span>
              <span className="font-medium">{projectData.businessModel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Mercado objetivo:</span>
              <span className="font-medium">{projectData.targetMarket}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Timeline:</span>
              <span className="font-medium">{projectData.timeline}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Etapa de financiación:</span>
              <Badge className="bg-green-100 text-green-800">{projectData.fundingStage}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Propuesta de Valor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-green-600 mt-1" />
                <div>
                  <div className="font-medium">Diagnóstico Rápido</div>
                  <div className="text-sm text-slate-600">Resultados en {projectData.technology.detection_time}</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <div className="font-medium">Detección Temprana</div>
                  <div className="text-sm text-slate-600">Mejora outcomes del paciente</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <BarChart3 className="h-5 w-5 text-orange-600 mt-1" />
                <div>
                  <div className="font-medium">Precisión {projectData.technology.accuracy}</div>
                  <div className="text-sm text-slate-600">Apoyo a la decisión clínica</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <strong>Caso Educativo:</strong> Este es un caso ficticio diseñado para demostrar las capacidades de análisis de compliance y riesgos de nuestra plataforma. Los datos son realistas y basados en el sector de salud digital.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderTechnology = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Análisis Tecnológico</h3>
        <p className="text-slate-600">Evaluación de la arquitectura y capacidades técnicas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arquitectura del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Fuentes de Datos</h4>
              <div className="space-y-3">
                {projectData.technology.data_sources.map((source, index) => {
                  const icons = [Brain, Mic, Eye, Activity];
                  const Icon = icons[index] || FileText;
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <span>{source}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Métricas Técnicas</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Tiempo de procesamiento:</span>
                  <Badge className="bg-green-100 text-green-800">{projectData.technology.detection_time}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Precisión del modelo:</span>
                  <Badge className="bg-blue-100 text-blue-800">{projectData.technology.accuracy}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Enfoque ML:</span>
                  <span className="text-sm">{projectData.technology.ml_approach}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-600" />
            Flujo de Diagnóstico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 text-center">
              <div className="bg-blue-100 p-3 rounded-lg mb-2">
                <Users className="h-6 w-6 text-blue-600 mx-auto" />
              </div>
              <div className="text-sm font-medium">Paciente</div>
              <div className="text-xs text-slate-500">Ingreso</div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
            <div className="flex-1 text-center">
              <div className="bg-green-100 p-3 rounded-lg mb-2">
                <Activity className="h-6 w-6 text-green-600 mx-auto" />
              </div>
              <div className="text-sm font-medium">Captura</div>
              <div className="text-xs text-slate-500">Datos multimodales</div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
            <div className="flex-1 text-center">
              <div className="bg-purple-100 p-3 rounded-lg mb-2">
                <Brain className="h-6 w-6 text-purple-600 mx-auto" />
              </div>
              <div className="text-sm font-medium">Análisis IA</div>
              <div className="text-xs text-slate-500">Procesamiento</div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
            <div className="flex-1 text-center">
              <div className="bg-orange-100 p-3 rounded-lg mb-2">
                <FileText className="h-6 w-6 text-orange-600 mx-auto" />
              </div>
              <div className="text-sm font-medium">Reporte</div>
              <div className="text-xs text-slate-500">15 minutos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderVESOS = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Análisis ICU-VESOS</h3>
        <p className="text-slate-600">Metodología de Innovación Conducida por la Utilidad</p>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-red-500 to-red-600 rounded-full text-white mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{projectData.vesos.score}</div>
            <div className="text-sm">Score VESOS</div>
          </div>
        </div>
        <div className="mb-4">
          <Badge className="text-lg px-4 py-2 bg-red-100 text-red-800">
            {projectData.vesos.recommendation}
          </Badge>
        </div>
        <p className="text-slate-600">
          Un score inferior a 1.0 indica que el proyecto debe <strong>iterar o detenerse</strong> antes de escalar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(projectData.vesos.components).map(([key, value]) => {
          const labels = {
            technical_utility: "Utilidad Técnica",
            user_utility: "Utilidad Usuario",
            feasibility: "Factibilidad",
            cost: "Coste",
            risk: "Riesgo",
            degradation: "Degradación"
          };
          
          const getColor = (val) => {
            if (val >= 0.8) return "text-green-600 bg-green-50";
            if (val >= 0.6) return "text-yellow-600 bg-yellow-50";
            return "text-red-600 bg-red-50";
          };

          return (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold mb-1 ${getColor(value)}`}>
                  {value.toFixed(2)}
                </div>
                <div className="text-sm text-slate-600">{labels[key]}</div>
                <Progress value={value * 100} className="mt-2 h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Análisis Crítico:</strong> Los bajos scores en Factibilidad (0.48) y Coste (0.46) indican problemas significativos en la viabilidad técnica y económica del proyecto. Es necesario abordar estos aspectos antes de proceder.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderRisks = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Evaluación de Riesgos</h3>
        <p className="text-slate-600">Análisis detallado de riesgos identificados</p>
      </div>

      <div className="space-y-4">
        {projectData.risks.map((risk, index) => {
          const getRiskColor = (impact, probability) => {
            if (impact === "Alto" && probability === "Alta") return "border-red-200 bg-red-50";
            if (impact === "Alto" || probability === "Alta") return "border-orange-200 bg-orange-50";
            return "border-yellow-200 bg-yellow-50";
          };

          const getRiskBadgeColor = (impact) => {
            if (impact === "Alto") return "bg-red-100 text-red-800";
            if (impact === "Medio") return "bg-yellow-100 text-yellow-800";
            return "bg-green-100 text-green-800";
          };

          return (
            <Card key={index} className={getRiskColor(risk.impact, risk.probability)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{risk.category}</CardTitle>
                  <div className="flex space-x-2">
                    <Badge className={getRiskBadgeColor(risk.impact)}>
                      {risk.impact}
                    </Badge>
                    <Badge variant="outline">
                      {risk.probability} probabilidad
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 mb-3">{risk.description}</p>
                <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                  <div className="text-sm font-medium text-blue-900 mb-1">Plan de Mitigación:</div>
                  <div className="text-sm text-blue-800">{risk.mitigation}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Análisis de Compliance</h3>
        <p className="text-slate-600">Estado de cumplimiento normativo</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {projectData.compliance.map((item, index) => {
          const getStatusColor = (status) => {
            switch (status) {
              case "Cumple": return "text-green-600 bg-green-50";
              case "Parcial": return "text-yellow-600 bg-yellow-50";
              case "No Cumple": return "text-red-600 bg-red-50";
              case "No Iniciado": return "text-gray-600 bg-gray-50";
              default: return "text-gray-600 bg-gray-50";
            }
          };

          const getStatusIcon = (status) => {
            switch (status) {
              case "Cumple": return <CheckCircle className="h-5 w-5 text-green-600" />;
              case "Parcial": return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
              case "No Cumple": return <XCircle className="h-5 w-5 text-red-600" />;
              case "No Iniciado": return <Clock className="h-5 w-5 text-gray-600" />;
              default: return <Clock className="h-5 w-5 text-gray-600" />;
            }
          };

          const getPriorityColor = (priority) => {
            switch (priority) {
              case "Crítico": return "bg-red-100 text-red-800";
              case "Alto": return "bg-orange-100 text-orange-800";
              case "Medio": return "bg-yellow-100 text-yellow-800";
              default: return "bg-gray-100 text-gray-800";
            }
          };

          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(item.status)}
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}
                  </Badge>
                </div>
                <div className={`text-center py-2 px-3 rounded text-sm font-medium ${getStatusColor(item.status)}`}>
                  {item.status}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Estado Crítico:</strong> El proyecto presenta incumplimientos críticos en MDR Clase III y AI Act que deben resolverse antes de cualquier deployment comercial.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Recomendaciones</h3>
        <p className="text-slate-600">Plan de acción basado en el análisis</p>
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            Recomendación Principal: NO ESCALAR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">
            El análisis ICU-VESOS indica que Alzherm-IA no debe proceder con el escalado hasta resolver los problemas críticos identificados.
          </p>
          <div className="bg-white p-4 rounded border">
            <div className="font-semibold text-slate-900 mb-2">Justificación:</div>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>• Score VESOS de 0.88 (inferior al umbral de 1.0)</li>
              <li>• Factibilidad muy baja (0.48) por problemas regulatorios</li>
              <li>• Riesgos altos no mitigados (0.68)</li>
              <li>• Incumplimientos críticos de normativas</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Plan de Remediación (6-12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="font-semibold text-blue-900">Fase 1: Compliance Crítico (0-3 meses)</div>
                <ul className="text-sm text-slate-700 mt-2 space-y-1">
                  <li>• Reclasificar dispositivo como MDR Clase III</li>
                  <li>• Implementar requisitos AI Act para alto riesgo</li>
                  <li>• Realizar DPIA completo para biométricos</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <div className="font-semibold text-green-900">Fase 2: Mejoras Técnicas (3-6 meses)</div>
                <ul className="text-sm text-slate-700 mt-2 space-y-1">
                  <li>• Mejorar explicabilidad del algoritmo</li>
                  <li>• Implementar sistema robusto MLOps</li>
                  <li>• Desarrollar mecanismos de fallback</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="font-semibold text-purple-900">Fase 3: Validación (6-12 meses)</div>
                <ul className="text-sm text-slate-700 mt-2 space-y-1">
                  <li>• Auditorías de sesgo algorítmico</li>
                  <li>• Pilotos controlados en centros certificados</li>
                  <li>• Nuevo análisis VESOS antes de escalar</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertDescription>
          <strong>Perspectiva:</strong> Con la remediación adecuada, Alzherm-IA tiene potencial para alcanzar un score VESOS superior a 1.2 y proceder con éxito al escalado comercial.
        </AlertDescription>
      </Alert>
    </div>
  );

  const getCurrentStepComponent = () => {
    const step = demoSteps[currentStep];
    switch (step.component) {
      case "intro": return renderIntroduction();
      case "technology": return renderTechnology();
      case "vesos": return renderVESOS();
      case "risks": return renderRisks();
      case "compliance": return renderCompliance();
      case "recommendations": return renderRecommendations();
      default: return renderIntroduction();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Demo Interactiva: Caso Alzherm-IA</h1>
              <p className="opacity-90">Análisis completo de compliance para startup de salud digital</p>
            </div>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              ✕
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso: {currentStep + 1} de {demoSteps.length}</span>
              <span>{Math.round(demoProgress)}%</span>
            </div>
            <Progress value={demoProgress} className="h-2 bg-white bg-opacity-20" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {getCurrentStepComponent()}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {demoSteps[currentStep].title}: {demoSteps[currentStep].description}
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Anterior
            </Button>
            {currentStep < demoSteps.length - 1 ? (
              <Button onClick={nextStep}>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700"
              >
                Finalizar Demo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlzhermDemo;