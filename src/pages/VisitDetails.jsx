import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import ReviewModal from '../components/ReviewModal';
import PaymentModal from '../components/PaymentModal';

export default function VisitDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    fetchVisitData();
  }, [id]);

  const fetchVisitData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/visits/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVisit(data);
      }
    } catch (error) {
      showToast('Error al cargar los detalles de la visita', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/visits/${id}/confirm`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (response.ok) {
        showToast('Visita marcada como completada. Esperando pago del cliente.');
        fetchVisitData();
      } else {
        const data = await response.json();
        showToast(data.detail || 'Error al confirmar visita', 'error');
      }
    } catch (error) {
      showToast('Error de conexión con el servidor', 'error');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!visit) return <div className="min-h-screen flex items-center justify-center">Visita no encontrada</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(user.role === 'client' ? '/client/dashboard' : '/technician/dashboard')} 
          className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          ← Volver al Panel
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-indigo-600 p-6 text-white">
            <h1 className="text-2xl font-bold">Detalle de la Visita</h1>
            <p className="opacity-80">ID de Visita: #{visit._id}</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Ubicación Cliente</h3>
                <p className="text-gray-800 font-medium">Lat: {visit.latitud_cliente}</p>
                <p className="text-gray-800 font-medium">Lon: {visit.longitud_cliente}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Ubicación Técnico</h3>
                <p className="text-gray-800 font-medium">Lat: {visit.latitud_tecnico}</p>
                <p className="text-gray-800 font-medium">Lon: {visit.longitud_tecnico}</p>
              </div>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-indigo-800 uppercase">Cálculo de Precio</h3>
                  <p className="text-gray-600 text-sm">Distancia: {visit.distancia_km} km</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">${visit.precio_final.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              {user.role === 'technician' && visit.status === 'scheduled' && (
                <button 
                  onClick={handleConfirmCompletion}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg"
                >
                  Marcar como Completada (Esperar Pago)
                </button>
              )}

              {user.role === 'client' && visit.status === 'completed' && (
                <button 
                  onClick={() => setIsPaymentOpen(true)}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                >
                  Pagar Servicio Ahora
                </button>
              )}

              {visit.status === 'paid' && (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-600 font-bold text-lg">
                    <span>✅ Pago Recibido</span>
                  </div>
                  {user.role === 'client' && (
                    <button 
                      onClick={() => setIsReviewOpen(true)}
                      className="bg-yellow-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-yellow-600 transition-colors shadow-lg"
                    >
                      Calificar Servicio
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReviewModal 
        visitId={id} 
        isOpen={isReviewOpen} 
        onClose={() => setIsReviewOpen(false)} 
        onReviewed={() => fetchVisitData()} 
      />

      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        paymentType="visit"
        itemId={id}
        amount={visit?.precio_final}
        successUrl={`http://localhost:5173/client/visit/${id}?payment=success`}
        cancelUrl={`http://localhost:5173/client/visit/${id}?payment=cancelled`}
      />
    </div>
  );
}


