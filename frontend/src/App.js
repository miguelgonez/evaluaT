import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import shadcn components
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
import { Separator } from './components/ui/separator';

// Icons
import { Shield, Users, FileText, BarChart3, CheckCircle, AlertTriangle, XCircle, Menu, X, ArrowRight, Zap, Globe, Lock, Target, TrendingUp, Award } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Validate token by making a request
      axios.get(`${API}/dashboard/stats`)
        .then(() => {
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Landing Page Component
const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="relative bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI Compliance Pro
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">Características</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 transition-colors">Cómo Funciona</a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors">Precios</a>
              <Button variant="outline" onClick={() => window.location.href = '/auth'}>
                Iniciar Sesión
              </Button>
              <Button onClick={() => window.location.href = '/auth'}>
                Empezar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg">
            <div className="px-6 py-4 space-y-4">
              <a href="#features" className="block text-slate-600 hover:text-blue-600">Características</a>
              <a href="#how-it-works" className="block text-slate-600 hover:text-blue-600">Cómo Funciona</a>
              <a href="#pricing" className="block text-slate-600 hover:text-blue-600">Precios</a>
              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/auth'}>
                  Iniciar Sesión
                </Button>
                <Button className="w-full" onClick={() => window.location.href = '/auth'}>
                  Empezar Gratis
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  Cumplimiento EU AI Act
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Evalúa el{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Cumplimiento de IA
                  </span>{' '}
                  de tu Startup
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Plataforma SaaS especializada en autoevaluación del Reglamento de IA de la UE para startups de salud digital e insurtech. Obtén reportes detallados y recomendaciones personalizadas.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={() => window.location.href = '/auth'}>
                  Evaluar Ahora
                  <Shield className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  Ver Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">500+</div>
                  <div className="text-sm text-slate-600">Startups Evaluadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">99%</div>
                  <div className="text-sm text-slate-600">Precisión</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">24h</div>
                  <div className="text-sm text-slate-600">Reporte Listo</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlfGVufDB8fHx8MTc1ODAwMzczM3ww&ixlib=rb-4.1.0&q=85"
                  alt="AI Technology"
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-4 border border-slate-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="font-semibold text-slate-900">Certificado EU AI Act</div>
                    <div className="text-sm text-slate-600">Cumplimiento Verificado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
              Características Principales
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900">
              Todo lo que Necesitas para el Cumplimiento de IA
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Herramientas completas para evaluar, monitorear y mantener el cumplimiento del Reglamento de IA de la UE
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-blue-100 p-3 rounded-lg w-fit">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Evaluación Automatizada</CardTitle>
                <CardDescription>
                  Cuestionarios inteligentes basados en el EU AI Act para identificar el nivel de riesgo de tus sistemas de IA
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-green-100 p-3 rounded-lg w-fit">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Dashboard de Métricas</CardTitle>
                <CardDescription>
                  Visualiza tu estado de cumplimiento con métricas en tiempo real y indicadores de progreso
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-purple-100 p-3 rounded-lg w-fit">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Recomendaciones Personalizadas</CardTitle>
                <CardDescription>
                  Recibe sugerencias específicas para mejorar el cumplimiento basadas en tu perfil de riesgo
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-orange-100 p-3 rounded-lg w-fit">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Reportes Profesionales</CardTitle>
                <CardDescription>
                  Genera reportes detallados listos para auditorías y revisiones regulatorias
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-teal-100 p-3 rounded-lg w-fit">
                  <TrendingUp className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle>Seguimiento Continuo</CardTitle>
                <CardDescription>
                  Monitorea cambios en el cumplimiento y mantente actualizado con nuevas regulaciones
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-red-100 p-3 rounded-lg w-fit">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Seguridad Garantizada</CardTitle>
                <CardDescription>
                  Protección de datos empresariales con estándares de seguridad bancaria
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-white">
            ¿Listo para Asegurar el Cumplimiento de tu IA?
          </h2>
          <p className="text-xl text-blue-100">
            Únete a cientos de startups que ya confían en nuestra plataforma para mantener el cumplimiento del EU AI Act
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => window.location.href = '/auth'}>
              Empezar Evaluación Gratuita
              <Zap className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              Hablar con Experto
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">AI Compliance Pro</span>
            </div>
            <div className="text-slate-400">
              © 2024 AI Compliance Pro. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Auth Component
const AuthComponent = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    company_name: '',
    company_type: 'digital_health'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`${API}${endpoint}`, payload);
      login(response.data.user, response.data.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error en autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-lg w-fit mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Accede a tu dashboard de cumplimiento' : 'Comienza tu evaluación de IA'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nombre de la Empresa</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_type">Tipo de Empresa</Label>
                  <Select value={formData.company_type} onValueChange={(value) => setFormData({...formData, company_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital_health">Salud Digital</SelectItem>
                      <SelectItem value="insurtech">Insurtech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline text-sm"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, assessmentsResponse] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/assessments`)
      ]);
      
      setStats(statsResponse.data);
      setAssessments(assessmentsResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (riskLevel) => {
    const configs = {
      minimal: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, text: 'Riesgo Mínimo' },
      limited: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle, text: 'Riesgo Limitado' },
      high: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle, text: 'Alto Riesgo' },
      unacceptable: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, text: 'Riesgo Inaceptable' }
    };
    
    const config = configs[riskLevel] || configs.minimal;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">AI Compliance Pro</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Bienvenido, {user?.company_name}
              </span>
              <Button variant="outline" onClick={logout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Evaluaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_assessments || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Puntuación de Riesgo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.latest_risk_score?.toFixed(1) || '0.0'}/10.0</div>
              <Progress value={(stats?.latest_risk_score || 0) * 10} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Estado de Cumplimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.compliance_status === 'compliant' && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Cumple
                  </Badge>
                )}
                {stats?.compliance_status === 'partially_compliant' && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Parcial
                  </Badge>
                )}
                {stats?.compliance_status === 'non_compliant' && (
                  <Badge className="bg-red-100 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    No Cumple
                  </Badge>
                )}
                {stats?.compliance_status === 'not_assessed' && (
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                    Sin Evaluar
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Recomendaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.recommendations_count || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Assessment Button */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Nueva Evaluación
                </CardTitle>
                <CardDescription>
                  Realiza una nueva evaluación de cumplimiento del EU AI Act
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.location.href = '/assessment'} className="w-full">
                  Iniciar Evaluación
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Recent Assessments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evaluaciones Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assessments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No hay evaluaciones aún. ¡Realiza tu primera evaluación!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assessments.slice(0, 5).map((assessment) => (
                      <div key={assessment.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {new Date(assessment.created_at).toLocaleDateString('es-ES')}
                          </div>
                          <div className="text-sm text-slate-600">
                            Puntuación: {assessment.risk_score.toFixed(1)}/10.0
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {getRiskBadge(assessment.risk_level)}
                          <div>
                            <Button variant="outline" size="sm">
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de la Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-slate-600">Nombre</div>
                  <div className="font-medium">{user?.company_name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Tipo</div>
                  <div className="font-medium">
                    {user?.company_type === 'digital_health' ? 'Salud Digital' : 'Insurtech'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Email</div>
                  <div className="font-medium">{user?.email}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recursos Útiles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <a href="#" className="block text-blue-600 hover:underline text-sm">
                  Guía del EU AI Act
                </a>
                <a href="#" className="block text-blue-600 hover:underline text-sm">
                  Mejores Prácticas
                </a>
                <a href="#" className="block text-blue-600 hover:underline text-sm">
                  Contactar Soporte
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Assessment Component
const AssessmentComponent = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const questions = [
    {
      id: 'company_description',
      question: '¿Cuál es la actividad principal de su empresa?',
      type: 'radio',
      options: [
        { value: 'medical_diagnosis', label: 'Diagnóstico médico con IA' },
        { value: 'treatment_recommendation', label: 'Recomendaciones de tratamiento' },
        { value: 'insurance_risk_assessment', label: 'Evaluación de riesgos de seguros' },
        { value: 'automated_underwriting', label: 'Suscripción automática' },
        { value: 'other', label: 'Otro' }
      ]
    },
    {
      id: 'medical_diagnosis',
      question: '¿Su sistema de IA realiza diagnósticos médicos automáticos?',
      type: 'radio',
      options: [
        { value: 'yes', label: 'Sí, diagnósticos completamente automáticos' },
        { value: 'partial', label: 'Sí, pero con supervisión médica' },
        { value: 'no', label: 'No, solo proporciona información de apoyo' }
      ]
    },
    {
      id: 'automated_decision_making',
      question: '¿Su IA toma decisiones automatizadas que afectan significativamente a las personas?',
      type: 'radio',
      options: [
        { value: 'yes', label: 'Sí, decisiones completamente automáticas' },
        { value: 'partial', label: 'Sí, pero con revisión humana' },
        { value: 'no', label: 'No, solo recomendaciones' }
      ]
    },
    {
      id: 'biometric_identification',
      question: '¿Utiliza identificación biométrica en tiempo real?',
      type: 'radio',
      options: [
        { value: 'yes', label: 'Sí, identificación biométrica en tiempo real' },
        { value: 'partial', label: 'Sí, pero no en tiempo real' },
        { value: 'no', label: 'No utiliza identificación biométrica' }
      ]
    },
    {
      id: 'emotion_recognition',
      question: '¿Su sistema reconoce o categoriza emociones?',
      type: 'radio',
      options: [
        { value: 'yes', label: 'Sí, reconocimiento de emociones' },
        { value: 'partial', label: 'Parcialmente, análisis de sentimientos básico' },
        { value: 'no', label: 'No reconoce emociones' }
      ]
    },
    {
      id: 'data_processing',
      question: '¿Qué tipo de datos personales procesa su IA?',
      type: 'radio',
      options: [
        { value: 'sensitive', label: 'Datos de salud, biométricos o genéticos' },
        { value: 'personal', label: 'Datos personales generales' },
        { value: 'anonymous', label: 'Solo datos anonimizados' },
        { value: 'none', label: 'No procesa datos personales' }
      ]
    },
    {
      id: 'transparency',
      question: '¿Los usuarios están informados sobre el uso de IA?',
      type: 'radio',
      options: [
        { value: 'full', label: 'Información completa y clara' },
        { value: 'partial', label: 'Información básica' },
        { value: 'minimal', label: 'Información mínima' },
        { value: 'none', label: 'No se informa explícitamente' }
      ]
    },
    {
      id: 'human_oversight',
      question: '¿Existe supervisión humana en las decisiones de IA?',
      type: 'radio',
      options: [
        { value: 'continuous', label: 'Supervisión humana continua' },
        { value: 'periodic', label: 'Revisión periódica por humanos' },
        { value: 'exception', label: 'Solo en casos excepcionales' },
        { value: 'none', label: 'No hay supervisión humana' }
      ]
    }
  ];

  const handleAnswer = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitAssessment = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/assessments`, { responses });
      setResult(response.data);
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Resultados de la Evaluación</CardTitle>
              <CardDescription>
                Evaluación completada el {new Date(result.created_at).toLocaleDateString('es-ES')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Score */}
              <div className="text-center space-y-4">
                <div>
                  <div className="text-4xl font-bold text-slate-900">{result.risk_score.toFixed(1)}/10.0</div>
                  <div className="text-slate-600">Puntuación de Riesgo</div>
                </div>
                <Progress value={result.risk_score * 10} className="max-w-md mx-auto" />
                
                <div className="flex justify-center">
                  {result.risk_level === 'minimal' && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-lg px-4 py-2">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Riesgo Mínimo
                    </Badge>
                  )}
                  {result.risk_level === 'limited' && (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-lg px-4 py-2">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Riesgo Limitado
                    </Badge>
                  )}
                  {result.risk_level === 'high' && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-lg px-4 py-2">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Alto Riesgo
                    </Badge>
                  )}
                  {result.risk_level === 'unacceptable' && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-lg px-4 py-2">
                      <XCircle className="h-4 w-4 mr-2" />
                      Riesgo Inaceptable
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Compliance Status */}
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Estado de Cumplimiento</h3>
                {result.compliance_status === 'compliant' && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-lg px-4 py-2">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Cumple con EU AI Act
                  </Badge>
                )}
                {result.compliance_status === 'partially_compliant' && (
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-lg px-4 py-2">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Cumplimiento Parcial
                  </Badge>
                )}
                {result.compliance_status === 'non_compliant' && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-lg px-4 py-2">
                    <XCircle className="h-4 w-4 mr-2" />
                    No Cumple
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recomendaciones</h3>
                <div className="space-y-3">
                  {result.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4 justify-center pt-4">
                <Button onClick={() => window.location.href = '/dashboard'}>
                  Volver al Dashboard
                </Button>
                <Button variant="outline" onClick={() => {
                  // Generate report functionality would go here
                  alert('Funcionalidad de reporte próximamente');
                }}>
                  Generar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Procesando evaluación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Evaluación EU AI Act</span>
              <span className="text-sm font-normal text-slate-600">
                {currentStep + 1} de {questions.length}
              </span>
            </CardTitle>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
              
              <RadioGroup
                value={responses[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              >
                {currentQuestion.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevious} 
                disabled={currentStep === 0}
              >
                Anterior
              </Button>
              
              <Button 
                onClick={handleNext}
                disabled={!responses[currentQuestion.id]}
              >
                {currentStep === questions.length - 1 ? 'Finalizar' : 'Siguiente'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthComponent />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/assessment" element={user ? <AssessmentComponent /> : <Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

// Wrap App with AuthProvider
export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}