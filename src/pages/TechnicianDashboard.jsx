import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ApplyRequestModal from '../components/ApplyRequestModal';
import EditProfileModal from '../components/EditProfileModal';
import AdBanner from '../components/AdBanner';
import NotificationBell from '../components/NotificationBell';
import Skeleton from '../components/Skeleton';

// Helper para estilos de estado de trabajo
const getJobStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'in_progress':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'completed':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/service-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      showToast('Error al cargar trabajos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setIsApplyModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Superior */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Panel del <span className="text-indigo-600">Técnico</span>
            </h1>
            <p className="text-slate-500 font-medium">Gestiona tus aplicaciones y tus servicios</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 px-3">
              <div className="relative">
                <NotificationBell />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {user?.full_name?.charAt(0) || 'T'}
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                  }}
                  className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Sección de Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">📈</div>
            <div>
              <p className="text-sm font-medium text-slate-500">Mis Ingresos</p>
              <p className="text-2xl font-bold text-slate-900">$0.00</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl">✅</div>
            <div>
              <p className="text-sm font-medium text-slate-500">Trabajos Listos</p>
              <p className="text-2xl font-bold text-slate-900">0</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl">⭐</div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tu Rating</p>
              <p className="text-2xl font-bold text-slate-900">5.0</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Perfil y Herramientas */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Mi Perfil</h3>
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                  {user?.full_name?.charAt(0) || 'T'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 leading-tight">{user?.full_name}</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Disponible</span>
                </div>
              </div>
              <button 
                className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
                onClick={() => setIsProfileModalOpen(true)}
              >
                Editar Perfil
              </button>
            </div>

            <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-100 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">¿Quieres más clientes?</h3>
                <p className="text-indigo-100 text-sm mb-4">Mejora tu visibilidad con la suscripción Premium.</p>
                <button className="w-full py-2 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-sm">
                  Ver Planes
                </button>
              </div>
              <div className="absolute -right-4 -bottom-4 text-6xl opacity-20">🚀</div>
            </div>

            <AdBanner 
              type="external" 
              text="🛠️ Herramientas Profesionales con 20% dto." 
              ctaText="Ver Ofertas" 
              link="https://example.com/tools" 
              image="https://cdn-icons-png.flaticon.com/512/2970/2970785.png"
            />
          </aside>
          
          {/* Columna Derecha: Lista de Trabajos */}
          <main className="lg:col-span-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Nuevas Oportunidades</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span>{jobs.length} trabajos nuevos</span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-24 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white p-16 rounded-[2rem] shadow-sm border border-slate-100 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mb-6">🔍</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No hay trabajos ahora</h3>
                <p className="text-slate-500 max-w-xs mx-auto mb-8">
                  Mantente atento, nuevos servicios aparecen constantemente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {jobs.map(job => (
                  <div 
                    key={job._id} 
                    className="group bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:shadow-xl hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl group-hover:bg-indigo-50 group-hover:scale-110 transition-all">🛠️</div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors leading-tight">{job.title}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                          <span>📍</span> {job.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Presupuesto</p>
                        <p className="text-lg font-extrabold text-indigo-600">${job.budget_max || 'Consultar'}</p>
                      </div>
                      <button 
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        onClick={() => handleApplyClick(job)}
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedJob && (
        <ApplyRequestModal 
          request={selectedJob} 
          isOpen={isApplyModalOpen} 
          onClose={() => setIsApplyModalOpen(false)} 
          onApplied={fetchJobs} 
        />
      )}

      <EditProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}
