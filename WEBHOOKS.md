# 🔌 Webhooks Stripe - Implementación

Documentación completa de webhooks para procesamiento automático de pagos.

## 📋 ¿Qué son los Webhooks?

Los webhooks permiten que Stripe notifique automáticamente a tu servidor cuando:
- ✅ Un cliente completa un pago
- ✅ Una suscripción de membresía se activa
- ✅ Una suscripción se cancela

Sin webhooks, deberías **sondear constantemente** Stripe para saber el estado del pago (ineficiente).

Con webhooks, Stripe **empuja los eventos a tu servidor** (eficiente y en tiempo real).

---

## 🔧 Cómo Funciona

### Flujo de Pago (Antes - Sin Webhooks)

```
1. Cliente paga en Stripe ✓
2. Frontend pregunta: "¿Está pagado?" (polling)
3. Backend consulta Stripe: "¿Session XYZ está pagada?"
4. Respuesta tarde: "Espera, déjame ver..."
5. Estado desactualizado durante minutos
```

### Flujo de Pago (Después - Con Webhooks)

```
1. Cliente paga en Stripe ✓
2. Stripe: "¡Pago completado!"
3. Stripe EMPUJA evento a tu servidor
4. Webhook recibe evento: payment_intent.succeeded
5. Backend ACTUALIZA INMEDIATAMENTE Visit.payment_status = "paid"
6. Estado actualizado en millisegundos ✨
```

---

## 🚀 Setup en Stripe Dashboard

### Paso 1: Obtener URL Pública de Webhook

Tu servidor debe estar **accesible desde internet** para que Stripe envíe eventos.

#### Opciones:

**A) Development (Localhost) - ngrok**

```bash
# 1. Descargar ngrok: https://ngrok.com
# 2. Ejecutar
ngrok http 8000

# Output:
# Forwarding: https://abc123.ngrok.io -> http://localhost:8000
```

Tu URL de webhook: `https://abc123.ngrok.io/api/payments/webhook`

**B) Production - Servidor Real**

URL: `https://tudominio.com/api/payments/webhook`

### Paso 2: Registrar Webhook en Stripe Dashboard

1. Ir a: https://dashboard.stripe.com/webhooks
2. Click: "Add endpoint"
3. Ingresar URL: `https://abc123.ngrok.io/api/payments/webhook`
4. Seleccionar eventos:
   - `payment_intent.succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click: "Create endpoint"

### Paso 3: Copiar Webhook Secret

1. En la lista de webhooks, click en el que acabas de crear
2. Copiar el "Signing secret"
3. Guardar en `.env`:

```ini
STRIPE_WEBHOOK_SECRET=whsec_test_abc123xyz...
```

### Paso 4: Reiniciar Backend

```bash
cd tecnicos-ya-backend/backend
uvicorn server:app --reload
```

---

## 📨 Eventos Manejados

### 1. `payment_intent.succeeded` - Pago de Visita Completado

**Cuándo ocurre:** Cliente completa el pago de una visita

**Qué hace:**
```python
# Antes
Visit.payment_status = "pending"  # ❌ No pagado

# Después de webhook
Visit.payment_status = "paid"     # ✅ Pagado
```

**Log:**
```
✅ PAGO COMPLETADO: Visita ID 507f1f77bcf86cd799439011 marcada como pagada
```

### 2. `customer.subscription.updated` - Membresía Activada

**Cuándo ocurre:** Técnico se suscribe a un plan (Basic/Premium)

**Qué hace:**
```python
# Antes
User.membership_type = "none"           # ❌ Sin membresía

# Después de webhook
User.membership_type = "premium"        # ✅ Premium
User.membership_start_date = now()      # ✅ Inicio registrado
User.membership_end_date = now() + 30d  # ✅ Vencimiento en 30 días
```

**Log:**
```
✅ MEMBRESÍA ACTIVADA: Usuario ID 10 con plan premium
```

### 3. `customer.subscription.deleted` - Membresía Cancelada

**Cuándo ocurre:** Técnico cancela su suscripción o vence

**Qué hace:**
```python
# Antes
User.membership_type = "premium"        # ✅ Premium activo

