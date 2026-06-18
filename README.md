# 🛠️ Técnicos Ya - Marketplace de Servicios Técnicos

Técnicos Ya es una plataforma profesional que conecta a clientes con especialistas técnicos (electricistas, gasfiteros, mecánicos, etc.) mediante un sistema de marketplace bidireccional.

## 🚀 Características Principales

### 👤 Para Clientes
- **Búsqueda Inteligente**: Localización de técnicos cercanos mediante GPS y filtros por categoría.
- **Gestión de Solicitudes**: Publicación de trabajos con descripción, presupuesto y ubicación exacta.
- **Flujo de Contratación**: Revisión de postulaciones de técnicos, comparación de precios y aceptación.
- **Sistema de Calificaciones**: Reseñas y puntuaciones para garantizar la calidad del servicio.
- **Membresía Premium**: Acceso prioritario y beneficios exclusivos vía Stripe.

### 🛠️ Para Técnicos
- **Perfil Profesional**: Gestión de especialidades, años de experiencia y estado de disponibilidad.
- **Panel de Trabajo**: Acceso a solicitudes abiertas en su zona geográfica.
- **Sistema de Postulación**: Propuesta de precios y mensajes personalizados para los clientes.
- **Gestión de Visitas**: Confirmación de servicios y cierre de trabajos.

### ⚙️ Administración
- **Panel de Control**: Estadísticas globales de usuarios, ingresos y actividad.
- **Moderación**: Gestión de categorías y supervisión de la plataforma.

## 🛠️ Stack Tecnológico

- **Frontend Web**: React + Vite + Tailwind CSS + React Router.
- **Mobile App**: Expo (React Native) + EAS Build.
- **Backend**: FastAPI (Python) + SQLAlchemy.
- **Base de Datos**: SQLite (Desarrollo) / PostgreSQL (Producción).
- **Autenticación**: JWT + Google OAuth 2.0.
- **Pagos**: Stripe API.

## 📦 Guía de Despliegue

### Backend
1. Instalar dependencias: `pip install -r requirements.txt`
2. Configurar `.env` con `SECRET_KEY`, `DATABASE_URL` y credenciales de Google/Stripe.
3. Ejecutar: `uvicorn server:app --reload`

### Frontend Web
1. Instalar dependencias: `npm install`
2. Ejecutar: `npm run dev`

### App Móvil (EAS)
1. Ejecutar build de producción: `eas build --platform android --profile production`
2. Descargar APK desde el dashboard de [expo.dev](https://expo.dev).

---
*Proyecto completado y optimizado para entorno de producción.*
