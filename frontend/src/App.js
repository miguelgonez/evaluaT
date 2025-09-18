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
import { Textarea } from './components/ui/textarea';
import { ScrollArea } from './components/ui/scroll-area';

// Icons
import { Shield, Users, FileText, BarChart3, CheckCircle, AlertTriangle, XCircle, Menu, X, ArrowRight, Zap, Globe, Lock, Target, TrendingUp, Award, MessageCircle, Newspaper, BookOpen, Search, Send, Trash2, Plus, FileSearch, Tag, Calendar, Clock, AlertCircle, PenTool } from 'lucide-react';

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
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider useEffect - Token:', token);
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const userData = localStorage.getItem('user');
      
      console.log('User data from localStorage:', userData);
      
      if (userData && userData !== 'undefined' && userData !== 'null') {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('Parsed user:', parsedUser);
          
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser);
            console.log('User set successfully');
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      } else {
        console.log('No valid user data found');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
      }
    }
    
    setAuthLoading(false);
  }, [token]);

  const login = (userData, authToken) => {
    console.log('Login called with:', userData, authToken);
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

  console.log('AuthProvider render - User:', user, 'Loading:', authLoading);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading: authLoading }}>
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
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Chat Inteligente RAG</CardTitle>
                <CardDescription>
                  Consulta normativas con IA avanzada. Sistema RAG con acceso a EU AI Act, GDPR, MDR y más regulaciones
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-purple-100 p-3 rounded-lg w-fit">
                  <Newspaper className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Noticias Normativas</CardTitle>
                <CardDescription>
                  Actualizaciones automáticas de cambios normativos de EUR-Lex, BOE y fuentes oficiales
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-orange-100 p-3 rounded-lg w-fit">
                  <BookOpen className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Base de Conocimiento</CardTitle>
                <CardDescription>
                  Acceso completo a documentación oficial: EU AI Act, MDR, GDPR, DGA, LGS y más normativas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-teal-100 p-3 rounded-lg w-fit">
                  <BarChart3 className="h-6 w-6 text-teal-600" />
                </div>
                <CardTitle>Dashboard Avanzado</CardTitle>
                <CardDescription>
                  Métricas de cumplimiento, progreso de evaluaciones y alertas de cambios normativos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-red-100 p-3 rounded-lg w-fit">
                  <Target className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Recomendaciones IA</CardTitle>
                <CardDescription>
                  Sugerencias personalizadas generadas por IA basadas en tu perfil de riesgo y cambios normativos
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
  const [authFormLoading, setAuthFormLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthFormLoading(true);
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
      setAuthFormLoading(false);
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
                      <SelectValue placeholder="Seleccionar tipo de empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital_health">Salud Digital</SelectItem>
                      <SelectItem value="insurtech">Insurtech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={authFormLoading}>
              {authFormLoading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
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

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'assessment', label: 'Autoevaluación', icon: FileText },
    { id: 'chat', label: 'Chat Inteligente', icon: MessageCircle },
    { id: 'news', label: 'Noticias', icon: Newspaper },
    { id: 'articles', label: 'Artículos Técnicos', icon: PenTool },
    { id: 'docs', label: 'Documentos', icon: BookOpen },
    { id: 'timeline', label: 'Cronograma', icon: Clock }
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-full">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold">AI Compliance Pro</span>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// Chat Component
const ChatComponent = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API}/chat/sessions`);
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await axios.post(`${API}/chat/sessions`, {
        title: "Nueva Consulta"
      });
      await fetchSessions();
      setCurrentSession(response.data.session_id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      setCurrentSession(sessionId);
      const response = await axios.get(`${API}/chat/sessions/${sessionId}/messages`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentSession) return;

    setChatLoading(true);
    try {
      const response = await axios.post(`${API}/chat/sessions/${currentSession}/messages`, {
        message: newMessage,
        category: category && category !== 'all' ? category : null
      });

      setMessages(prev => [...prev, response.data.user_message, response.data.ai_response]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`${API}/chat/sessions/${sessionId}`);
      await fetchSessions();
      if (currentSession === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* Sessions Sidebar */}
      <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <Button onClick={createNewSession} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Consulta
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                  currentSession === session.id 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200'
                }`}
                onClick={() => loadSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-slate-900 truncate">
                      {session.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(session.updated_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <div className="text-sm font-medium mb-2">
                        {message.role === 'user' ? 'Tú' : 'AI Compliance Assistant'}
                      </div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.metadata?.context_docs && (
                        <div className="mt-3 pt-3 border-t border-slate-200/20">
                          <div className="text-xs opacity-75">
                            Fuentes consultadas: {message.metadata.context_docs.length} documentos
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-slate-200 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-4">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      <SelectItem value="ai_regulation">EU AI Act</SelectItem>
                      <SelectItem value="data_protection">GDPR</SelectItem>
                      <SelectItem value="medical_devices">MDR</SelectItem>
                      <SelectItem value="data_governance">DGA</SelectItem>
                      <SelectItem value="health_law">Ley General de Sanidad</SelectItem>
                      <SelectItem value="insurance_law">Ley de Seguros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-4">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Pregunta sobre normativas, cumplimiento, EU AI Act, GDPR..."
                    className="flex-1 min-h-[60px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={chatLoading || !newMessage.trim()}
                    size="lg"
                  >
                    {chatLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-md">
              <MessageCircle className="h-16 w-16 text-slate-300 mx-auto" />
              <h3 className="text-xl font-semibold text-slate-700">
                Chat Inteligente con IA
              </h3>
              <p className="text-slate-500">
                Consulta normativas EU AI Act, GDPR, MDR y más con nuestro asistente especializado basado en documentación oficial.
              </p>
              <Button onClick={createNewSession} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Consulta
              </Button>
              <div className="text-xs text-slate-400 mt-4">
                <div className="flex items-center justify-center space-x-4">
                  <span>✨ Sistema RAG</span>
                  <span>📚 2,348+ documentos</span>
                  <span>🧠 GPT-4o</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// News Component
const NewsComponent = () => {
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await axios.get(`${API}/news?limit=30`);
      setNews(response.data.news);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const searchNews = async () => {
    if (!searchQuery.trim()) {
      fetchNews();
      return;
    }

    setNewsLoading(true);
    try {
      const response = await axios.get(`${API}/news/search?query=${encodeURIComponent(searchQuery)}`);
      setNews(response.data.results);
    } catch (error) {
      console.error('Error searching news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const filterByTag = async (tag) => {
    setSelectedTag(tag);
    if (!tag || tag === 'all') {
      fetchNews();
      return;
    }

    setNewsLoading(true);
    try {
      const response = await axios.get(`${API}/news/tags/${tag}`);
      setNews(response.data.news);
    } catch (error) {
      console.error('Error filtering news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const refreshNews = async () => {
    setNewsLoading(true);
    try {
      await axios.post(`${API}/news/refresh`);
      await fetchNews();
    } catch (error) {
      console.error('Error refreshing news:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  if (newsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Noticias Normativas</h1>
          <Button onClick={refreshNews} variant="outline">
            Actualizar Noticias
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar noticias normativas..."
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && searchNews()}
              />
            </div>
          </div>
          <Button onClick={searchNews}>
            Buscar
          </Button>
        </div>

        {/* Tag Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            size="sm"
            variant={selectedTag === '' || selectedTag === 'all' ? 'default' : 'outline'}
            onClick={() => filterByTag('all')}
          >
            Todas
          </Button>
          {['ai', 'gdpr', 'medical', 'insurance', 'regulation', 'eu', 'spain'].map((tag) => (
            <Button
              key={tag}
              size="sm"
              variant={selectedTag === tag ? 'default' : 'outline'}
              onClick={() => filterByTag(tag)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{item.source}</Badge>
                <div className="flex items-center text-sm text-slate-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(item.scraped_at).toLocaleDateString('es-ES')}
                </div>
              </div>
              <CardTitle className="text-lg leading-tight">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  {item.title}
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                {item.ai_summary || item.summary}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {item.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-slate-500">
                  Relevancia: {item.relevance_score?.toFixed(1)}/10
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {news.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            No se encontraron noticias
          </h3>
          <p className="text-slate-500">
            Intenta con diferentes términos de búsqueda o actualiza las noticias.
          </p>
        </div>
      )}
    </div>
  );
};

// Timeline Component
const TimelineComponent = () => {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // Real timeline data based on verified sources
  const sampleEvents = [
    {
      id: '1',
      title: 'EU AI Act - Primera Implementación GPAI',
      description: 'Proveedores de nuevos sistemas de IA de propósito general no disponibles en el mercado deben cumplir antes del lanzamiento en la UE.',
      date: '2025-08-02',
      type: 'regulation',
      priority: 'high',
      category: 'EU AI Act',
      status: 'upcoming',
      impact: 'Startups con sistemas GPAI nuevos deben cumplir completamente antes de lanzar en mercado europeo.',
      source: 'Orrick Legal Analysis & EU AI Act Official Timeline'
    },
    {
      id: '2',
      title: 'Insurance World Challenges 2025',
      description: 'Evento premier de InsurTech europeo enfocado en transformación digital del sector seguros, IA y big data.',
      date: '2025-03-26',
      type: 'event',
      priority: 'medium',
      category: 'Insurtech',
      status: 'upcoming',
      impact: 'Oportunidad para startups insurtech de conectar con 500+ profesionales del sector en Madrid.',
      source: 'Insurance World Challenges Official'
    },
    {
      id: '3',
      title: 'Data Governance Act - Fecha Límite Certificación',
      description: 'Entidades que ya proporcionan servicios de intermediación de datos deben obtener certificación bajo DGA.',
      date: '2025-09-24',
      type: 'deadline',
      priority: 'high',
      category: 'DGA',
      status: 'upcoming',
      impact: 'Proveedores de servicios de intermediación de datos existentes deben certificarse obligatoriamente.',
      source: 'Hogan Lovells Legal Analysis'
    },
    {
      id: '4',
      title: 'EU Data Act - Entrada en Vigor',
      description: 'Nuevas obligaciones de intercambio de datos para dispositivos conectados e IoT entran en aplicación.',
      date: '2025-09-12',
      type: 'regulation',
      priority: 'high',
      category: 'Data Act',
      status: 'upcoming',
      impact: 'Empresas con productos conectados deben habilitar acceso a datos para usuarios y metadatos relacionados.',
      source: 'WSG Data Advisor & EU Data Act Official'
    },
    {
      id: '5',
      title: '5th Digital Health Conference Madrid',
      description: 'Conferencia líder que reúne líderes farmacéuticos, innovadores en medicina digital y pioneros health tech.',
      date: '2025-10-23',
      type: 'event',
      priority: 'medium',
      category: 'Salud Digital',
      status: 'upcoming',
      impact: 'Evento clave para startups de salud digital para discutir IA, medicina basada en datos y tendencias regulatorias.',
      source: 'Digital Health Conference Official'
    },
    {
      id: '6',
      title: 'MedTech Meets AI Conference Barcelona',
      description: 'Conferencia especializada en intersección de dispositivos médicos, IA, diagnósticos e imaging con enfoque regulatorio.',
      date: '2025-10-02',
      type: 'event',
      priority: 'high',
      category: 'MedTech',
      status: 'upcoming',
      impact: 'Esencial para startups que desarrollan dispositivos médicos con IA, incluyendo discusiones sobre marcos regulatorios.',
      source: 'MedTech Meets AI Official'
    },
    {
      id: '7',
      title: 'Health Tech Forward Barcelona',
      description: 'Evento premier de innovación health tech con startups, inversores y líderes de la industria.',
      date: '2025-12-03',
      type: 'event',
      priority: 'medium',
      category: 'HealthTech',
      status: 'upcoming',
      impact: 'Oportunidades extensas de networking para startups health tech y acceso a insights sobre tecnologías transformadoras.',
      source: 'Health Tech Forward Official'
    },
    {
      id: '8',
      title: 'EU AI Act - Implementación Sistemas Alto Riesgo',
      description: 'Operadores de sistemas de IA de alto riesgo (biometría, infraestructura crítica, empleo) deben cumplir completamente.',
      date: '2026-08-02',
      type: 'regulation',
      priority: 'high',
      category: 'EU AI Act',
      status: 'upcoming',
      impact: 'Sistemas de alto riesgo requieren evaluaciones de conformidad, documentación y auditorías externas potenciales.',
      source: 'DataGuard & EU AI Act Implementation Timeline'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setTimelineEvents(sampleEvents);
      setTimelineLoading(false);
    }, 1000);
  }, []);

  const filteredEvents = timelineEvents.filter(event => {
    if (filterType === 'all') return true;
    return event.type === filterType;
  });

  const sortedEvents = filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  const getEventIcon = (type) => {
    switch (type) {
      case 'regulation': return <FileText className="h-5 w-5" />;
      case 'event': return <Users className="h-5 w-5" />;
      case 'deadline': return <AlertCircle className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const getEventColor = (priority, type) => {
    if (priority === 'high') return 'border-red-200 bg-red-50';
    if (type === 'event') return 'border-blue-200 bg-blue-50';
    if (type === 'deadline') return 'border-orange-200 bg-orange-50';
    return 'border-slate-200 bg-slate-50';
  };

  const getPriorityBadge = (priority) => {
    const configs = {
      high: { color: 'bg-red-100 text-red-700 border-red-200', text: 'Alto' },
      medium: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', text: 'Medio' },
      low: { color: 'bg-green-100 text-green-700 border-green-200', text: 'Bajo' }
    };
    
    const config = configs[priority] || configs.medium;
    return (
      <Badge className={`${config.color} text-xs`}>
        {config.text}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const configs = {
      regulation: { color: 'bg-purple-100 text-purple-700 border-purple-200', text: 'Normativa' },
      event: { color: 'bg-blue-100 text-blue-700 border-blue-200', text: 'Evento' },
      deadline: { color: 'bg-orange-100 text-orange-700 border-orange-200', text: 'Fecha Límite' }
    };
    
    const config = configs[type] || configs.regulation;
    return (
      <Badge className={`${config.color} text-xs`}>
        {config.text}
      </Badge>
    );
  };

  const getDaysUntil = (dateString) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    return `En ${diffDays} días`;
  };

  if (timelineLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Cronograma Normativo</h1>
            <p className="text-slate-600 mt-2">
              Próximos hitos importantes en regulación de IA, eventos y fechas límite de cumplimiento
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-slate-500" />
            <span className="text-sm text-slate-600">Actualizado hoy</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            size="sm"
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
          >
            Todos
          </Button>
          <Button
            size="sm"
            variant={filterType === 'regulation' ? 'default' : 'outline'}
            onClick={() => setFilterType('regulation')}
          >
            <FileText className="h-3 w-3 mr-1" />
            Normativas
          </Button>
          <Button
            size="sm"
            variant={filterType === 'event' ? 'default' : 'outline'}
            onClick={() => setFilterType('event')}
          >
            <Users className="h-3 w-3 mr-1" />
            Eventos
          </Button>
          <Button
            size="sm"
            variant={filterType === 'deadline' ? 'default' : 'outline'}
            onClick={() => setFilterType('deadline')}
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Fechas Límite
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>
        
        <div className="space-y-8">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="relative flex items-start space-x-6">
              {/* Timeline dot */}
              <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                event.priority === 'high' ? 'bg-red-100 border-red-300' :
                event.type === 'event' ? 'bg-blue-100 border-blue-300' :
                event.type === 'deadline' ? 'bg-orange-100 border-orange-300' :
                'bg-slate-100 border-slate-300'
              }`}>
                {getEventIcon(event.type)}
              </div>

              {/* Event Card */}
              <Card className={`flex-1 ${getEventColor(event.priority, event.type)} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getTypeBadge(event.type)}
                        {getPriorityBadge(event.priority)}
                        <Badge variant="outline" className="text-xs">
                          {event.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight">
                        {event.title}
                      </CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">
                        {new Date(event.date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      <div className={`text-xs font-medium ${
                        getDaysUntil(event.date).includes('días') && !getDaysUntil(event.date).includes('Hace') 
                          ? 'text-blue-600' : 'text-slate-500'
                      }`}>
                        {getDaysUntil(event.date)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 mb-3 leading-relaxed">
                    {event.description}
                  </p>
                  
                  <div className="bg-white/60 border border-slate-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-slate-600 mb-1">
                      Impacto para startups:
                    </div>
                    <div className="text-sm text-slate-700 mb-2">
                      {event.impact}
                    </div>
                    {event.source && (
                      <div className="text-xs text-slate-500 italic">
                        Fuente: {event.source}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {sortedEvents.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            No hay eventos próximos
          </h3>
          <p className="text-slate-500">
            Los próximos hitos normativos aparecerán aquí cuando estén disponibles.
          </p>
        </div>
      )}
    </div>
  );
};

// Articles Component
const ArticlesComponent = () => {
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredArticles, setFilteredArticles] = useState([]);

  // Real technical articles based on verified research
  const technicalArticles = [
    {
      id: '1',
      title: 'EU AI Act: Guía Técnica de Implementación para Startups de Salud Digital',
      slug: 'eu-ai-act-implementacion-healthtech',
      category: 'EU AI Act',
      difficulty: 'Intermedio',
      readTime: '15 min',
      publishedDate: '2025-08-15',
      author: 'Equipo Regulatorio',
      summary: 'Guía completa sobre cómo las startups de salud digital deben implementar los requisitos del EU AI Act, incluyendo categorización de riesgo, documentación técnica y evaluaciones de conformidad.',
      content: `
# EU AI Act: Implementación Práctica para HealthTech

## Categorización de Sistemas de IA

### Sistemas de Alto Riesgo en Salud Digital
Los sistemas de IA médica generalmente caen bajo la categoría de "alto riesgo" según el Anexo III del EU AI Act:

- **Herramientas de diagnóstico**: IA que asiste en diagnóstico médico
- **Sistemas de apoyo a decisiones**: IA para recomendaciones de tratamiento
- **Dispositivos médicos con IA**: Software integrado en dispositivos médicos

### Requisitos de Cumplimiento

#### 1. Sistema de Gestión de Calidad
- Documentación de procesos de desarrollo
- Procedimientos de control de calidad
- Sistema de gestión de riesgos

#### 2. Gobernanza de Datos
- Conjuntos de datos de entrenamiento representativos
- Técnicas de validación y prueba
- Documentación de sesgos y limitaciones

#### 3. Documentación Técnica Obligatoria
- Descripción detallada del sistema de IA
- Instrucciones de uso
- Información sobre rendimiento y limitaciones

#### 4. Supervisión Humana
- Mecanismos de supervisión continua
- Capacidad de intervención humana
- Interfaces de usuario apropiadas

## Plazos de Cumplimiento
- **2 agosto 2025**: GPAI (Modelos de IA de Propósito General)
- **2 agosto 2026**: Sistemas de alto riesgo en salud

## Fuentes Verificadas
- European Commission AI Act Guidelines
- MDCG 2025-6 Technical Guidance
- WilmerHale Legal Analysis
      `,
      tags: ['EU AI Act', 'Cumplimiento', 'Salud Digital', 'Alto Riesgo'],
      source: 'European Commission Guidelines & Legal Analysis',
      isVerified: true
    },
    {
      id: '2',
      title: 'GDPR + IA: Implementación Técnica para Protección de Datos en Healthcare',
      slug: 'gdpr-ai-implementacion-healthcare',
      category: 'GDPR',
      difficulty: 'Avanzado',
      readTime: '20 min',
      publishedDate: '2025-07-22',
      author: 'Especialista en Privacidad',
      summary: 'Guía técnica detallada sobre cómo implementar GDPR compliance en sistemas de IA para healthcare, incluyendo minimización de datos, anotación privada y evaluaciones de impacto.',
      content: `
# GDPR + IA: Guía Técnica de Implementación

## Principios Fundamentales

### Minimización de Datos
- Usar solo datos mínimos necesarios para el propósito
- Preferir datos anonimizados cuando sea posible
- Implementar técnicas de pseudonimización

### Privacy by Design
- Integrar protección de datos desde el diseño
- Implementar controles de seguridad robustos
- Cifrado de extremo a extremo

## Evaluación de Impacto (DPIA)

### Cuándo es Obligatoria
- Procesamiento de datos de salud sensibles
- Toma de decisiones automatizada
- Monitoreo sistemático de individuos

### Componentes Clave
1. **Descripción del procesamiento**: Propósito, tipos de datos, categorías de interesados
2. **Evaluación de necesidad**: Justificación de la necesidad y proporcionalidad
3. **Identificación de riesgos**: Riesgos para derechos y libertades
4. **Medidas de mitigación**: Controles técnicos y organizacionales

## Anotación de Datos Conforme a GDPR

### Mejores Prácticas CNIL
- Anonimización efectiva durante anotación
- Controles de acceso granulares
- Auditoría de procesos de anotación
- Formación específica para anotadores

## Transferencias Internacionales
- Usar Cláusulas Contractuales Estándar (SCC)
- Evaluación de país de destino
- Medidas complementarias si es necesario

## Fuentes Verificadas
- CNIL AI Recommendations 2025
- EDPB Technical Guidance
- WilmerHale GDPR-AI Compliance Guide
      `,
      tags: ['GDPR', 'Privacidad', 'IA', 'Healthcare', 'DPIA'],
      source: 'CNIL & EDPB Official Guidance',
      isVerified: true
    },
    {
      id: '3',
      title: 'MDR + EU AI Act: Validación Clínica de Dispositivos Médicos con IA',
      slug: 'mdr-ai-act-validacion-clinica',
      category: 'MDR',
      difficulty: 'Avanzado',
      readTime: '25 min',
      publishedDate: '2025-06-18',
      author: 'Consultor Regulatorio Médico',
      summary: 'Análisis técnico del nuevo marco regulatorio integrado MDR/IVDR + AI Act, incluyendo MDCG 2025-6 y requisitos de validación clínica para dispositivos médicos con IA.',
      content: `
# MDR + EU AI Act: Marco Regulatorio Integrado

## MDCG 2025-6: Documento Guía Clave

### Enfoque de Cumplimiento Integrado
- **Documentación técnica única** cubriendo MDR/IVDR y AI Act
- Elementos específicos de IA: gobernanza de datos, transparencia algorítmica, supervisión humana
- Gestión de riesgos ampliada para sistemas de IA

### Requisitos AI Act para Dispositivos Médicos
- **Precisión y robustez**: Métricas de rendimiento definidas
- **Ciberseguridad**: Protección contra ataques adversarios
- **Pruebas continuas**: Validación durante desarrollo y post-mercado

## Validación Clínica Específica para IA

### Elementos Obligatorios
1. **Evaluación de rendimiento clínico**
   - Métricas de precisión, sensibilidad, especificidad
   - Validación en poblaciones diversas
   - Análisis de casos edge

2. **Gestión de sesgos**
   - Identificación de sesgos en datos de entrenamiento
   - Estrategias de mitigación
   - Monitoreo continuo post-mercado

3. **Validación de robustez**
   - Pruebas bajo condiciones variables
   - Evaluación de drift de datos
   - Mecanismos de detección de anomalías

### Proceso de Evaluación Clínica

#### Fase 1: Diseño de Estudios
- Definición de endpoints primarios y secundarios
- Selección de comparadores apropiados
- Protocolo de validación cruzada

#### Fase 2: Ejecución
- Recolección de datos clínicos
- Evaluación por expertos independientes
- Análisis estadístico robusto

#### Fase 3: Documentación
- Informe de evaluación clínica
- Plan de seguimiento post-mercado
- Actualización de etiquetado

## Cronograma de Implementación
- **Agosto 2025**: Entrada en vigor AI Act para GPAI
- **Agosto 2026**: Requisitos completos para IA de alto riesgo
- **Continuo**: Actualización de guidance técnica

## Fuentes Verificadas
- MDCG 2025-6 Official Document
- European Commission Health Authority
- Emergo by UL Regulatory Analysis
      `,
      tags: ['MDR', 'AI Act', 'Validación Clínica', 'Dispositivos Médicos', 'MDCG'],
      source: 'MDCG 2025-6 & European Commission',
      isVerified: true
    },
    {
      id: '4',
      title: 'InsurTech y IA: Cumplimiento Normativo en Evaluación de Riesgos',
      slug: 'insurtech-ai-cumplimiento-riesgos',
      category: 'InsurTech',
      difficulty: 'Intermedio',
      readTime: '18 min',
      publishedDate: '2025-05-10',
      author: 'Especialista en Seguros Digitales',
      summary: 'Análisis de requisitos normativos específicos para startups insurtech que usan IA en suscripción automática, pricing y evaluación de riesgos, incluyendo transparencia y no discriminación.',
      content: `
# InsurTech y IA: Guía de Cumplimiento Normativo

## Marco Regulatorio Aplicable

### EU AI Act para InsurTech
Los sistemas de IA utilizados en:
- **Evaluación de riesgos de seguros**
- **Pricing automático**
- **Suscripción automatizada**
- **Detección de fraude**

Pueden clasificarse como **alto riesgo** bajo el Anexo III del AI Act.

### Requisitos Específicos

#### 1. Transparencia Algorítmica
- Explicación de factores de decisión
- Documentación de lógica de pricing
- Información comprensible para usuarios

#### 2. No Discriminación
- Auditorías de sesgo algorítmico
- Pruebas de equidad en diferentes grupos
- Monitoreo de impacto disparejo

#### 3. Supervisión Humana
- Revisión humana de decisiones automáticas
- Capacidad de anular decisiones de IA
- Proceso de apelación para consumidores

### Regulaciones Regionales Específicas

#### Illinois AI Act (Ejemplo)
- **Divulgación obligatoria** del uso de IA
- **Supervisión regulatoria** de decisiones de IA
- **Auditorías regulares** de sistemas de IA
- **Gestión de riesgos** documentada

## Implementación Práctica

### Sistema de Gestión de Riesgos
1. **Identificación de riesgos**
   - Sesgos en datos históricos
   - Drift en patrones de riesgo
   - Cambios regulatorios

2. **Medidas de control**
   - Validación cruzada temporal
   - Monitoreo de métricas de equidad
   - Alertas automáticas de drift

3. **Documentación**
   - Registro de decisiones algorítmicas
   - Auditoría de cambios en modelos
   - Reportes de rendimiento

### Mejores Prácticas

#### Desarrollo Responsable
- Equipos diversos en desarrollo de IA
- Pruebas con datos representativos
- Validación por expertos en seguros

#### Operación Transparente
- Dashboards de monitoreo en tiempo real
- Reportes regulares a stakeholders
- Comunicación clara con reguladores

## Preparación para Compliance

### Lista de Verificación
- [ ] Inventario de sistemas de IA
- [ ] Clasificación de riesgo por sistema
- [ ] Documentación técnica completa
- [ ] Procesos de supervisión humana
- [ ] Plan de auditoría y monitoreo
- [ ] Capacitación de equipos

## Fuentes Verificadas
- EU AI Act Annexes & Guidelines
- Illinois AI Act Implementation
- Shepard Health Law Analysis
      `,
      tags: ['InsurTech', 'AI Act', 'Seguros', 'Transparencia', 'No Discriminación'],
      source: 'EU AI Act & Regional AI Acts Analysis',
      isVerified: true
    }
  ];

  useEffect(() => {
    // Simulate loading real articles
    setTimeout(() => {
      setArticles(technicalArticles);
      setFilteredArticles(technicalArticles);
      setArticlesLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = articles;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredArticles(filtered);
  }, [articles, selectedCategory, searchQuery]);

  const getDifficultyBadge = (difficulty) => {
    const configs = {
      'Básico': { color: 'bg-green-100 text-green-700 border-green-200' },
      'Intermedio': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      'Avanzado': { color: 'bg-red-100 text-red-700 border-red-200' }
    };
    
    const config = configs[difficulty] || configs['Intermedio'];
    return (
      <Badge className={`${config.color} text-xs`}>
        {difficulty}
      </Badge>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      'EU AI Act': 'border-blue-200 bg-blue-50',
      'GDPR': 'border-green-200 bg-green-50',
      'MDR': 'border-purple-200 bg-purple-50',
      'InsurTech': 'border-orange-200 bg-orange-50',
      'General': 'border-slate-200 bg-slate-50'
    };
    return colors[category] || colors['General'];
  };

  if (articlesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Artículos Técnicos</h1>
            <p className="text-slate-600 mt-2">
              Guías técnicas verificadas y análisis en profundidad sobre cumplimiento normativo de IA
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <PenTool className="h-5 w-5 text-slate-500" />
            <span className="text-sm text-slate-600">Contenido verificado</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar artículos técnicos..."
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="EU AI Act">EU AI Act</SelectItem>
              <SelectItem value="GDPR">GDPR</SelectItem>
              <SelectItem value="MDR">MDR</SelectItem>
              <SelectItem value="InsurTech">InsurTech</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            size="sm"
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
          >
            Todos
          </Button>
          {['EU AI Act', 'GDPR', 'MDR', 'InsurTech'].map((category) => (
            <Button
              key={category}
              size="sm"
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredArticles.map((article) => (
          <Card key={article.id} className={`${getCategoryColor(article.category)} hover:shadow-lg transition-shadow`}>
            <CardHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {article.category}
                  </Badge>
                  {article.isVerified && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600">Verificado</span>
                    </div>
                  )}
                </div>
                
                <CardTitle className="text-xl leading-tight">
                  {article.title}
                </CardTitle>
                
                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(article.publishedDate).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{article.readTime}</span>
                  </div>
                  {getDifficultyBadge(article.difficulty)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-slate-700 mb-4 leading-relaxed">
                {article.summary}
              </p>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {article.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="bg-white/60 border border-slate-200 rounded-lg p-3">
                  <div className="text-xs font-medium text-slate-600 mb-1">
                    Fuentes verificadas:
                  </div>
                  <div className="text-xs text-slate-700">
                    {article.source}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-slate-600">
                    Por {article.author}
                  </span>
                  <Button size="sm">
                    Leer Artículo
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <PenTool className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            No se encontraron artículos
          </h3>
          <p className="text-slate-500">
            Intenta con diferentes términos de búsqueda o cambia los filtros.
          </p>
        </div>
      )}
    </div>
  );
};

// Documents Component
const DocumentsComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/documents/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/documents/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const searchDocuments = async () => {
    if (!searchQuery.trim()) return;

    setDocumentsLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        k: '10'
      });
      
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await axios.get(`${API}/documents/search?${params}`);
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Error searching documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const refreshDocuments = async () => {
    setDocumentsLoading(true);
    try {
      await axios.post(`${API}/documents/refresh`);
      await fetchStats();
    } catch (error) {
      console.error('Error refreshing documents:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Base de Conocimiento</h1>
          <Button onClick={refreshDocuments} variant="outline">
            Actualizar Documentos
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.total_documents}</div>
                <div className="text-sm text-slate-600">Documentos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.total_chunks}</div>
                <div className="text-sm text-slate-600">Fragmentos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{stats.categories?.length || 0}</div>
                <div className="text-sm text-slate-600">Categorías</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.last_updates ? Object.keys(stats.last_updates).length : 0}
                </div>
                <div className="text-sm text-slate-600">Actualizados</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FileSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en normativas: EU AI Act, GDPR, MDR, DGA..."
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && searchDocuments()}
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.replace(/_/g, ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={searchDocuments} disabled={documentsLoading}>
            {documentsLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Resultados de búsqueda ({searchResults.length})
          </h2>
          
          {searchResults.map((result, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {result.metadata.title}
                  </CardTitle>
                  <Badge variant="outline">
                    {result.metadata.category?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 mb-4 leading-relaxed">
                  {result.content}
                </p>
                <div className="text-sm text-slate-500">
                  Fuente: {result.metadata.source} | 
                  Fragmento: {result.metadata.chunk_id + 1}
                  {result.metadata.last_updated && (
                    <> | Actualizado: {new Date(result.metadata.last_updated).toLocaleDateString('es-ES')}</>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Available Documents */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Documentos Disponibles</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">EU AI Act</CardTitle>
              <CardDescription>Reglamento de IA de la UE</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800">
                Regulación completa sobre sistemas de inteligencia artificial en la Unión Europea.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">GDPR</CardTitle>
              <CardDescription>Reglamento General de Protección de Datos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-800">
                Normativa europea sobre protección de datos personales y privacidad.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-900">MDR</CardTitle>
              <CardDescription>Reglamento de Dispositivos Médicos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-800">
                Regulación de dispositivos médicos incluyendo software y sistemas de IA médica.
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900">DGA</CardTitle>
              <CardDescription>Ley de Gobernanza de Datos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-800">
                Marco para el intercambio y reutilización de datos en la UE.
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">LGS</CardTitle>
              <CardDescription>Ley General de Sanidad</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-800">
                Normativa sanitaria española aplicable a startups de salud digital.
              </p>
            </CardContent>
          </Card>

          <Card className="border-teal-200 bg-teal-50">
            <CardHeader>
              <CardTitle className="text-teal-900">Ley de Seguros</CardTitle>
              <CardDescription>Ley del Contrato de Seguro</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-teal-800">
                Regulación de contratos de seguro aplicable a empresas insurtech.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard with Sidebar
const MainDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  // Check if we're in demo mode
  const isDemo = window.location.pathname === '/demo';
  
  // Create demo user if needed
  const currentUser = isDemo ? {
    company_name: 'Empresa Demo',
    company_type: 'insurtech',
    email: 'demo@empresa.com'
  } : user;

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    // If demo mode, use mock data
    if (isDemo) {
      setStats({
        total_assessments: 3,
        average_risk_score: 6.2,
        compliance_status: 'partially_compliant',
        recommendations_count: 8
      });
      setAssessments([
        {
          id: 'demo-1',
          created_at: new Date().toISOString(),
          risk_score: 6.2,
          risk_level: 'medium'
        },
        {
          id: 'demo-2', 
          created_at: new Date(Date.now() - 86400000).toISOString(),
          risk_score: 7.8,
          risk_level: 'high'
        }
      ]);
      setDashboardLoading(false);
      return;
    }
    
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
      setDashboardLoading(false);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-6 max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">
                Bienvenido, {currentUser?.company_name}
              </h1>
              <p className="text-slate-600 mt-2">
                Panel de control de cumplimiento normativo para {currentUser?.company_type === 'digital_health' ? 'salud digital' : 'insurtech'}
              </p>
            </div>

            {/* Top Actions */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Acciones Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-6 gap-4">
                    <Button onClick={() => setActiveTab('assessment')} className="h-20 flex-col">
                      <FileText className="h-6 w-6 mb-2" />
                      Nueva Evaluación
                    </Button>
                    <Button onClick={() => setActiveTab('chat')} variant="outline" className="h-20 flex-col">
                      <MessageCircle className="h-6 w-6 mb-2" />
                      Consultar IA
                    </Button>
                    <Button onClick={() => setActiveTab('news')} variant="outline" className="h-20 flex-col">
                      <Newspaper className="h-6 w-6 mb-2" />
                      Ver Noticias
                    </Button>
                    <Button onClick={() => setActiveTab('articles')} variant="outline" className="h-20 flex-col">
                      <PenTool className="h-6 w-6 mb-2" />
                      Artículos
                    </Button>
                    <Button onClick={() => setActiveTab('docs')} variant="outline" className="h-20 flex-col">
                      <BookOpen className="h-6 w-6 mb-2" />
                      Documentos
                    </Button>
                    <Button onClick={() => setActiveTab('timeline')} variant="outline" className="h-20 flex-col">
                      <Clock className="h-6 w-6 mb-2" />
                      Cronograma
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

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

            {/* Recent Assessments */}
            <Card className="mb-8">
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
        );
        
      case 'assessment':
        return <AssessmentComponent />;
        
      case 'chat':
        return <ChatComponent />;
        
      case 'news':
        return <NewsComponent />;
        
      case 'articles':
        return <ArticlesComponent />;
        
      case 'docs':
        return <DocumentsComponent />;
        
      case 'timeline':
        return <TimelineComponent />;
        
      default:
        return <div>Contenido no encontrado</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-slate-600">
              {currentUser?.company_type === 'digital_health' ? 'Salud Digital' : 'Insurtech'} | {currentUser?.email}
            </div>
            {!isDemo && (
              <Button variant="outline" onClick={logout}>
                Cerrar Sesión
              </Button>
            )}
            {isDemo && (
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Modo Demo
              </span>
            )}
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Assessment Component (same as before)
const AssessmentComponent = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [assessmentLoading, setAssessmentLoading] = useState(false);
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
    setAssessmentLoading(true);
    try {
      const response = await axios.post(`${API}/assessments`, { responses });
      setResult(response.data);
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setAssessmentLoading(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  if (result) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
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
              <Button onClick={() => window.location.reload()}>
                Nueva Evaluación
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
    );
  }

  if (assessmentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Procesando evaluación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
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
          <Route path="/dashboard" element={<MainDashboard />} />
          {/* Force dashboard to show for demo */}
          <Route path="/demo" element={<MainDashboard />} />
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