# 🧪 Guía de Testing y QA

Manual completo para testear Técnicos Ya - desde endpoints hasta flujos de usuario.

## 📋 Tipos de Testing

### 1. Testing Automático (Pytest)

```bash
cd tecnicos-ya-backend/backend

# Todos los tests
pytest tests/test_api.py -v

# Test específico
pytest tests/test_api.py::TestAuth::test_login -v

# Con cobertura
pytest tests/test_api.py --cov=. --cov-report=html

# Modo watch (repetir con cambios)
pytest-watch tests/test_api.py
```

**Resultado esperado:** 29/29 tests ✅

---

### 2. Testing Manual - API REST

#### Opción A: Usar Documentación Interactiva

```
1. Iniciar servidor: uvicorn server:app --reload
2. Abrir navegador: http://localhost:8000/docs
3. Expandir endpoints
4. Click "Try it out"
5. Llenar parámetros
6. Click "Execute"
```

#### Opción B: Usar cURL

```bash
# 1. Registrar usuario
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "test123",
    "full_name": "Test User",
    "phone": "+56912345678",
    "role": "client"
  }'

# 2. Iniciar sesión
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ejemplo.com",
    "password": "test123"
  }'

# 3. Obtener usuario actual (usar token del paso 2)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer eyJhbGc..."
```

#### Opción C: Usar Postman

