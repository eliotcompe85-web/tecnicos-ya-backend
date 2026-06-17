# PRD: Técnicos Ya - Marketplace de Servicios Técnicos

## Visión del Proyecto
"Técnicos Ya" es una aplicación móvil tipo marketplace (similar a Uber pero para servicios) que conecta clientes que necesitan ayuda técnica con especialistas calificados.

## Modelo de Negocio

### Monetización
1. **Banners Publicitarios**: AdMob en pantallas principales
2. **Membresía Básica**: $5,500 CLP/mes (primer mes gratis para nuevos técnicos)
3. **Membresía Premium**: $15,000 CLP/mes
   - Aparece primero en búsquedas
   - Badge premium visible
   - Acceso a estadísticas avanzadas
4. **Comisión por Visita**: 15% de cada servicio

### Sistema de Precios
- **Precio base**: $9,990 CLP (hasta 6km)
- **Precio adicional**: $1,000 CLP por kilómetro adicional
- **Cálculo**: Basado en ubicación GPS del cliente y técnico
- **Pago de comisiones**: Semanalmente a los técnicos (85% del total)
- **Pago de membresías**: Cada 30 días

## Roles de Usuario

### Cliente
**Necesidad**: Solucionar problemas técnicos urgentes
**Funcionalidades**:
- Navegar categorías de servicios
- Buscar técnicos cerca de su ubicación
- Ver perfiles, calificaciones y certificaciones
- Crear solicitudes de servicio
- Confirmar visitas y pagar
- Calificar técnicos

### Técnico
**Necesidad**: Flujo constante de clientes
**Funcionalidades**:
- Ver trabajos disponibles cercanos
- Ver detalles y precio estimado
- Postular a trabajos
- Gestionar perfil profesional
- Subir portafolio y certificaciones
- Sistema de disponibilidad (semáforo)
- Recibir pagos semanalmente

## Sistema de Disponibilidad (Semáforo)
- 🟢 **Verde**: Disponible de inmediato
- 🟡 **Amarillo**: Agendando visitas (acepta agendas futuras)
- ⚫ **Gris**: No disponible

## Flujo Principal

### Para Clientes:
1. Registro/Login
2. Seleccionar categoría de servicio
3. Ver técnicos disponibles con precio estimado
4. Crear solicitud de servicio
5. Recibir postulaciones de técnicos
6. Aceptar un técnico
7. Pagar por la visita
8. Confirmar visita realizada
9. Calificar al técnico

### Para Técnicos:
1. Registro/Login (primer mes gratis)
2. Completar perfil profesional
3. Seleccionar especialidades
4. Ver trabajos disponibles
5. Postular con precio propuesto
6. Cliente acepta postulación
7. Realizar visita
8. Cliente confirma y paga
9. Recibir pago semanal (85%)
10. Ser calificado

## Categorías de Servicio
1. Electricidad
2. Gasfitería
3. Construcción
4. Mecánica
5. Carpintería
6. Pintura
7. Climatización
8. Cerrajería
9. Jardinería
10. Limpieza
11. Maquinaria Pesada
12. Informática

## Sistema de Calificaciones
- Calificaciones bidireccionales (cliente ↔ técnico)
- Escala de 1-5 estrellas
- Comentarios opcionales
- Promedio visible en perfiles

## Reglas de Negocio

### Membresías
- Primer mes gratis para nuevos técnicos
- Si no paga al iniciar el segundo mes: cuenta bloqueada
- Al pagar: desbloqueo automático
- Premium aparece primero en búsquedas

### Pagos
- Cliente paga al confirmar técnico
- Plataforma retiene 15% de comisión
- Técnico recibe 85% semanalmente
- Solo se procesa pago cuando cliente confirma visita realizada

### Geolocalización
- Filtro automático: máximo 50km de distancia
- Cálculo de precio basado en distancia real GPS
- Mostrar distancia en todas las tarjetas de trabajo

## Stack Tecnológico

### Frontend
- React Native con Expo
- Expo Router (file-based routing)
- React Navigation (tabs)
- Axios para API calls
- AsyncStorage para datos locales
- React Hook Form para formularios

### Backend
- FastAPI (Python)
- MongoDB con Motor (async)
- JWT Authentication
- Bcrypt para passwords

### Integraciones Futuras
- Stripe para pagos
- Email notifications
- WhatsApp integration
- AdMob banners

## Estado Actual (Fase 1 Completa)

### ✅ Implementado
1. **Backend Completo**:
   - Todos los modelos de datos
   - Sistema de autenticación con JWT
   - APIs para categorías, técnicos, solicitudes, aplicaciones
   - Cálculo de distancias GPS
   - Cálculo de precios por distancia
   - Sistema de membresías con primer mes gratis

2. **Frontend Base**:
   - Pantalla de bienvenida con selección de rol
   - Registro y login en español
   - Navegación por tabs (diferente para cliente/técnico)
   - Home de cliente con categorías
   - Home de técnico con trabajos disponibles
   - Listado de solicitudes/postulaciones
   - Perfiles básicos

### 🔄 En Progreso
- Crear solicitud de servicio
- Búsqueda de técnicos con geolocalización
- Postular a trabajos
- Sistema de pagos con Stripe

### 📋 Pendiente
- Confirmación de visitas
- Sistema de calificaciones
- Gestión de portafolio
- Notificaciones por email
- Integración WhatsApp
- Banners AdMob
- Pago de comisiones semanales

## Consideraciones Móviles
- Touch targets mínimo 44x44 points
- Pull-to-refresh en listas
- Loading states claros
- Manejo de teclado con KeyboardAvoidingView
- Safe area insets
- Optimización de imágenes

## Métricas de Éxito
- Tiempo promedio para encontrar técnico: < 10 min
- Tasa de conversión solicitud → visita realizada: > 60%
- Satisfacción de usuarios: > 4.0 estrellas
- Retención de técnicos mes a mes: > 70%
