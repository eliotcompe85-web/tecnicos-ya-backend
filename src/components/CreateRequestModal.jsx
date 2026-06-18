import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';

export default function CreateRequestModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    address: '',
    budget_min: '',
    budget_max: '',
  });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      getUserLocation();
    }
  }, [isOpen]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      showToast('Tu navegador no soporta geolocalización', 'error');
      return;
    }

    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          type: 'Point',
          coordinates: [position.coords.longitude, position.coords.latitude]
        });
        setLocLoading(false);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        showToast('No pudimos obtener tu ubicación automática. Por favor, verifica los permisos.', 'error');
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      showToast('Es necesario obtener tu ubicación para publicar el servicio', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/service-requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          location: location,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Solicitud creada exitosamente');
        onCreated();
        onClose();
      } else {
        showToast(data.detail || 'Error al crear solicitud', 'error');
      }
    } catch (error) {
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Nueva Solicitud</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100 flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-sm text-indigo-700">
              <span>📍 Ubicación: </span>
              {locLoading ? (
                <span className="animate-pulse">Obteniendo GPS...</span>
              ) : location ? (
                <span className="font-medium">Detectada correctamente ✅</span>
              ) : (
                <span className="text-red-500 font-medium">No detectada</span>
              )}
            </div>
            {!location && (
              <button 
                type="button"
                onClick={getUserLocation}
                className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
              >
                Reintentar
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <select 
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Seleccione una categoría</option>
              <option value="1">Eléctrico</option>
              <option value="2">Gasfitería</option>
              <option value="3">Mecánico</option>
              <option value="4">Carpintería</option>
              <option value="5">Pintura</option>
              <option value="6">Refrigeración</option>
              <option value="7">Jardinería</option>
              <option value="8">Limpieza</option>
              <option value="9">Tecnología</option>
              <option value="10">Cerrajería</option>
              <option value="11">Mudanzas</option>
              <option value="12">Construcción</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Título del Trabajo</label>
            <input
              type="text"
              required
              placeholder="Ej: Reparación de cortocircuito"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              required
              rows="3"
              placeholder="Describe el problema detalladamente..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Dirección Exacta</label>
            <input
              type="text"
              required
              placeholder="Calle, Número, Comuna"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Presupuesto Mín.</label>
              <input
                type="number"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Presupuesto Máx.</label>
              <input
                type="number"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {loading ? 'Enviando...' : 'Publicar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


