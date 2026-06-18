import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ApplyRequestModal from '../components/ApplyRequestModal';
import EditProfileModal from '../components/EditProfileModal';
import AdBanner from '../components/AdBanner';
import NotificationBell from '../components/NotificationBell';
import Skeleton from '../components/Skeleton';

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Panel del Técnico</h1>
          <div className="flex items-center space-x-6">
            <NotificationBell />
            <div className="text-right">
              <p className="text-gray-600">Hola, <span className="font-semibold">{user?.full_name}</span></p>
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
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="font-bold text-gray-700 mb-2">Mi Perfil</h3>
              <p className="text-sm text-gray-600 mb-4">Estado: <span className="text-green-600 font-medium">Disponible</span></p>
              <button 
                className="w-full text-sm bg-indigo-100 text-indigo-700 py-2 rounded hover:bg-indigo-200 transition-colors font-medium"
                onClick={() => setIsProfileModalOpen(true)}
              >
                Editar Perfil
              </button>
            </div>
            <AdBanner 
              type="external" 
              text="🛠️ Herramientas Profesionales con 20% dto." 
              ctaText="Ver Ofertas" 
              link="https://example.com/tools" 
              image="https://cdn-icons-png.flaticon.com/512/2970/2970785.png"
            />
          </div>
          
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Trabajos Disponibles</h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-24 rounded-md" />
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                No hay trabajos disponibles en este momento.
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <div key={job._id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-800">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.address}</p>
                    </div>
                    <button 
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                      onClick={() => handleApplyClick(job)}
                    >
                      Aplicar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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



