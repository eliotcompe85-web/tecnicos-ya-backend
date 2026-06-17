# 📚 Índice de Documentación - Técnicos Ya v2

Guía completa de navegación de documentación con Rate Limiting & Logging.

## 🚀 Empezar Rápido (5 minutos)

1. **[README.md](./README.md)** ← Comienza aquí
   - Descripción del proyecto
   - Stack tecnológico
   - Credenciales de prueba
   - Comandos básicos para iniciar

2. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**
   - Guía de instalación paso a paso
   - Requisitos del sistema

---

## 💻 Para Desarrolladores

### Backend (FastAPI + SQLAlchemy + Security)

- **[BACKEND_GUIDE.md](./BACKEND_GUIDE.md)** (completo)
  - Estructura del proyecto
  - Instalación del entorno virtual
  - Autenticación JWT
  - Testing con pytest

- **[SECURITY_LOGGING.md](./SECURITY_LOGGING.md)** (NUEVO)
  - Rate limiting en endpoints sensibles
  - Logging estructurado
  - Eventos importantes registrados
  - Debugging en producción

- **[WEBHOOKS.md](./WEBHOOKS.md)** (NUEVO)
  - Procesamiento automático de pagos
  - Setup en Stripe Dashboard
  - Eventos manejados (payment, subscription)
  - Testing local con Stripe CLI

### Frontend (React Native + Expo)

- **[FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)** (completo)
  - Estructura y setup
  - Autenticación (AuthContext)
  - Pantallas y servicios API

### Base de Datos

- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** (completo)
  - Esquema de 7 tablas
  - Diagrama de relaciones
  - Queries útiles

---

## 🔌 Referencia API

- **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** (completo)
  - 25 endpoints documentados
  - Ejemplos cURL
  - Códigos de error

- **[WEBHOOKS.md](./WEBHOOKS.md)** (NUEVO)
  - Webhook endpoint: POST /api/payments/webhook
  - Eventos: payment_intent.succeeded, customer.subscription.updated
  - Setup en Stripe Dashboard
  - Testing local

- **[AUTO_RATING.md](./AUTO_RATING.md)** (NUEVO)
  - Auto-update de ratings después de reseñas
  - Cálculo automático de promedios
  - Ejemplos de flujo

---

## 🧪 Testing y Seguridad

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** (completo)
  - Testing automático + manual
  - 5 flujos de testing
  - Checklist de pantallas

- **[SECURITY_LOGGING.md](./SECURITY_LOGGING.md)** (NUEVO)
  - Rate limiting (protección contra ataques)
  - Logging de eventos
  - Auditoría y debugging

---

## 🔧 Troubleshooting

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** (completo)
  - 15+ soluciones a problemas
  - Debugging avanzado

---

## 🚀 Deployment y Producción

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** (completo)
  - Setup en servidor real
  - Docker, Heroku, Railway
  - Checklist de seguridad
  - Scaling

---

## ⚙️ Configuración

- **[.env.example](./.env.example)**
  - Variables de entorno
  - Configuración por ambiente

---

## 📊 Resumen de Cambios Recientes

### v2.3 - Auto-Update Ratings (2026-06-15)

✅ **Nuevo:**
- Función update_user_rating() automática
- Cálculo de promedio después de cada reseña
- Actualización de rating_avg y rating_count
- Documentación completa

**Comportamiento:**
- Cuando se crea una reseña → Se calcula nuevo promedio automáticamente
- rating_avg = promedio de todas las reseñas (2 decimales)
- rating_count = número total de reseñas

### v2.2 - Webhooks Stripe (2026-06-15)

✅ **Implementado:**
- Webhook endpoint: POST /api/payments/webhook
- Procesamiento automático de pagos
- Actualización automática de membresías

---

## 📋 Estructura de Carpetas

```
ULTIMO PROYECTO/
├── README.md                    ← EMPEZAR AQUÍ
├── SETUP_GUIDE.md              ← Instalación
├── BACKEND_GUIDE.md            ← Backend
├── FRONTEND_GUIDE.md           ← Frontend
├── DATABASE_SCHEMA.md          ← BD
├── API_ENDPOINTS.md            ← API Reference
├── TESTING_GUIDE.md            ← Testing
├── TROUBLESHOOTING.md          ← Debugging
├── DEPLOYMENT_GUIDE.md         ← Producción
├── SECURITY_LOGGING.md         ← Seguridad & Rate Limiting
├── DOCUMENTATION_INDEX.md      ← Este archivo
├── .env.example                ← Configuración
│
├── tecnicos-ya-backend/
│   ├── backend/
│   │   ├── server.py           ← 1150+ líneas (con logging + rate limit)
│   │   └── ...
│   └── frontend/
│       └── ...
│
└── [archivos raíz]
```

---

## 🎯 Guías por Rol

### 👨‍💻 Desarrollador Backend
1. README.md
2. SETUP_GUIDE.md
3. BACKEND_GUIDE.md
4. SECURITY_LOGGING.md ⭐ NUEVO
5. WEBHOOKS.md ⭐ NUEVO
6. AUTO_RATING.md ⭐ NUEVO
7. API_ENDPOINTS.md
8. TESTING_GUIDE.md

### 📱 Desarrollador Frontend
1. README.md
2. SETUP_GUIDE.md
3. FRONTEND_GUIDE.md
4. API_ENDPOINTS.md
5. TESTING_GUIDE.md

### 🚀 DevOps/Infraestructura
1. README.md
2. DATABASE_SCHEMA.md
3. **SECURITY_LOGGING.md** ⭐ NUEVO
4. DEPLOYMENT_GUIDE.md
5. TROUBLESHOOTING.md

### 🧪 QA/Testing
1. README.md
2. TESTING_GUIDE.md
3. **SECURITY_LOGGING.md** ⭐ NUEVO (para ver logs)
4. API_ENDPOINTS.md
5. TROUBLESHOOTING.md

---

## 📊 Métricas Finales

| Métrica | Cantidad |
|---------|----------|
| Endpoints | 26 |
| Tests automáticos | 29 ✅ |
| Pantallas | 19 |
| Tablas BD | 7 |
| Archivos documentación | 12 |
| Líneas documentación | 6500+ |
| Rate limits | 2 |
| Puntos de logging | 8+ |
| Webhook eventos | 3 |
| Funciones auto-update | 1 |

---

## 🔒 Seguridad Implementada

- ✅ Rate limiting en auth
- ✅ Logging de eventos
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS configurado
- ✅ Input validation (Pydantic)

---

## ✨ Próximos Pasos Recomendados

1. **Ahora:** Probar webhooks y ratings automáticos
2. **Esta semana:** Deploy a servidor (Railway/Heroku)
3. **Próximas semanas:** Email validation, notificaciones real-time
4. **Producción:** Chat entre usuarios, pagos con comisión

---

## 📞 Preguntas Frecuentes

**P: ¿Cómo ver logs?**  
R: Durante desarrollo aparecen en consola. En producción, revisar `/tmp/tecnicosya.log`

**P: ¿Qué pasa si me bloquean por rate limit?**  
R: Esperar 1 hora (para login: 10/hora) o cambiar IP

**P: ¿Los tests incluyen rate limiting?**  
R: No, tests bypass rate limiting. Es solo para producción.

**P: ¿Puedo desactivar rate limiting?**  
R: Sí, comentar los decoradores `@limiter.limit()`

---

**Última actualización:** 2026-06-15  
**Versión:** 2.1  
**Estado:** ✅ Documentación completa, seguridad implementada
