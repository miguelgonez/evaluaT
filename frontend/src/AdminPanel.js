import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import shadcn components
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

// Icons
import { Shield, Settings, RefreshCw, Database, FileText, Users, BarChart3, AlertCircle, CheckCircle, Clock, Activity } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [updateLogs, setUpdateLogs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/admin/login`, credentials);
      localStorage.setItem('admin_token', response.data.access_token);
      setIsAuthenticated(true);
      fetchDashboardData();
    } catch (error) {
      setError('Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [dashboardResponse, logsResponse, documentsResponse] = await Promise.all([
        axios.get(`${API}/admin/dashboard`, { headers }),
        axios.get(`${API}/admin/logs?limit=20`, { headers }),
        axios.get(`${API}/admin/documents?limit=20`, { headers })
      ]);

      setDashboardData(dashboardResponse.data);
      setUpdateLogs(logsResponse.data.logs);
      setDocuments(documentsResponse.data.documents);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_token');
      }
    }
  };

  const runManualUpdate = async (updateType = 'all') => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${API}/admin/update`,
        { update_type: updateType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh data after update
      await fetchDashboardData();
      
      // Show success message (you could use a toast library here)
      alert(`Actualización completada: ${JSON.stringify(response.data.result)}`);
    } catch (error) {
      console.error('Manual update failed:', error);
      alert('Error en la actualización manual');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Éxito</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />En Proceso</Badge>;
    }
  };

  const getCategoryName = (category) => {
    const categoryNames = {
      'normativo': 'Normativo',
      'experto_consultancy': 'Consultoras',
      'experto_institution': 'Instituciones',
      'noticia': 'Noticias'
    };
    return categoryNames[category] || category;
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
      fetchDashboardData();
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-gradient-to-r from-red-600 to-orange-600 p-3 rounded-full w-fit mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Panel de Administración</CardTitle>
            <CardDescription>
              Acceso restringido - Solo administradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={login} className="space-y-4">
              <div>
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                />
              </div>

              {error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Autenticando...' : 'Iniciar Sesión'}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/')}
              >
                Volver al Inicio
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 p-2 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
                <p className="text-slate-600">Sistema de gestión y mantenimiento</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-100 text-green-800">
                <Activity className="h-3 w-3 mr-1" />
                Sistema Activo
              </Badge>
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.removeItem('admin_token');
                  navigate('/');
                }}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="updates">Actualizaciones</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {dashboardData && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.stats.total_users}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Evaluaciones</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.stats.total_assessments}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Sesiones Chat</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.stats.total_chat_sessions}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Documentos</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.stats.total_documents}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Documentos Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {dashboardData.recent_documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex-1">
                              <div className="font-medium text-sm truncate">{doc.title}</div>
                              <div className="text-xs text-slate-500">{doc.source}</div>
                            </div>
                            <Badge variant="secondary">{getCategoryName(doc.category)}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Logs Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {dashboardData.recent_logs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between p-2 rounded border">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{log.update_type}</div>
                              <div className="text-xs text-slate-500">{log.message}</div>
                            </div>
                            {getStatusBadge(log.status)}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actualizaciones Manuales</CardTitle>
                <CardDescription>
                  Ejecutar actualizaciones inmediatas del sistema. Las actualizaciones automáticas ocurren diariamente a las 6:00 AM.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => runManualUpdate('all')} 
                    disabled={updating}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
                    <span>Actualizar Todo</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => runManualUpdate('documents')} 
                    disabled={updating}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Documentos
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => runManualUpdate('news')} 
                    disabled={updating}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Noticias
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => runManualUpdate('articles')} 
                    disabled={updating}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Artículos
                  </Button>
                </div>

                {updating && (
                  <Alert className="mt-4">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Ejecutando actualización... Esto puede tomar varios minutos.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración del Scheduler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <div className="font-medium">Actualización Diaria Automática</div>
                      <div className="text-sm text-slate-500">Se ejecuta todos los días a las 6:00 AM</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activo
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-slate-600">
                    La próxima actualización automática será mañana a las 6:00 AM. 
                    Incluirá documentos normativos, noticias regulatorias, papers de consultoras e instituciones.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos en el Sistema ({documents.length})</CardTitle>
                <CardDescription>
                  Gestión de la base de conocimientos del repositorio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">{doc.title}</div>
                          <div className="text-xs text-slate-500 mb-2">{doc.summary_es}</div>
                          <div className="flex items-center space-x-4 text-xs text-slate-400">
                            <span>Fuente: {doc.source}</span>
                            <span>Fecha: {doc.publication_date}</span>
                            <span>Puntuación: {doc.relevance_score?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{getCategoryName(doc.category)}</Badge>
                          <Button variant="ghost" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Actualizaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {updateLogs.map((log) => (
                    <div key={log.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">{log.update_type}</div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(log.status)}
                          <span className="text-xs text-slate-500">{log.timestamp}</span>
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">{log.message}</div>
                      {log.documents_processed > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                          Documentos procesados: {log.documents_processed}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;