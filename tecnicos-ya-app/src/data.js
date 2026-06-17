export const CATEGORIES = [
  { emoji: '⚡', name: 'Eléctrico', desc: 'Instalaciones y reparaciones' },
  { emoji: '🔧', name: 'Gasfitería', desc: 'Agua, gas y cañerías' },
  { emoji: '🔩', name: 'Mecánico', desc: 'Vehículos y maquinaria' },
  { emoji: '🪵', name: 'Carpintería', desc: 'Muebles y estructuras' },
  { emoji: '🎨', name: 'Pintura', desc: 'Interior y exterior' },
  { emoji: '❄️', name: 'Refrigeración', desc: 'Aire acondicionado' },
  { emoji: '🌿', name: 'Jardinería', desc: 'Áreas verdes' },
  { emoji: '🧹', name: 'Limpieza', desc: 'Aseo profesional' },
  { emoji: '💻', name: 'Tecnología', desc: 'Soporte y reparación' },
  { emoji: '🔑', name: 'Cerrajería', desc: 'Cerraduras y llaves' },
  { emoji: '🚛', name: 'Mudanzas', desc: 'Traslado y transporte' },
  { emoji: '🏗️', name: 'Construcción', desc: 'Obras y remodelaciones' },
]

export const FEATURES = [
  {
    icon: '🛡️',
    color: 'rgba(59,130,246,0.15)',
    title: 'Técnicos Verificados',
    desc: 'Todos nuestros técnicos pasan por un proceso de verificación de identidad, antecedentes y experiencia antes de unirse a la plataforma.',
  },
  {
    icon: '⚡',
    color: 'rgba(245,158,11,0.15)',
    title: 'Respuesta Rápida',
    desc: 'Conectamos tu solicitud con técnicos disponibles en tu área en minutos. Sin esperas largas ni llamadas perdidas.',
  },
  {
    icon: '💳',
    color: 'rgba(16,185,129,0.15)',
    title: 'Pago Seguro',
    desc: 'Todas las transacciones están protegidas con cifrado SSL. Pagas solo cuando el técnico completa el trabajo.',
  },
  {
    icon: '📍',
    color: 'rgba(139,92,246,0.15)',
    title: 'Precio Transparente',
    desc: 'Tarifa base de $9.990 + $1.000 por km adicional sobre 6km. Sin sorpresas ni cobros ocultos.',
  },
  {
    icon: '⭐',
    color: 'rgba(245,158,11,0.15)',
    title: 'Sistema de Calificaciones',
    desc: 'Lee reseñas reales de clientes anteriores antes de contratar. Los técnicos con mejor rating aparecen primero.',
  },
  {
    icon: '🔔',
    color: 'rgba(59,130,246,0.15)',
    title: 'Notificaciones en Tiempo Real',
    desc: 'Recibe alertas cuando un técnico postule, cuando sea aceptado y cuando el trabajo esté completado.',
  },
]

export const TESTIMONIALS = [
  {
    stars: '★★★★★',
    text: '"Llamé a Técnicos Ya por un problema eléctrico y en 30 minutos llegó Carlos. Resolvió todo en 1 hora. Precio justo y trabajo impecable."',
    avatar: '👨‍💼',
    name: 'Roberto Sánchez',
    role: 'Cliente en Santiago',
    bg: 'rgba(59,130,246,0.1)',
  },
  {
    stars: '★★★★★',
    text: '"Como técnico, la plataforma me ayudó a conseguir 15 nuevos clientes en mi primer mes. El plan Premium vale cada peso."',
    avatar: '👷',
    name: 'Jorge Morales',
    role: 'Electricista — Técnico Premium',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    stars: '★★★★★',
    text: '"Tenía una fuga de agua y el gasfiter llegó el mismo día. La app es súper fácil de usar y el pago fue seguro."',
    avatar: '👩‍💼',
    name: 'María González',
    role: 'Cliente en Providencia',
    bg: 'rgba(16,185,129,0.1)',
  },
]

export const CONTACT_INFO = [
  { icon: '⚡', title: 'Respuesta en &lt;30 min', desc: 'Nuestros técnicos verificados responden tu solicitud en minutos, no horas.' },
  { icon: '🛡️', title: 'Técnicos verificados', desc: 'Todos los técnicos pasan por verificación de identidad y antecedentes.' },
  { icon: '💳', title: 'Pago seguro garantizado', desc: 'Tus datos de pago están protegidos. Pagas solo cuando el trabajo esté listo.' },
  { icon: '⭐', title: 'Satisfacción garantizada', desc: '98% de nuestros clientes califica el servicio con 4 o 5 estrellas.' },
]

export const PRICING_PLANS = [
  {
    name: 'Gratuito',
    price: '0',
    period: 'Para siempre',
    isFeatured: false,
    features: [
      { text: 'Acceso a la plataforma', included: true },
      { text: 'Postular a solicitudes', included: true },
      { text: 'Perfil básico', included: true },
      { text: 'Visibilidad aumentada', included: false },
      { text: 'Soporte prioritario', included: false },
      { text: 'Badge verificado', included: false },
    ],
    btnClass: 'btn-secondary',
    btnText: 'Comenzar gratis',
  },
  {
    name: 'Basic',
    price: '5.500',
    period: '1er mes gratis',
    isFeatured: true,
    badge: '⭐ Más popular',
    features: [
      { text: 'Acceso a la plataforma', included: true },
      { text: 'Postular a solicitudes', included: true },
      { text: 'Perfil profesional', included: true },
      { text: 'Visibilidad aumentada', included: true },
      { text: 'Soporte prioritario', included: true },
      { text: 'Badge verificado', included: false },
    ],
    btnClass: 'btn-primary',
    btnText: 'Probar gratis 1 mes',
  },
  {
    name: 'Premium',
    price: '15.000',
    period: '1er mes gratis',
    isFeatured: false,
    features: [
      { text: 'Acceso a la plataforma', included: true },
      { text: 'Postular a solicitudes', included: true },
      { text: 'Perfil destacado', included: true },
      { text: 'Prioridad máxima', included: true },
      { text: 'Soporte 24/7', included: true },
      { text: 'Badge verificado', included: true },
    ],
    btnClass: 'btn-accent',
    btnText: 'Elegir Premium',
  },
]

export const HOW_IT_WORKS = [
  { n: '1', icon: '📝', title: 'Describe tu problema', desc: 'Cuéntanos qué necesitas, en qué categoría y dónde estás. Solo toma 2 minutos.' },
  { n: '2', icon: '👷', title: 'Elige tu técnico', desc: 'Técnicos verificados en tu zona postulan con su precio. Compara reseñas y elige el mejor.' },
  { n: '3', icon: '✅', title: 'Problema resuelto', desc: 'El técnico va a tu casa, realiza el trabajo y pagas de forma segura en la app.' },
]
