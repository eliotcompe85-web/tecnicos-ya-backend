import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [request, setRequest] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequestData();
  }, [id]);

  const fetchRequestData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      
      const reqRes = await fetch(`${import.meta.env.VITE_API_URL}/api/service-requests/${id}`, { headers });
      if (!reqRes.ok) throw new Error('Error al cargar la solicitud');
      const reqData = await reqRes.json();
      setRequest(reqData);

      const appRes = await fetch(`${import.meta.env.VITE_API_URL}/api/applications`, { headers });
      if (!appRes.ok) throw new Error('Error al cargar postulaciones');
      const appData = await appRes.json();
      
      const filteredApps = appData.filter(app => app.service_request_id === parseInt(id));
      setApplications(filteredApps);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (appId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/applications/${appId}/accept`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
      });

      if (response.ok) {
        showToast('Técnico aceptado exitosamente');
        
        // The backend create a Visit when application is accepted (usually)
        // Let's try to find the visit created for this request
        const visitRes = await fetch(`${import.meta.env.VITE_API_URL}/api/visits`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const visits = await visitRes.json();
        const activeVisit = visits.find(v => v.technician_id === applications.find(a => a._id === appId).technician_id);
        
        if (activeVisit) {
          navigate(`/client/visit/${activeVisit._id}`);
        } else {
          navigate('/client/dashboard');
        }
      } else {
        const data = await response.json();
        showToast(data.detail || 'Error al aceptar técnico', 'error');
      }
    } catch (error) {
      showToast('Error de conexión con el servidor', 'error');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!request) return <div className="min-h-screen flex items-center justify-center">Solicitud no encontrada</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/client/dashboard')} 
          className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          ← Volver al Panel
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{request.title}</h1>
              <p className="text-gray-600">{request.address}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              request.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {request.status}
            </span>
          </div>
          <p className="text-gray-700 border-t pt-4">{request.description}</p>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Postulaciones Recibidas</h2>
        {applications.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            Aún no hay técnicos postulados para este trabajo.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {applications.map(app => (
              <div key={app._id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-gray-800">{app.technician_name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">⭐ {app.technician_rating || 'Sin calificación'}</span>
                  </div>
                  <p className="text-sm text-gray-600 italic mb-2">"{app.message}"</p>
                  <p className="text-lg font-bold text-indigo-600">${app.proposed_price.toLocaleString()}</p>
                </div>
                {request.status === 'open' && (
                  <button 
                    onClick={() => handleAccept(app._id)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Aceptar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


