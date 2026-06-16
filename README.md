# 🔧 Técnicos Ya - Marketplace de Servicios Técnicos

**Plataforma digital que conecta clientes que necesitan servicios técnicos con profesionales especializados en su área.**

## 📋 Descripción del Proyecto

Técnicos Ya es una aplicación móvil cross-platform (iOS/Android) que permite:
- **Clientes:** Crear solicitudes de servicio, buscar técnicos cercanos, calificar y pagar por servicios
- **Técnicos:** Buscar trabajos disponibles, postular a solicitudes, gestionar disponibilidad, recibir pagos

## 🏗️ Arquitectura

```
CLIENTE (React Native + Expo Router)
        ↓ API REST (JSON)
BACKEND (FastAPI + SQLAlchemy)
        ↓ SQL
DATABASE (SQLite)
```

## 📦 Stack Tecnológico

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **ORM:** SQLAlchemy
- **Base de Datos:** SQLite
- **Autenticación:** JWT + bcrypt
- **Pagos:** Stripe API
- **Testing:** pytest

### Frontend
- **Framework:** Expo (React Native)
- **Lenguaje:** TypeScript
- **Routing:** Expo Router
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS
- **State Management:** React Context API

## 🚀 Instalación Rápida

### Opción 1: Setup Automático (Recomendado)

```bash
cd "C:\Users\jimmy\Desktop\ULTIMO PROYECTO"
python setup.py
```

### Opción 2: Setup Manual

#### Backend
```bash
cd tecnicos-ya-backend/backend

# 1. Crear entorno virtual
python -m venv venv
.\venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Iniciar servidor
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Backend en:** `http://localhost:8000`
**Documentación API:** `http://localhost:8000/docs`

#### Frontend
```bash
cd tecnicos-ya-backend/frontend

# 1. Instalar dependencias
npm install

# 2. Iniciar Expo
npm start

# 3. En la terminal que abre:
#    - Presiona 'i' para iOS (en Mac)
#    - Presiona 'a' para Android
#    - Presiona 'w' para web
```

## 👥 Credenciales de Prueba

### Cliente
- Email: `cliente@test.com`
- Password: `test123`

### Técnico  
- Email: `tecnico@test.com`
- Password: `test123`

## 🔌 API Endpoints (25 rutas)

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Categorías
- `GET /api/categories` - Listar todas las categorías

### Técnicos
- `GET /api/technicians/search` - Buscar técnicos (con filtros)
- `GET /api/technicians/profile/{user_id}` - Ver perfil técnico
- `PUT /api/technicians/profile` - Actualizar perfil técnico
- `PUT /api/technicians/availability` - Cambiar disponibilidad

### Solicitudes de Servicio
- `POST /api/service-requests` - Crear solicitud
- `GET /api/service-requests` - Listar solicitudes
- `GET /api/service-requests/{id}` - Obtener detalles

### Aplicaciones
- `POST /api/applications` - Crear aplicación a solicitud
- `GET /api/applications` - Mis aplicaciones
- `PUT /api/applications/{id}/accept` - Aceptar aplicación

### Reseñas
- `POST /api/reviews` - Crear reseña
- `GET /api/reviews/user/{user_id}` - Reseñas de usuario
- `GET /api/reviews/pending` - Reseñas pendientes

### Visitas
- `POST /api/visits` - Crear visita
- `GET /api/visits` - Listar visitas
- `GET /api/visits/my-visits` - Mis visitas
- `PUT /api/visits/{id}/confirm` - Confirmar visita

### Pagos
- `POST /api/payments/membership-checkout` - Crear sesión Stripe (membresía)
- `POST /api/payments/visit-checkout` - Crear sesión Stripe (visita)
- `GET /api/payments/session/{session_id}` - Estado de sesión

### Notificaciones
- `GET /api/notifications` - Obtener notificaciones

## 📱 Flujos de Usuario

### Cliente
1. ✅ Registrarse / Iniciar sesión
2. ✅ Crear solicitud de servicio (ubicación automática)
3. ✅ Ver técnicos cercanos y disponibles
4. ✅ Ver perfil y reseñas de técnicos
5. ✅ Aceptar postulación de técnico
6. ✅ Pagar por servicio (Stripe)
7. ✅ Calificar y comentar al técnico

### Técnico
1. ✅ Registrarse / Iniciar sesión  
2. ✅ Cambiar disponibilidad (disponible/agendando/no disponible)
3. ✅ Ver trabajos disponibles cercanos
4. ✅ Postular a trabajos con propuesta de precio
5. ✅ Ver perfil del cliente
6. ✅ Suscribirse a membresía (Basic/Premium)
7. ✅ Calificar y comentar al cliente

## 💳 Planes de Membresía

| Plan | Precio | Beneficios |
|------|--------|-----------|
| **Ninguno** | Gratis | Acceso básico |
| **Basic** | $5.500/mes | Visibilidad aumentada |
| **Premium** | $15.000/mes | Prioridad + destacado |

*Nota: Sistema en modo DEMO (sin API real de Stripe)*

## 📊 Base de Datos

