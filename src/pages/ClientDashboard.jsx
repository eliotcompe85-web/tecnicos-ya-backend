import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import CreateRequestModal from '../components/CreateRequestModal';
import PaymentModal from '../components/PaymentModal';
import AdBanner from '../components/AdBanner';
import NotificationBell from '../components/NotificationBell';
import Skeleton from '../components/Skeleton';

// Helper para estilos de estado
const getStatusStyles = (status) => {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'paid':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'completed':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      showToast('¡Pago procesando exitosamente! Tu membresía ha sido activada.', 'success');
    } else if (paymentStatus === 'cancelled') {
      showToast('El pago fue cancelado.', 'info');
    }

    fetchRequests();
  }, [searchParams]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/service-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      showToast('Error al cargar solicitudes', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Superior */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Mi Panel <span className="text-indigo-600">Cliente</span>
            </h1>
            <p className="text-slate-500 font-medium">Bienvenido de nuevo, {user?.full_name || 'Usuario'}</p>
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
                  {user?.full_name?.charAt(0) || 'U'}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Acciones Rápidas */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Acciones Rápidas</h3>
              <button 
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 px-6 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 group"
                onClick={() => setIsModalOpen(true)}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">➕</span>
                Nueva Solicitud
              </button>
              
              <button 
                onClick={() => navigate('/client/search')}
                className="w-full flex items-center justify-center gap-3 bg-white text-indigo-600 py-4 px-6 rounded-2xl font-bold border-2 border-indigo-50 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
              >
                <span className="text-2xl">🔍</span>
                Buscar Técnico
              </button>
            </div>

            {/* Tarjeta de Membresía Premium Mejorada */}
            <div className={`relative overflow-hidden p-6 rounded-3xl shadow-lg transition-all ${
              user?.membership_type === 'premium' 
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                : 'bg-white border border-slate-200'
            }`}>
              {user?.membership_type === 'premium' && (
                <div className="absolute -right-4 -top-4 text-white/20 text-8xl rotate-12">⭐</div>
              )}
              
              <div className="relative z-10">
                <h3 className={`font-bold text-xl mb-2 ${user?.membership_type === 'premium' ? 'text-white' : 'text-slate-800'}`}>
                  {user?.membership_type === 'premium' ? '¡Eres VIP!' : 'Plan Premium'}
                </h3>
                <p className={`text-sm mb-6 leading-relaxed ${user?.membership_type === 'premium' ? 'text-amber-50' : 'text-slate-500'}`}>
                  {user?.membership_type === 'premium' 
                    ? 'Disfruta de prioridad absoluta y soporte dedicado.' 
                    : 'Accede a descuentos exclusivos y atención prioritaria.'}
                </p>
                
                {user?.membership_type !== 'premium' && (
                  <button 
                    onClick={() => setIsPaymentOpen(true)}
                    className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-xl"
                  >
                    Mejorar ahora ($5.500)
                  </button>
                )}
              </div>
            </div>

            <AdBanner 
              type="premium" 
              text="⭐ ¡Sé un cliente VIP!" 
              ctaText="Mejorar Plan" 
              link="#" 
              image="https://cdn-icons-png.flaticon.com/512/1041/1041916.png"
            />
          </aside>
          
          {/* Columna Derecha: Lista de Solicitudes */}
          <main className="lg:col-span-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Mis Solicitudes</h2>
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {requests.length} Total
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div className="space-y-3 flex-1">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white p-16 rounded-[2rem] shadow-sm border border-slate-100 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mb-6">📦</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No hay solicitudes</h3>
                <p className="text-slate-500 max-w-xs mx-auto mb-8">
                  Parece que aún no has pedido ningún servicio. ¡Empecemos ahora!
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Crear Primera Solicitud
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {requests.map(req => (
                  <div 
                    key={req._id} 
                    onClick={() => navigate(`/client/request/${req._id}`)}
                    className="group bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:shadow-xl hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl group-hover:bg-indigo-50 group-hover:scale-110 transition-all">
                        🛠️
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors leading-tight">
                          {req.title}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                          <span>📍</span> {req.address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold border tracking-wider uppercase ${getStatusStyles(req.status)}`}>
                        {req.status}
                      </span>
                      <span className="text-slate-400 group-hover:text-indigo-400 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        <CreateRequestModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onCreated={fetchRequests} 
        />

        <PaymentModal 
          isOpen={isPaymentOpen} 
          onClose={() => setIsPaymentOpen(false)} 
          paymentType="membership"
          amount={5500}
          successUrl="http://localhost:5173/client/dashboard?payment=success"
          cancelUrl="http://localhost:5173/client/dashboard?payment=cancelled"
        />
      </div>
    </div>
  );
}