1. Descargar [Postman](https://www.postman.com/)
2. Importar colección:
   ```json
   {
     "info": {
       "name": "Técnicos Ya API",
       "description": "Testing endpoints"
     },
     "item": [
       {
         "name": "Auth - Register",
         "request": {
           "method": "POST",
           "url": {
             "raw": "http://localhost:8000/api/auth/register",
             "protocol": "http",
             "host": ["localhost"],
             "port": "8000",
             "path": ["api", "auth", "register"]
           },
           "body": {
             "mode": "raw",
             "raw": "{\"email\":\"test@test.com\",\"password\":\"test123\",\"full_name\":\"Test\",\"role\":\"client\"}"
           }
         }
       }
     ]
   }
   ```
3. Crear variables de entorno
4. Ejecutar requests

---

## 🎯 Flujos de Testing Recomendados

### Flujo 1: Autenticación Cliente

```
✅ 1. Registrar cliente
   POST /api/auth/register
   {
     "email": "cliente_test@test.com",
     "password": "test123",
     "full_name": "Cliente Test",
     "role": "client"
   }

✅ 2. Iniciar sesión
   POST /api/auth/login
   {
     "email": "cliente_test@test.com",
     "password": "test123"
   }
   Guarda el token en variable: {{token}}

✅ 3. Obtener perfil
   GET /api/auth/me
   Header: Authorization: Bearer {{token}}
   Esperado: Datos del cliente

✅ 4. Verificar base de datos
   sqlite3 tecnicos_ya.db
   SELECT * FROM users WHERE email='cliente_test@test.com';
```

### Flujo 2: Crear Solicitud de Servicio

```
✅ 1. Obtener categorías
   GET /api/categories
   Esperado: Array de categorías [{"_id": 1, "name": "Plomería"}, ...]

✅ 2. Crear solicitud
   POST /api/service-requests
   Header: Authorization: Bearer {{token}}
   {
     "category_id": 1,
     "title": "Reparar tubería",
     "description": "Fuga en cocina",
     "address": "Av. Providencia 1234",
     "location": {
       "type": "Point",
       "coordinates": [-51.2093, -33.8688]
     },
     "budget_min": 20000,
     "budget_max": 50000
   }
   Guarda el ID: {{service_request_id}}

✅ 3. Listar solicitudes
   GET /api/service-requests?status=open
   Header: Authorization: Bearer {{token}}
   Esperado: Incluye la solicitud creada

✅ 4. Obtener detalles
   GET /api/service-requests/{{service_request_id}}
   Header: Authorization: Bearer {{token}}
   Esperado: Solicitud con applications: []
```

### Flujo 3: Técnico se Postula

```
✅ 1. Registrar técnico
   POST /api/auth/register
   {
     "email": "tecnico_test@test.com",
     "password": "test123",
     "full_name": "Técnico Test",
     "role": "technician"
   }
   Guarda token: {{tech_token}}

✅ 2. Actualizar perfil técnico
   PUT /api/technicians/profile
   Header: Authorization: Bearer {{tech_token}}
   {
     "category_ids": [1, 2],
     "description": "10 años de experiencia",
     "experience_years": 10,
     "availability_status": "available",
     "location": {
       "type": "Point",
       "coordinates": [-51.2093, -33.8688]
     }
   }

✅ 3. Buscar trabajos
   GET /api/technicians/search?category_id=1&latitude=-33.8688&longitude=-51.2093&availability=available
   Esperado: Incluye técnico en lista

✅ 4. Crear aplicación
   POST /api/applications
   Header: Authorization: Bearer {{tech_token}}
   {
     "service_request_id": {{service_request_id}},
     "message": "Tengo experiencia, puedo hacerlo",
     "proposed_price": 35000
   }
   Guarda ID: {{application_id}}

✅ 5. Ver mis aplicaciones
   GET /api/applications
   Header: Authorization: Bearer {{tech_token}}
   Esperado: Array con la aplicación creada
```

### Flujo 4: Cliente Acepta Aplicación

```
✅ 1. Ver aplicaciones en solicitud
   GET /api/service-requests/{{service_request_id}}
   Header: Authorization: Bearer {{client_token}}
   Esperado: applications array con nuestra aplicación

✅ 2. Aceptar aplicación
   PUT /api/applications/{{application_id}}/accept
   Header: Authorization: Bearer {{client_token}}
   Esperado: {"status": "accepted", "visit_created": true, "visit_id": X}
   Guarda: {{visit_id}}

✅ 3. Verificar que creó visita
   GET /api/visits
   Header: Authorization: Bearer {{client_token}}
   Esperado: Array incluye la visita creada
```

### Flujo 5: Reseña y Calificación

```
✅ 1. Crear reseña
   POST /api/reviews
   Header: Authorization: Bearer {{client_token}}
   {
     "visit_id": {{visit_id}},
     "rating": 5,
     "comment": "Excelente trabajo!"
   }
   
✅ 2. Ver reseña creada
   GET /api/reviews/user/{{technician_id}}
   Header: Authorization: Bearer {{client_token}}
   Esperado: Array con la reseña

✅ 3. Verificar rating actualizado
   GET /api/auth/me
   Header: Authorization: Bearer {{tech_token}}
   Esperado: rating_avg y rating_count actualizados
```

---

## 📱 Testing de Frontend

### Setup

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor
npm start

# En menú de Expo:
# Presiona 'w' para web (más fácil de testear)
# O 'a' para Android emulator
# O 'i' para iOS (requiere Mac)
```

### Checklist de Pantallas

**Login/Register:**
- [ ] ✅ Pantalla de login carga
- [ ] ✅ Validación de email requerido
- [ ] ✅ Validación de password requerido
- [ ] ✅ Botón de login deshabilitado si faltan campos
- [ ] ✅ Login exitoso redirige a home
- [ ] ✅ Token se guarda en AsyncStorage
- [ ] ✅ Pantalla de registro funciona
- [ ] ✅ Selector de rol (cliente/técnico) funciona

**Cliente - Home:**
- [ ] ✅ Lista de solicitudes abiertas carga
- [ ] ✅ Cada tarjeta muestra: título, descripción, categoría, cliente
- [ ] ✅ Pull-to-refresh actualiza lista
- [ ] ✅ Click en tarjeta abre detalles

**Cliente - Crear Solicitud:**
- [ ] ✅ Selector de categoría funciona
- [ ] ✅ Inputs de texto (título, descripción) funcionan
- [ ] ✅ Selector de rango presupuestario (min/max)
- [ ] ✅ Botón de geolocalización obtiene ubicación
- [ ] ✅ Reverse geocoding genera dirección
- [ ] ✅ Botón "Crear" envía solicitud
- [ ] ✅ Confirmación visual de éxito
- [ ] ✅ Redirige a solicitud creada

**Cliente - Buscar Técnicos:**
- [ ] ✅ Selector de categoría funciona
- [ ] ✅ Lista de técnicos carga con distancia
- [ ] ✅ Cada tarjeta muestra: nombre, rating, distancia, precio
- [ ] ✅ Badge de disponibilidad visible
- [ ] ✅ Filtro de distancia funciona
- [ ] ✅ Click en técnico abre perfil

**Cliente - Ver Técnico:**
- [ ] ✅ Perfil del técnico carga
- [ ] ✅ Muestra nombre, rating, experiencia
- [ ] ✅ Reseñas cargan correctamente
- [ ] ✅ Botón WhatsApp abre chat
- [ ] ✅ Sin reseñas muestra "Sin calificaciones"

**Cliente - Detalles Solicitud:**
- [ ] ✅ Solicitud completa carga
- [ ] ✅ Aplicaciones de técnicos se muestran
- [ ] ✅ Cada aplicación muestra: nombre técnico, mensaje, precio propuesto
- [ ] ✅ Botón "Aceptar" funciona
- [ ] ✅ Después de aceptar, estado cambia

**Técnico - Home:**
- [ ] ✅ Lista de trabajos disponibles carga
- [ ] ✅ Solo muestra trabajos en su categoría
- [ ] ✅ Respeta filtro de disponibilidad
- [ ] ✅ Cada tarjeta muestra: título, cliente, distancia, precio
- [ ] ✅ Click "Ver detalles" abre job detail
- [ ] ✅ Click "Postular" abre formulario

**Técnico - Detalles Trabajo:**
- [ ] ✅ Trabajo completo con detalles carga
- [ ] ✅ Perfil del cliente visible
- [ ] ✅ Botón WhatsApp funciona
- [ ] ✅ Campo de mensaje se puede escribir
- [ ] ✅ Campo de precio propuesto acepta números
- [ ] ✅ Botón "Postular" envía
- [ ] ✅ Confirmación visual de éxito

**Técnico - Cambiar Disponibilidad:**
- [ ] ✅ Modal selector abre
- [ ] ✅ Tres opciones: available, scheduling, unavailable
- [ ] ✅ Selección se envía al backend
- [ ] ✅ Status actualiza en UI

**Técnico - Membresía:**
- [ ] ✅ Dos planes visibles: Basic ($5.500), Premium ($15.000)
- [ ] ✅ Descripción de beneficios clara
- [ ] ✅ Botón "Suscribirse" abre Stripe checkout
- [ ] ✅ URL de Stripe es válida

**Reseña:**
- [ ] ✅ Selector de estrellas funciona (1-5)
- [ ] ✅ Textarea para comentario funciona
- [ ] ✅ Validación: comentario requerido si hay estrellas
- [ ] ✅ Botón "Enviar" funciona
- [ ] ✅ Confirmación de éxito

---

## 🔗 Testing de Integración

### Test End-to-End Completo

```bash
# Terminal 1: Backend
cd tecnicos-ya-backend/backend
uvicorn server:app --reload

# Terminal 2: Frontend
cd tecnicos-ya-backend/frontend
npm start
# Presiona 'w' para web

# En navegador (http://localhost:19006):
```

Seguir este flujo:

1. **Login como cliente**
   - Credenciales: cliente@test.com / test123
   - Verificar que llega a home

2. **Crear solicitud**
   - Seleccionar categoría "Plomería"
   - Llenar detalles
   - Ubicación debe ser automática
   - Click "Crear"

3. **Buscar técnicos** (en otra sesión/navegador)
   - Login como tecnico@test.com / test123
   - Ver home con trabajos disponibles
   - Debería ver la solicitud creada
   - Click en trabajo → detalles

4. **Postular**
   - Escribir mensaje
   - Proponer precio
   - Click "Postular"

5. **Aceptar aplicación**
   - Volver a sesión cliente
   - Ver detalles solicitud
   - Debería ver la postulación
   - Click "Aceptar"

6. **Dejar reseña**
   - Volver a sesión cliente
   - Buscar sección de reseñas pendientes
   - Calificar (5 estrellas)
   - Escribir comentario
   - Click "Enviar"

7. **Verificar en BD**
   ```bash
   sqlite3 tecnicos_ya.db
   SELECT * FROM reviews ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM users WHERE role='technician'\G
   ```

---

## 📊 Métricas a Verificar

### Performance

- [ ] Login tarda < 1 segundo
- [ ] Listar solicitudes tarda < 2 segundos
- [ ] Búsqueda de técnicos tarda < 3 segundos (con distancia)
- [ ] Crear solicitud tarda < 1 segundo
- [ ] Frontend no se congela al desplazar

### Correctitud

- [ ] Distancia calculada correctamente (verificar en maps)
- [ ] Precio estimado coincide con fórmula: base (9990) + distance_charge
- [ ] Rating actualiza al crear reseña
- [ ] Aplicación cambia de status pending → accepted
- [ ] Visit se crea automáticamente

### Seguridad

- [ ] Sin token, endpoints retornan 401
- [ ] Con token inválido, retorna 401
- [ ] No puedo ver datos de otros usuarios
- [ ] No puedo modificar ajenos

---

## 📝 Reportar Bugs

Cuando encuentres un problema:

1. **Describe el paso a paso**
   - Qué hiciste
   - Qué esperabas
   - Qué sucedió realmente

2. **Incluye errores**
   - Terminal output
   - Console errors (F12 en navegador)
   - Stack trace completo

3. **Información del entorno**
   - SO (Windows/Mac/Linux)
   - Versión Python
   - Versión Node
   - Navegador usado

---

**Última actualización:** 2026-06-15  
**Total de tests automáticos:** 29  
**Cobertura esperada:** >90%
