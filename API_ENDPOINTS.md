# 📋 Referencia Completa de API Endpoints

## Base URL
```
http://localhost:8000
```

## Autenticación
Todos los endpoints (excepto registro y login) requieren header:
```
Authorization: Bearer {token}
```

---

## 🔐 Autenticación

### Registrar usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "micontraseña",
  "full_name": "Juan Pérez",
  "phone": "+56912345678",
  "role": "client"  // o "technician"
}
```

**Response 201:**
```json
{
  "_id": 1,
  "email": "usuario@ejemplo.com",
  "full_name": "Juan Pérez",
  "phone": "+56912345678",
  "role": "client",
  "rating_avg": null,
  "rating_count": 0
}
```

### Iniciar sesión
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "micontraseña"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "_id": 1,
    "email": "usuario@ejemplo.com",
    "role": "client"
  }
}
```

### Obtener usuario actual
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "_id": 1,
  "email": "usuario@ejemplo.com",
  "full_name": "Juan Pérez",
  "role": "client",
  "rating_avg": 4.5,
  "rating_count": 12
}
```

---

## 🏷️ Categorías

### Listar todas las categorías
```http
GET /api/categories
```

**Response 200:**
```json
[
  {
    "_id": 1,
    "name": "Plomería"
  },
  {
    "_id": 2,
    "name": "Electricidad"
  },
  {
    "_id": 3,
    "name": "Gasfitería"
  }
]
```

---

## 👨‍🔧 Técnicos

### Buscar técnicos
```http
GET /api/technicians/search?category_id=1&latitude=-33.8688&longitude=-51.2093&max_distance_km=10&availability=available
```

**Query Parameters:**
- `category_id` (required): ID de categoría
- `latitude` (required): Latitud del cliente
- `longitude` (required): Longitud del cliente
- `max_distance_km` (optional, default=50): Distancia máxima
- `availability` (optional): available | scheduling | unavailable

**Response 200:**
```json
[
  {
    "_id": 2,
    "user_id": 2,
    "user": {
      "_id": 2,
      "full_name": "Carlos Técnico",
      "email": "tecnico@test.com",
      "phone": "+56987654321",
      "rating_avg": 4.8,
      "rating_count": 25
    },
    "category_ids": [1, 2],
    "description": "10 años de experiencia en plomería",
    "experience_years": 10,
    "certifications": ["Cert Plomería 2020"],
    "availability_status": "available",
    "membership_type": "premium",
    "location": {
      "type": "Point",
      "coordinates": [-33.8688, -51.2093]
    },
    "distance_km": 2.5,
    "created_at": "2026-01-15T10:30:00"
  }
]
```

### Ver perfil de técnico
```http
GET /api/technicians/profile/{user_id}
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "_id": 2,
  "user_id": 2,
  "user": {
    "_id": 2,
    "full_name": "Carlos Técnico",
    "email": "tecnico@test.com",
    "phone": "+56987654321",
    "rating_avg": 4.8,
    "rating_count": 25
  },
  "category_ids": [1, 2],
  "description": "Especialista en plomería residencial",
  "experience_years": 10,
  "certifications": ["Cert Plomería 2020", "Agua Caliente"],
  "portfolio_images": ["url1", "url2"],
  "availability_status": "available",
  "membership_type": "premium",
  "location": {
    "type": "Point",
    "coordinates": [-33.8688, -51.2093]
  },
  "created_at": "2026-01-15T10:30:00",
  "reviews": [
    {
      "_id": 5,
      "visit_id": 12,
      "reviewer_id": 1,
      "reviewee_id": 2,
      "rating": 5,
      "comment": "Excelente trabajo!",
      "created_at": "2026-06-10T15:45:00",
      "from_user_name": "Juan Cliente"
    }
  ]
}
```

### Actualizar perfil técnico
```http
PUT /api/technicians/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "category_ids": [1, 2, 3],
  "description": "Nueva descripción",
  "experience_years": 12,
  "certifications": ["Cert1", "Cert2"],
  "portfolio_images": ["url1", "url2"],
  "location": {
    "type": "Point",
    "coordinates": [-33.8688, -51.2093]
  }
}
```

**Response 200:** Perfil actualizado

### Cambiar disponibilidad
```http
PUT /api/technicians/availability
Authorization: Bearer {token}
Content-Type: application/json

{
  "availability_status": "available"
}
```

**Valores válidos:** `available` | `scheduling` | `unavailable`

**Response 200:**
```json
{
  "status": "success",
  "new_status": "available"
}
```

---

## 🛠️ Solicitudes de Servicio

### Crear solicitud
```http
POST /api/service-requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "category_id": 1,
  "title": "Reparar tubería rota",
  "description": "Tengo una fuga en la cocina",
  "address": "Av. Providencia 1234, Santiago",
  "location": {
    "type": "Point",
    "coordinates": [-33.8688, -51.2093]
  },
  "budget_min": 20000,
  "budget_max": 50000
}
```

**Response 201:**
```json
{
  "_id": 10,
  "client_id": 1,
  "client_name": "Juan Cliente",
  "client_rating": 4.5,
  "category_id": 1,
  "category_name": "Plomería",
  "title": "Reparar tubería rota",
  "description": "Tengo una fuga en la cocina",
  "address": "Av. Providencia 1234, Santiago",
  "status": "open",
  "budget_min": 20000,
  "budget_max": 50000,
  "location": {
    "type": "Point",
    "coordinates": [-33.8688, -51.2093]
  },
  "created_at": "2026-06-15T10:30:00",
  "applications": [],
  "estimated_price": {
    "base": 9990,
    "distance_charge": 0,
    "total": 9990
  }
}
```

### Listar solicitudes
```http
GET /api/service-requests?status=open
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): open | in_progress | completed