### Tablas (7)
- `users` - Usuarios (clientes + técnicos)
- `technician_profiles` - Perfiles de técnicos
- `service_requests` - Solicitudes de clientes
- `applications` - Postulaciones de técnicos
- `visits` - Registro de visitas completadas
- `reviews` - Reseñas y calificaciones
- `categories` - Categorías de servicios

## 🧪 Testing

```bash
cd tecnicos-ya-backend/backend

# Ejecutar todos los tests
pytest tests/test_api.py -v

# Ejecutar tests específicos
pytest tests/test_api.py::TestAuth -v
pytest tests/test_api.py::TestTechnicians -v
```

**Resultado:** 29/29 tests ✅

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Autenticación con JWT
- ✅ Validación de roles (client/technician)
- ✅ Protección CORS
- ✅ Input validation con Pydantic
- ✅ Headers de seguridad
- ✅ **Rate limiting** en endpoints sensibles (previene ataques de fuerza bruta)
- ✅ **Logging estructurado** de eventos para auditoría y debugging

### Nuevas Características de Seguridad (v2.1)

**Rate Limiting:** Protección contra brute force attacks
- `POST /api/auth/register` → máximo 5 intentos/hora
- `POST /api/auth/login` → máximo 10 intentos/hora

**Logging:** Eventos registrados automáticamente
- ✅ Registros exitosos/fallidos
- 🔐 Logins (exitoso/fallido)
- 📋 Solicitudes creadas
- 📤 Postulaciones iniciadas
- ⭐ Reseñas creadas

👉 Ver [SECURITY_LOGGING.md](./SECURITY_LOGGING.md) para detalles completos

## 📝 Configuración

### Variables de Entorno (.env)

```ini
# Backend (opcional - tiene valores por defecto)
DATABASE_URL=sqlite:///./tecnicos_ya.db
JWT_SECRET=tu-clave-secreta-aqui
JWT_ALGORITHM=HS256
STRIPE_API_KEY=sk_test_xxxxx  # Dejar vacío para modo DEMO
```

### Puertos
- Backend: `8000`
- Frontend: `8081` (web), USB (mobile)

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Verificar Python
python --version  # Debe ser 3.10+

# Reinstalar dependencias
pip install -r requirements.txt --force-reinstall
```

### Frontend no se conecta al backend
```bash
# 1. Asegúrate que backend está en puerto 8000
# 2. En archivo API: cambiar localhost a tu IP local (para mobile)
# 3. Reiniciar Expo
```

### Tests fallan
```bash
# Limpiar base de datos de test
rm -f test.db

# Reinstalar pytest
pip install pytest --force-reinstall

# Ejecutar tests nuevamente
pytest tests/test_api.py -v
```

## 📖 Documentación

### Guías de Desarrollo
- [README.md](./README.md) - Este archivo
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Instalación rápida
- [BACKEND_GUIDE.md](./BACKEND_GUIDE.md) - Guía completa del backend
- [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) - Guía completa del frontend
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Esquema de base de datos

### Guías de Testing y Seguridad
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Referencia de 25 endpoints (con ejemplos cURL)
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing automático y manual
- [SECURITY_LOGGING.md](./SECURITY_LOGGING.md) - Rate limiting + Logging
- [WEBHOOKS.md](./WEBHOOKS.md) - **NUEVO:** Webhooks Stripe para pagos automáticos- [AUTO_RATING.md](./AUTO_RATING.md) - **NUEVO:** Actualización automática de ratings- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Soluciones a problemas comunes
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Guía de deployment a producción

### Índice General
- [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - Índice completo de documentación

### Archivos de Configuración
- [.env.example](./.env.example) - Variables de entorno (copiar y customizar)

## 👨‍💼 Datos de Prueba

La aplicación viene con datos seed precargados:
- 2 usuarios test (cliente + técnico)
- 5 categorías de servicios
- 3 solicitudes de ejemplo
- 2 técnicos de ejemplo

Los datos se generan automáticamente en el primer inicio.

## 🚀 Deployment

### Backend (Producción)
```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend (EAS Build - Recommended)
```bash
npm install -g eas-cli
eas build --platform all
```

## 📞 Soporte

Para reportar bugs o sugerencias:
1. Revisa [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Verifica los logs del backend: `http://localhost:8000/docs`
3. Revisa la consola de Expo

## 📄 Licencia

Propietario - Todos los derechos reservados

---

**Versión:** 1.0.0  
**Última actualización:** 2026-06-15  
**Estado:** ✅ LISTO PARA PRODUCCIÓN

## Nota sobre Rate Limiting (desarrollo vs producción)

- Para evitar interbloqueos y flakiness en pruebas locales, el backend DESACTIVA el rate limiter por defecto. Esto se controla con la variable de entorno `DISABLE_RATE_LIMITS`.
- Para activar el rate limiter (recomendado en producción), inicia el servidor con `DISABLE_RATE_LIMITS=0`. Ejemplo (PowerShell):

```powershell
$env:DISABLE_RATE_LIMITS='0'
& '.\.venv\Scripts\python.exe' -m uvicorn server:app --host 127.0.0.1 --port 8001
```

La lógica y la variable están documentadas en `tecnicos-ya-backend/backend/server.py`.
