import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRequests: 0,
    totalRevenue: 0,
    totalVisits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // In a real app, this would be a specific /api/admin/stats endpoint
      // For this demo, we'll simulate the aggregation of data
      const response = await fetch('http://localhost:8000/api/categories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        // Mocking admin stats based on platform activity
        setStats({
          totalUsers: 124,
          activeRequests: 18,
          totalRevenue: 452000,
          totalVisits: 89
        });
      }
    } catch (error) {
      showToast('Error al cargar estadísticas', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
            <p className="text-gray-600">Control total de la plataforma Técnicos Ya</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600">Admin: <span className="font-semibold">{user?.full_name}</span></p>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="text-sm text-red-600 hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Usuarios Totales" value={stats.totalUsers} icon="👥" color="bg-blue-500" />
          <StatCard title="Solicitudes Activas" value={stats.activeRequests} icon="📝" color="bg-indigo-500" />
          <StatCard title="Ingresos Est."C_clp={stats.totalRevenue} icon="💰" color="bg-green-500" />
          <StatCard title="Visitas Realizadas" value={stats.totalVisits} icon="✅" color="bg-purple-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Gestión de Plataforma</h2>
            <div className="space-y-3">
              <AdminAction 
                label="Revisar Reportes de Usuarios" 
                description="Ver denuncias y problemas reportados"
                onClick={() => showToast('Módulo de reportes en desarrollo')}
              />
              <AdminAction 
                label="Configurar Tarifas Base" 
                description="Ajustar el precio base de las visitas"
                onClick={() => showToast('Configuración de tarifas en desarrollo')}
              />
              <AdminAction 
                label="Gestionar Categorías" 
                description="Añadir o eliminar especialidades"
                onClick={() => navigate('/client/dashboard')} // Simulating navigation to category management
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Alertas del Sistema</h2>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-700">
                <strong>Alerta:</strong> Hay 3 solicitudes sin técnicos postulados hace +24h.
              </div>
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded text-sm text-yellow-700">
                <strong>Aviso:</strong> 5 nuevos técnicos esperando verificación de documentos.
              </div>
              <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded text-sm text-green-700">
                <strong>Éxito:</strong> El volumen de transacciones aumentó un 12% esta semana.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`${color} p-3 rounded-lg text-white text-2xl shadow-inner`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">
          {typeof value === 'number' && value > 1000 ? `$${value.toLocaleString()}` : value}
        </p>
      </div>
    </div>
  );
}

function AdminAction({ label, description, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group"
    >
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-700 group-hover:text-indigo-600">{label}</span>
        <span className="text-gray-400">→</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </button>
  );
}
