import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import CreateRequestModal from '../components/CreateRequestModal';
import PaymentModal from '../components/PaymentModal';
import AdBanner from '../components/AdBanner';
import NotificationBell from '../components/NotificationBell';
import Skeleton from '../components/Skeleton';

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
    // Handle Stripe Return
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
      const response = await fetch('${import.meta.env.VITE_API_URL}/api/service-requests', {
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mi Panel de Cliente</h1>
            <p className="text-gray-600">Gestiona tus solicitudes de servicio técnico</p>
          </div>
          <div className="flex items-center space-x-6">
            <NotificationBell />
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <p className="text-gray-600">Hola, <span className="font-semibold">{user?.full_name}</span></p>
                {user?.membership_type === 'premium' && (
                  <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-yellow-200">
                    Premium
                  </span>
                )}
              </div>
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
            <button 
              className="w-full bg-indigo-600 text-white py-4 px-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
              onClick={() => setIsModalOpen(true)}
            >
              + Nueva Solicitud
            </button>

            <button 
              onClick={() => navigate('/client/search')}
              className="w-full bg-white text-indigo-600 py-4 px-4 rounded-xl font-bold border-2 border-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
            >
              🔍 Buscar Técnico
            </button>
            
            <div className={`p-6 rounded-xl shadow-sm border transition-all ${
              user?.membership_type === 'premium' 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-white border-gray-100'
            }`}>
              <h3 className="font-bold text-gray-800 mb-2">Membresía Premium</h3>
              <p className="text-sm text-gray-600 mb-4">
                {user?.membership_type === 'premium' 
                  ? 'Tienes acceso prioritario y descuentos exclusivos.' 
                  : 'Obtén prioridad en las solicitudes y descuentos exclusivos.'}
              </p>
              {user?.membership_type !== 'premium' && (
                <button 
                  onClick={() => setIsPaymentOpen(true)}
                  className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                >
                  Suscribirse ($5.500)
                </button>
              )}
            </div>

            <AdBanner 
              type="premium" 
              text="⭐ ¡Sé un cliente VIP!" 
              ctaText="Mejorar Plan" 
              link="#" 
              image="https://cdn-icons-png.flaticon.com/512/1041/1041916.png"
            />
          </div>
          
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Mis Solicitudes</h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow text-center text-gray-500">
                <p className="text-lg mb-2">No tienes solicitudes activas</p>
                <p className="text-sm">Crea una nueva solicitud para encontrar al técnico ideal.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {requests.map(req => (
                  <div 
                    key={req._id} 
                    onClick={() => navigate(`/client/request/${req._id}`)}
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-indigo-500 transition-all group"
                  >
                    <div>
                      <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{req.title}</h3>
                      <p className="text-sm text-gray-600">{req.address}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      req.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
  );
}