**Response 200:** Array de solicitudes

### Obtener detalles de solicitud
```http
GET /api/service-requests/{id}
Authorization: Bearer {token}
```

**Response 200:** Solicitud con aplicaciones anidadas

---

## 📝 Aplicaciones (Postulaciones)

### Crear aplicación
```http
POST /api/applications
Authorization: Bearer {token}
Content-Type: application/json

{
  "service_request_id": 10,
  "message": "Tengo experiencia en esto y puedo hacerlo en 2 horas",
  "proposed_price": 35000
}
```

**Response 201:**
```json
{
  "_id": 15,
  "service_request_id": 10,
  "technician_id": 2,
  "technician_name": "Carlos Técnico",
  "technician_rating": 4.8,
  "service_request": {
    "title": "Reparar tubería rota",
    "description": "Tengo una fuga en la cocina",
    "address": "Av. Providencia 1234",
    "status": "open"
  },
  "message": "Tengo experiencia en esto...",
  "proposed_price": 35000,
  "status": "pending",
  "created_at": "2026-06-15T10:35:00"
}
```

### Mis aplicaciones
```http
GET /api/applications
Authorization: Bearer {token}
```

**Response 200:** Array de aplicaciones del técnico

### Aceptar aplicación
```http
PUT /api/applications/{id}/accept
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "status": "accepted",
  "visit_created": true,
  "visit_id": 8
}
```

---

## ⭐ Reseñas

### Crear reseña
```http
POST /api/reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "visit_id": 8,
  "rating": 5,
  "comment": "Excelente trabajo, muy profesional"
}
```

**Response 201:**
```json
{
  "_id": 5,
  "visit_id": 8,
  "reviewer_id": 1,
  "reviewee_id": 2,
  "rating": 5,
  "comment": "Excelente trabajo, muy profesional",
  "created_at": "2026-06-15T11:00:00",
  "from_user_name": "Juan Cliente"
}
```

### Reseñas de un usuario
```http
GET /api/reviews/user/{user_id}
Authorization: Bearer {token}
```

**Response 200:** Array de reseñas

### Reseñas pendientes
```http
GET /api/reviews/pending
Authorization: Bearer {token}
```

**Response 200:** Array de visitas sin reseña

---

## 🚗 Visitas

### Crear visita
```http
POST /api/visits
Authorization: Bearer {token}
Content-Type: application/json

{
  "technician_id": 2,
  "latitud_cliente": -33.8688,
  "longitud_cliente": -51.2093
}
```

**Response 201:** Visita creada

### Listar visitas
```http
GET /api/visits
Authorization: Bearer {token}
```

**Response 200:** Array de visitas

### Mis visitas
```http
GET /api/visits/my-visits
Authorization: Bearer {token}
```

**Response 200:** Visitas del usuario actual

### Confirmar visita
```http
PUT /api/visits/{id}/confirm
Authorization: Bearer {token}
```

**Response 200:** Visita confirmada

---

## 💳 Pagos

### Crear sesión Stripe (Membresía)
```http
POST /api/payments/membership-checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan": "basic",
  "success_url": "https://ejemplo.com/success",
  "cancel_url": "https://ejemplo.com/cancel"
}
```

**Response 200:**
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/...",
  "session_id": "cs_test_...",
  "plan": "basic",
  "amount": 5500,
  "demo_mode": true
}
```

### Crear sesión Stripe (Visita)
```http
POST /api/payments/visit-checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "visit_id": 8,
  "success_url": "https://ejemplo.com/success",
  "cancel_url": "https://ejemplo.com/cancel"
}
```

### Estado de sesión de pago
```http
GET /api/payments/session/{session_id}
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "status": "complete",
  "payment_status": "paid",
  "customer_email": "cliente@test.com",
  "amount_total": 35000
}
```

---

## 🔔 Notificaciones

### Obtener notificaciones
```http
GET /api/notifications
Authorization: Bearer {token}
```

**Response 200:**
```json
[
  {
    "_id": 1,
    "user_id": 1,
    "type": "application_received",
    "title": "Nueva postulación",
    "message": "Carlos Técnico postuló a tu solicitud",
    "read": false,
    "created_at": "2026-06-15T10:00:00"
  }
]
```

---

## 🔍 Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Error en datos |
| 401 | Unauthorized - Sin autenticación |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 500 | Server Error - Error del servidor |

---

## ❌ Manejo de Errores

Todos los errores siguen este formato:

```json
{
  "detail": "Mensaje de error descriptivo"
}
```

Ejemplo:
```json
{
  "detail": "Usuario no encontrado"
}
```

---

## 📝 Notas

- Los tokens JWT expiran en 24 horas
- Las coordenadas de ubicación son [longitud, latitud] en GeoJSON
- Las fechas están en formato ISO 8601 UTC
- Los precios están en pesos chilenos (CLP)
- El sistema está en modo DEMO para Stripe (sin cargo real)

---

**Última actualización:** 2026-06-15
