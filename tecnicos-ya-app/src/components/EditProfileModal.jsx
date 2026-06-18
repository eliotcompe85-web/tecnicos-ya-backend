import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    description: '',
    experience_years: 0,
    category_ids: [],
    availability_status: 'available',
    background_check_cert: '',
    id_card_front: '',
    id_card_back: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/technicians/profile/${user.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Extract data from the serialized profile
        setFormData({
          description: data.description || '',
          experience_years: data.experience_years || 0,
          category_ids: data.category_ids || [],
          availability_status: data.availability_status || 'available',
          background_check_cert: data.background_check_cert || '',
          id_card_front: data.id_card_front || '',
          id_card_back: data.id_card_back || '',
        });
      }
    } catch (error) {
      showToast('Error al cargar el perfil', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/technicians/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast('Perfil actualizado. Espera la validación del administrador.');
        onClose();
      } else {
        const data = await response.json();
        showToast(data.detail || 'Error al actualizar perfil', 'error');
      }
    } catch (error) {
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const categories = [
    { id: 1, name: 'Eléctrico' }, { id: 2, name: 'Gasfitería' }, { id: 3, name: 'Mecánico' },
    { id: 4, name: 'Carpintería' }, { id: 5, name: 'Pintura' }, { id: 6, name: 'Refrigeración' },
    { id: 7, name: 'Jardinería' }, { id: 8, name: 'Limpieza' }, { id: 9, name: 'Tecnología' },
    { id: 10, name: 'Cerrajería' }, { id: 11, name: 'Mudanzas' }, { id: 12, name: 'Construcción' },
  ];

  const toggleCategory = (id) => {
    const current = [...formData.category_ids];
    const index = current.indexOf(id);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    setFormData({ ...formData, category_ids: current });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Editar mi Perfil Profesional</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
            <p className="text-xs text-blue-700 font-medium">⚠️ Nota: Para poder trabajar, debes subir tus documentos de identidad y antecedentes. Un administrador revisará tu perfil.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Especialidades</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    checked={formData.category_ids.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-700 text-sm">Documentación Obligatoria (Links)</h3>
            <div>
              <label className="block text-xs font-medium text-gray-500">Certificado Antecedentes (URL)</label>
              <input
                type="text"
                required
                placeholder="https://..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.background_check_cert}
                onChange={(e) => setFormData({ ...formData, background_check_cert: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Cédula Identidad - Frente (URL)</label>
              <input
                type="text"
                required
                placeholder="https://..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.id_card_front}
                onChange={(e) => setFormData({ ...formData, id_card_front: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Cédula Identidad - Reverso (URL)</label>
              <input
                type="text"
                required
                placeholder="https://..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.id_card_back}
                onChange={(e) => setFormData({ ...formData, id_card_back: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción Profesional</label>
            <textarea
              required
              rows="3"
              placeholder="Cuéntale a los clientes sobre tu experiencia..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Años de Experiencia</label>
              <input
                type="number"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado de Disponibilidad</label>
              <select 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.availability_status}
                onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
              >
                <option value="available">Disponible</option>
                <option value="scheduling">Agenda Llena (Programando)</option>
                <option value="unavailable">No Disponible</option>
              </select>
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
               {loading ? 'Guardando...' : 'Guardar y Solicitar Verificación'}

            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