# Después de webhook
User.membership_type = "none"           # ❌ Membresía removida
User.membership_start_date = None       # ❌ Limpiado
User.membership_end_date = None         # ❌ Limpiado
```

**Log:**
```
❌ MEMBRESÍA CANCELADA: Usuario ID 10
```

---

## 🧪 Testing Local (Sin Stripe Real)

### Modo Demo (Sin Webhook Secret)

Si **NO TIENES** `STRIPE_WEBHOOK_SECRET` en `.env`, el backend acepta webhooks demo:

```bash
# 1. Asegúrate que backend está corriendo
cd tecnicos-ya-backend/backend
uvicorn server:app --reload

# 2. En otra terminal, simular webhook
curl -X POST http://localhost:8000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "metadata": {
          "visit_id": "507f1f77bcf86cd799439011"
        }
      }
    }
  }'

# Respuesta:
# {"status": "success"}

# En logs del backend:
# ✅ PAGO COMPLETADO: Visita ID 507f1f77bcf86cd799439011 marcada como pagada
```

### Testing con Stripe CLI (Recomendado)

Para testing real sin usar dashboard:

```bash
# 1. Descargar Stripe CLI: https://stripe.com/docs/stripe-cli
# 2. Autenticar
stripe login

# 3. Redirigir webhooks a tu localhost
stripe listen --forward-to localhost:8000/api/payments/webhook

# Output:
# > Ready! Your webhook signing secret is whsec_test_xyz...

# 4. Copiar secret a .env y reiniciar backend

# 5. En otra terminal, disparar evento de test
stripe trigger payment_intent.succeeded

# 6. Ver evento en backend logs:
# ✅ PAGO COMPLETADO: Visita ID ...
```

---

## 🔐 Seguridad

### 1. Verificación de Firma ✅

El webhook verifica la firma Stripe para asegurar que el evento:
- ✅ Viene realmente de Stripe
- ✅ No fue modificado en tránsito
- ✅ No fue falsificado por un atacante

```python
# Verificación automática
event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
# Si signature es inválida → HTTPException 400
```

### 2. Modo Demo (Sin Verificación)

En desarrollo, puedes testear sin webhook secret:

```python
if webhook_secret:
    # Verificar firma
    event = stripe.Webhook.construct_event(...)
else:
    # Demo mode - aceptar sin verificar
    event = json.loads(payload)
```

### 3. Idempotencia

Los webhooks pueden dispararse **múltiples veces** (Stripe reintenta en caso de timeout).

**Solución:** Actualizamos el estado de todas formas (es idempotente):
```python
visit.payment_status = "paid"  # ✓ Llamado 2 veces = mismo resultado
```

---

## 🐛 Troubleshooting

### Problema: Webhook rechazado con HTTP 400

**Causa:** Firma inválida

**Solución:**
1. Verifica que `STRIPE_WEBHOOK_SECRET` es correcto
2. Copia exactamente desde Stripe Dashboard
3. Reinicia backend después de cambiar `.env`

```bash
# Limpiar y reiniciar
$env:STRIPE_WEBHOOK_SECRET = "whsec_test_..."
uvicorn server:app --reload
```

### Problema: Webhook no recibido en localhost

**Causa:** Stripe no puede alcanzar localhost

**Solución:** Usar ngrok para exponer localhost a internet
```bash
ngrok http 8000
# URL: https://abc123.ngrok.io/api/payments/webhook
```

### Problema: "¿Cómo veo los eventos en el dashboard?"

**Respuesta:** Stripe Dashboard → Webhooks → Endpoint → Logs

Ahí ves:
- ✅ Eventos enviados (200 OK)
- ❌ Fallos (400, 500)
- 📜 Payload completo de cada evento
- 🔁 Reintentos automáticos

### Problema: Evento recibido pero BD no actualizada

**Causa posible:** Tabla `visits` no tiene el ID del evento

**Debug:**
```python
# Agregar logging en webhook
logger.info(f"Event metadata: {metadata}")
logger.info(f"Visit found: {visit}")

