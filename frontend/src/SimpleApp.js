import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// AuthContext
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            SaaS AI Compliance
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Plataforma de autoevaluación de cumplimiento de IA para startups de salud digital e insurtech en España
          </p>
        </header>
        
        <div className="text-center">
          <a
            href="/demo"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Ver Demo
          </a>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const MainDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Dashboard - AI Compliance
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Autoevaluación</h2>
            <p className="text-slate-600">Evalúa el cumplimiento de tu startup con las regulaciones de IA</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Chat Inteligente</h2>
            <p className="text-slate-600">Consulta normativas con nuestro asistente basado en RAG</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Documentos</h2>
            <p className="text-slate-600">Base de conocimiento de regulaciones y normativas</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Noticias</h2>
            <p className="text-slate-600">Últimas actualizaciones regulatorias</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Cronograma</h2>
            <p className="text-slate-600">Eventos y fechas importantes del sector</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Artículos Técnicos</h2>
            <p className="text-slate-600">Artículos especializados sobre cumplimiento</p>
          </div>
        </div>
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<MainDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

// Wrap App with AuthProvider
export default function SimpleApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}