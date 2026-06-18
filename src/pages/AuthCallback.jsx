import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

export default function AuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('user_id');

    const handleAuth = async () => {
      if (token && userId) {
        try {
          // Consultamos la API para obtener los datos reales del usuario
          const response = await fetch('${import.meta.env.VITE_API_URL}/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            login(userData, token);
            showToast(`¡Bienvenido, ${userData.full_name}!`);
            
            // Redirección inteligente basada en el rol
            if (userData.role === 'admin') navigate('/admin/dashboard');
            else if (userData.role === 'technician') navigate('/technician/dashboard');
            else navigate('/client/dashboard');
          } else {
            throw new Error('No se pudo validar la sesión');
          }
        } catch (error) {
          console.error('Auth error:', error);
          showToast('Error al validar la sesión de Google', 'error');
          navigate('/login');
        }
      } else {
        showToast('Token de autenticación faltante', 'error');
        navigate('/login');
      }
    };

    handleAuth();
  }, [login, navigate, showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Sincronizando tu cuenta de Google...</p>
      </div>
    </div>
  );
}