# Si visit es None, el ID en metadata no existe
```

---

## 📊 Flujo Completo: De Pago a Base de Datos

```
┌─────────────────────────────────────────────────────┐
│ Cliente en App                                       │
│ Click: "Pagar Visita" → Abre Stripe Checkout       │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Stripe Checkout (en navegador)                       │
│ Cliente ingresa tarjeta: 4242 4242 4242 4242        │
│ Click: "Pay" → ✅ Pago procesado                    │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Stripe Servers                                       │
│ payment_intent.succeeded!                            │
│ Buscar metadata: visit_id=507f1f77bcf86cd799439011  │
│ Webhook → POST /api/payments/webhook               │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Tu Backend (FastAPI)                                │
│ Webhook Handler recibe evento                        │
│ Verifica firma Stripe ✓                              │
│ Busca Visit ID en BD                                 │
│ Actualiza: Visit.payment_status = "paid"            │
│ Commit a SQLite ✓                                    │
│ Log: ✅ PAGO COMPLETADO                             │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Base de Datos (SQLite)                              │
│ visits table:                                        │
│ id:              507f1f77bcf86cd799439011            │
│ payment_status:  "paid" ✅ (fue "pending")          │
│ client_id:       10                                 │
│ technician_id:   5                                  │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Checklist de Implementación

- [x] Endpoint creado: `POST /api/payments/webhook`
- [x] Verificación de firma Stripe
- [x] Manejo: `payment_intent.succeeded` → Visit.payment_status = "paid"
- [x] Manejo: `customer.subscription.updated` → User.membership_type actualizado
- [x] Manejo: `customer.subscription.deleted` → User.membership_type = "none"
- [x] Logging en cada evento
- [x] Error handling
- [x] Tests pasando (29/29)

### Checklist de Setup

- [ ] Obtener `STRIPE_WEBHOOK_SECRET` de Stripe Dashboard
- [ ] Agregar a `.env`: `STRIPE_WEBHOOK_SECRET=whsec_test_...`
- [ ] Reiniciar backend
- [ ] Testear con Stripe CLI
- [ ] Verificar logs en Dashboard

---

## 📝 Configuración (.env)

```ini
# Backend
STRIPE_API_KEY=sk_test_xxxxx              # Para crear sesiones de checkout
STRIPE_WEBHOOK_SECRET=whsec_test_abc123   # Para verificar webhooks (NUEVO)
```

---

## 🚀 Próximos Pasos

1. **Webhook Retry Logic** (Opcional)
   - Stripe reintenta automáticamente si falla
   - Tu endpoint debería ser idempotente ✓

2. **Confirmación de Email** (Recomendado)
   - Enviar email al cliente cuando pago se confirme
   - Enviar email al técnico cuando se active membresía

3. **Dashboard de Pagos** (Futuro)
   - Mostrar en admin panel todos los webhooks recibidos
   - Historial de pagos y suscripciones

---

## 📞 API de Webhook

### Endpoint

```
POST /api/payments/webhook
```

### Headers Requeridos

```
Content-Type: application/json
Stripe-Signature: t=timestamp,v1=signature
```

*(headers se envían automáticamente desde Stripe)*

### Body (Ejemplo: Payment Intent Succeeded)

```json
{
  "type": "payment_intent.succeeded",
  "id": "evt_123",
  "created": 1622520000,
  "data": {
    "object": {
      "id": "pi_123",
      "object": "payment_intent",
      "amount": 5500,
      "metadata": {
        "visit_id": "507f1f77bcf86cd799439011",
        "client_id": "10",
        "technician_id": "5"
      }
    }
  }
}
```

### Respuesta

```json
{
  "status": "success"
}
```

---

**Última actualización:** 2026-06-15  
**Estado:** ✅ Implementado y testeado
