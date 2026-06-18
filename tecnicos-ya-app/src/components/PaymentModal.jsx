import { useState } from 'react';
import { useToast } from '../hooks/useToast';

export default function PaymentModal({ isOpen, onClose, paymentType, amount, itemId, successUrl, cancelUrl }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLoading(true);
    try {
      const endpoint = paymentType === 'membership' 
        ? 'http://localhost:8000/api/payments/membership/checkout' 
        : 'http://localhost:8000/api/payments/visit/checkout';

      const body = paymentType === 'membership' 
        ? { plan: 'premium', success_url: successUrl, cancel_url: cancelUrl }
        : { visit_id: itemId, success_url: successUrl, cancel_url: cancelUrl };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        showToast(data.detail || 'Error al iniciar el pago', 'error');
      }
    } catch (error) {
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Confirmar Pago</h2>
          <p className="text-gray-600 mt-2">
            {paymentType === 'membership' 
              ? 'Suscripción Premium - Acceso total a la plataforma' 
              : 'Pago por Servicio Técnico'}
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center mb-6">
          <p className="text-sm text-gray-500">Total a pagar</p>
          <p className="text-3xl font-bold text-indigo-600">
            ${amount ? amount.toLocaleString() : '5.500'}
          </p>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
          >
            {loading ? 'Procesando...' : 'Pagar con Tarjeta'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
