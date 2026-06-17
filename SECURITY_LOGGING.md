# 🔒 Rate Limiting y Logging - Implementación

Documentación de las mejoras de seguridad y debugging agregadas al backend.

## 📋 Cambios Implementados

### 1. Rate Limiting (slowapi)

**Protección contra ataques de fuerza bruta en endpoints sensibles.**

#### Instalación
```bash
pip install slowapi>=0.1.9
```

#### Endpoints Protegidos

| Endpoint | Límite | Propósito |
|----------|--------|-----------|
| `POST /api/auth/register` | 5/hora | Prevenir creación masiva de cuentas |
| `POST /api/auth/login` | 10/hora | Prevenir ataques de fuerza bruta |

#### Comportamiento

Si un usuario intenta exceder el límite:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "detail": "Demasiadas solicitudes. Intenta de nuevo en un momento."
}
```

#### Cómo Funciona

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/auth/login")
@limiter.limit("10/hour")
def login(request: Request, credentials: UserLogin, db: Session):
    # Solo 10 intentos por hora desde la misma IP
    ...
```

---

### 2. Logging Estructurado

**Registro detallado de eventos para debugging y auditoría.**

#### Configuración

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
```

#### Eventos Registrados

| Evento | Nivel | Ejemplo |
|--------|-------|---------|
| Registro exitoso | ✅ INFO | `✅ REGISTRO EXITOSO: Usuario ID 1 (client)` |
| Registro fallido | ❌ WARNING | `❌ REGISTRO FALLIDO: Email test@test.com ya existe` |
| Login exitoso | ✅ INFO | `✅ LOGIN EXITOSO: Usuario ID 2 (technician)` |
| Login fallido | ❌ WARNING | `❌ LOGIN FALLIDO: Credenciales inválidas para test@test.com` |
| Solicitud creada | 📋 INFO | `📋 SOLICITUD CREADA POR: Cliente ID 1` |
| Postulación creada | 📤 INFO | `📤 POSTULACIÓN INICIADA: Técnico ID 2 a Solicitud ID 5` |
| Reseña creada | ⭐ INFO | `⭐ RESEÑA INICIADA: Usuario ID 1 para Visita ID 3` |

#### Ver Logs en Desarrollo

Durante desarrollo, los logs se muestran en la consola:

```bash
cd tecnicos-ya-backend/backend
uvicorn server:app --reload

# Output:
# 2026-06-15 14:30:45,123 - server - INFO - 📝 REGISTRO INICIADO: test@test.com
# 2026-06-15 14:30:45,456 - server - INFO - ✅ REGISTRO EXITOSO: Usuario ID 1 (client)
# 2026-06-15 14:30:50,789 - server - INFO - 🔐 LOGIN INICIADO: test@test.com
# 2026-06-15 14:30:50,999 - server - INFO - ✅ LOGIN EXITOSO: Usuario ID 1 (client)
```

#### Ver Logs en Producción

Buscar en archivo `/tmp/tecnicosya.log`:

```bash
tail -f /tmp/tecnicosya.log

# o buscar errores
grep "ERROR\|❌\|FALLIDO" /tmp/tecnicosya.log

# o buscar usuario específico
grep "test@test.com" /tmp/tecnicosya.log
```

---

## 🧪 Testing

Todos los 29 tests siguen pasando ✅:

```bash
pytest tests/test_api.py -q
# .............................
# 29 passed in 5.42s
```

### Rate Limit Testing

Para testear rate limiting (no afecta tests automatizados):

```bash
# Simular 11 intentos de login en 1 hora
for i in {1..11}; do
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Intento $i"
  sleep 2
done

# El intento 11 retornará 429 Too Many Requests
```

---

## 📊 Impacto de Seguridad

### Antes
- ❌ Ataques de fuerza bruta sin protección
- ❌ No hay trazabilidad de actividades
- ❌ Difícil debuggear problemas en producción

### Después
- ✅ Rate limiting detiene ataques de fuerza bruta
- ✅ Logging de todos los eventos importantes
- ✅ Auditoría completa de actividades
- ✅ Debugging fácil en producción

---

## 🔐 Recomendaciones Futuras

1. **Aumentar protección**: Agregar rate limiting a otros endpoints:
   ```python
   @app.post("/api/service-requests")
   @limiter.limit("10/day")  # 10 solicitudes por día
   def create_service_request(...):
   ```

2. **Integrar con sistemas de alertas**: 
   ```python
   if failed_login_attempts > 5:
       alert_security_team(email)  # Enviar alerta
   ```

3. **Agregar IP whitelist para admin**:
   ```python
   if ip not in ADMIN_WHITELIST and endpoint == "admin":
       raise HTTPException(429, "No permitido")
   ```

4. **Enviar logs a servicio externo**:
   ```python
   from pythonjsonlogger import jsonlogger
   handler = logging.FileHandler('logs.json')
   handler.setFormatter(jsonlogger.JsonFormatter())
   logger.addHandler(handler)
   ```

---

## 📝 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `requirements.txt` | +slowapi, +sqlalchemy, +stripe |
| `server.py` | +logging, +rate limiting, +decoradores |

## ⚙️ Compatibilidad

- ✅ Compatible con todos los tests existentes
- ✅ No requiere cambios en el frontend
- ✅ No requiere cambios en la BD
- ✅ Totalmente retrocompatible

---

**Última actualización:** 2026-06-15  
**Estado:** ✅ Implementado y testeado
