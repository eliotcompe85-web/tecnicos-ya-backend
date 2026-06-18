import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

export default function TechnicianSearch() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category_id: '',
    max_distance_km: 20,
  });
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Get user location for distance-based search
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          fetchTechnicians(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          showToast('Habilita la ubicación para ver técnicos cercanos', 'error');
          // Fallback to dummy location for demo if geolocation fails
          setUserLocation({ lat: -33.4489, lon: -70.6483 });
          fetchTechnicians(-33.4489, -70.6483);
        }
      );
    }
  }, []);

  const fetchTechnicians = async (lat, lon) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category_id: filters.category_id,
        max_distance_km: filters.max_distance_km,
        latitude: lat,
        longitude: lon
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/technicians/search?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data);
      }
    } catch (error) {
      showToast('Error al buscar técnicos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    if (userLocation) {
      fetchTechnicians(userLocation.lat, userLocation.lon);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/client/dashboard')} 
          className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          ← Volver al Panel
        </button>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Buscar Técnicos</h1>
          
          <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Categoría</label>
              <select 
                name="category_id"
                className="block w-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.category_id}
                onChange={handleFilterChange}
              >
                <option value="">Todas</option>
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
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Distancia Máx (km)</label>
              <input 
                type="number"
                name="max_distance_km"
                className="block w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.max_distance_km}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
        ) : technicians.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow text-center text-gray-500">
            <p className="text-lg">No encontramos técnicos que coincidan con tu búsqueda.</p>
            <p className="text-sm">Prueba ampliando el radio de distancia o cambiando la categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicians.map(tech => (
              <div key={tech._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">{tech.user.full_name}</h3>
                      <p className="text-indigo-600 font-medium text-sm">Especialista</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                      ⭐ {tech.user.rating_avg || 'N/A'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tech.description || 'Sin descripción disponible.'}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                    <span>📍 {tech.distance_km ? `${tech.distance_km} km de distancia` : 'Ubicación no disponible'}</span>
                    <span>Exp: {tech.experience_years} años</span>
                  </div>
                  <button 
                    onClick={() => showToast(`Próximamente: Chat con ${tech.user.full_name}`)}
                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Contactar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


