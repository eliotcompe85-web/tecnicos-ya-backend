# 📱 Guía Completa del Frontend

## Descripción General

El frontend de Técnicos Ya es una aplicación móvil cross-platform construida con:
- **Expo Router** - Navegación app-based
- **React Native** - UI components nativo
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **Context API** - State management

Soporta iOS, Android y Web.

## 📁 Estructura del Proyecto

```
frontend/
├── app/                        # Rutas y pantallas (Expo Router)
│   ├── _layout.tsx            # Layout raíz
│   ├── +html.tsx              # HTML para web
│   ├── index.tsx              # Splash screen
│   ├── welcome.tsx            # Welcome screen
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (client)/               # Rutas protegidas cliente
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── profile.tsx
│   │   └── requests.tsx
│   ├── client/
│   │   ├── new-request.tsx
│   │   ├── search-technicians.tsx
│   │   ├── request-detail/[id].tsx
│   │   └── technician-detail/[id].tsx
│   ├── (technician)/          # Rutas protegidas técnico
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── applications.tsx
│   │   ├── profile.tsx
│   ├── technician/
│   │   ├── membership.tsx
│   │   └── job-detail/[id].tsx
│   └── review/
│       └── [visitId].tsx
├── src/
│   ├── components/            # Componentes reutilizables
│   │   ├── AvailabilityStatus.tsx
│   │   └── AdBanner.tsx
│   ├── services/              # API wrappers
│   │   └── api.ts
│   ├── context/               # State management
│   │   └── AuthContext.tsx
│   ├── hooks/                 # Custom hooks
│   │   └── use-icon-fonts.ts
│   ├── constants/             # Constantes
│   │   ├── colors.ts
│   │   └── testIds/
│   └── utils/                 # Utilidades
│       └── storage/
│           ├── index.ts
│           ├── index.web.ts
│           └── storage-base.ts
├── assets/                    # Images, fonts
│   ├── fonts/
│   └── images/
├── app.json                   # Configuración Expo
├── package.json               # Dependencias
├── tsconfig.json              # Configuración TypeScript
├── metro.config.js            # Configuración Metro bundler
└── README.md
```

## 🚀 Instalación y Setup

### 1. Instalar Dependencias

```bash
cd frontend
npm install
```

### 2. Instalar Expo CLI Globalmente

```bash
npm install -g expo-cli
# o
npx expo@latest
```

### 3. Iniciar Servidor de Desarrollo

```bash
npm start
```

Verás un menú de opciones:
```
Press 'a' for Android
Press 'i' for iOS (requiere Mac)
Press 'w' for web
Press 'r' to restart metro bundler
Press 'q' to quit
```

### 4. Conectar Dispositivo

**Para Android:**
```bash
# Instalar expo app en teléfono
# Escanear código QR que muestra `npm start`
```

**Para iOS:**
```bash
# Requiere Mac con Xcode
npm start
# Presiona 'i'
# Se abre simulador automáticamente
```

**Para Web:**
```bash
npm start
# Presiona 'w'
# Abre en navegador en http://localhost:19006
```

## 📚 Dependencias Principales

```json
{
  "expo": "^50.0.0",
  "expo-router": "^2.0.0",
  "react": "18.2.0",
  "react-native": "0.73.0",
  "typescript": "^5.3.3",
  "axios": "^1.6.0",
  "@react-native-async-storage/async-storage": "^1.21.0",
  "date-fns": "^2.30.0",
  "@expo/vector-icons": "^13.0.0"
}
```

## 🔐 Autenticación

### AuthContext

Maneja estado de autenticación global:

```typescript
// src/context/AuthContext.tsx
interface AuthContextType {
  token: string | null;
  user: UserData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Uso en componentes
const { token, user, logout } = useAuth();
```

### Flujo de Autenticación

```
1. Usuario abre app
   ↓
2. AuthContext carga token del storage
   ↓
3. Si hay token → Redirige a home
4. Si NO hay token → Muestra auth screens
   ↓
5. Usuario completa login/register
   ↓
6. Token se guarda en AsyncStorage
   ↓
7. Axios automáticamente incluye token en headers
```

### Proteger Rutas

```typescript
// En _layout.tsx (layout raíz)
const RootLayout = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Stack>
      {!token ? (
        // Stack de autenticación
        <Stack.Screen
          name="auth"
          options={{ headerShown: false }}
        />
      ) : (
        // Stack de app
        <Stack.Screen
          name="(client)"
          options={{ headerShown: false }}
        />
      )}
    </Stack>
  );
};
```

## 🌐 API Client (Axios)

### Configuración

```typescript
// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para agregar token
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Servicios API

```typescript
// Auth Service
export const authService = {
  register: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },
  
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// Technician Service
export const technicianService = {
  search: async (params: SearchParams) => {
    const response = await apiClient.get('/technicians/search', {
      params,
    });
    return response.data;
  },
  
  getProfile: async (userId: number) => {
    const response = await apiClient.get(`/technicians/profile/${userId}`);
    return response.data;
  },
  
  updateProfile: async (data: ProfileUpdateData) => {
    const response = await apiClient.put('/technicians/profile', data);
    return response.data;
  },
};

// ... más servicios
```

### Manejo de Errores

```typescript
try {
  await authService.login(email, password);
} catch (error: any) {
  const message = error.response?.data?.detail || 'Error desconocido';
  Alert.alert('Error', message);
}
```

## 🎨 Temas y Colores

### Sistema de Colores

```typescript
// src/constants/colors.ts
export const Colors = {
  primary: '#3B82F6',      // Azul
  accent: '#F59E0B',       // Naranja
  success: '#10B981',      // Verde
  danger: '#EF4444',       // Rojo
  warning: '#FBBF24',      // Amarillo
  
  background: '#F9FAFB',
  surface: '#FFFFFF',
  
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  
  disabled: '#D1D5DB',
};
```

### Uso en Componentes

```typescript
<View style={{ backgroundColor: Colors.background }}>
  <Text style={{ color: Colors.text }}>Hola</Text>
  <TouchableOpacity
    style={{
      backgroundColor: Colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
    }}
  >
    <Text style={{ color: Colors.surface }}>Presiona</Text>
  </TouchableOpacity>
</View>
```

## 📱 Pantallas Principales

### 1. Login (`auth/login.tsx`)
- Email + Password inputs
- Validación en cliente
- Llamada a `authService.login()`
- Guarda token automáticamente

### 2. Register (`auth/register.tsx`)
- Formulario con email, password, full_name, phone, role
- Selector de rol (cliente/técnico)
- Validación de contraseña
- Llamada a `authService.register()`

### 3. Cliente - Home (`(client)/home.tsx`)
- Lista de solicitudes abiertas
- Filtro por estado
- Muestra: title, description, technician_count, created_at
- Pull-to-refresh

### 4. Cliente - Crear Solicitud (`client/new-request.tsx`)
- Selector de categoría
- Inputs: title, description, budget_min, budget_max
- Geolocalización automática
- Reverse geocoding para dirección
- Mapa preview (opcional)

### 5. Cliente - Buscar Técnicos (`client/search-technicians.tsx`)
- Selector de categoría
- Mapa interactivo
- Filtros: distancia, disponibilidad
- Lista de técnicos con:
  - Avatar
  - Nombre
  - Rating promedio
  - Distancia
  - Disponibilidad (badge)
  - Precio estimado

### 6. Técnico - Home (`(technician)/home.tsx`)
- Lista de trabajos disponibles
- Filtrados automáticamente por disponibilidad
- Tarjeta de trabajo muestra:
  - Título y descripción
  - Cliente name
  - Categoría
  - Ubicación/distancia
  - Precio estimado
  - Botón "Ver detalles" y "Postular"
- Pull-to-refresh

### 7. Técnico - Detalles Trabajo (`technician/job-detail/[id].tsx`)
- Información completa de solicitud
- Perfil del cliente con opción de WhatsApp
- Formulario de postulación:
  - Message textarea
  - Proposed price input
  - Botón submit

### 8. Técnico - Membresía (`technician/membership.tsx`)
- Tarjetas de planes (Basic/Premium)
- Botón "Suscribirse" que abre Stripe checkout
- Descripción de beneficios

### 9. Reseña (`review/[visitId].tsx`)
- Selector de estrellas (1-5)
- Textarea para comentario
- Botón submit
- Mensaje de confirmación

## 🔄 Estado y Context

### Usar AuthContext

```typescript
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { token, user, login, logout } = useAuth();
  
  if (!token) {
    return <Text>No autenticado</Text>;
  }
  
  return (
    <View>
      <Text>Bienvenido {user?.full_name}</Text>
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  );
};
```

### Hook Custom

```typescript
// src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
```

## 🗺️ Navegación (Expo Router)

### Estructura de Carpetas = Rutas

```
app/
├── (auth)/          → /login, /register
├── (client)/        → /home, /requests
├── client/          → /new-request, /search-technicians
└── review/          → /review/:visitId
```

### Navegar entre Pantallas

```typescript
import { useRouter } from 'expo-router';

const MyComponent = () => {
  const router = useRouter();
  
  return (
    <Button
      title="Ir a detalles"
      onPress={() => router.push(`/request-detail/${id}`)}
    />
  );
};
```

### Parámetros Dinámicos

```typescript
// En app/request-detail/[id].tsx
import { useLocalSearchParams } from 'expo-router';

const RequestDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  useEffect(() => {
    loadRequest(parseInt(id!));
  }, [id]);
  
  return <View>{/* ... */}</View>;
};
```

## 💾 Almacenamiento Local

### AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Guardar
await AsyncStorage.setItem('auth_token', token);

// Obtener
const token = await AsyncStorage.getItem('auth_token');

// Eliminar
await AsyncStorage.removeItem('auth_token');

// Limpiar todo
await AsyncStorage.clear();
```

### Custom Hook

```typescript
// src/utils/storage/index.ts
export const storage = {
  setToken: (token: string) =>
    AsyncStorage.setItem('auth_token', token),
  
  getToken: () =>
    AsyncStorage.getItem('auth_token'),
  
  removeToken: () =>
    AsyncStorage.removeItem('auth_token'),
};
```

## 🧪 Testing

### Ejecutar Tests

```bash
npm test
```

### Ejemplo Test Component

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../app/auth/login';

describe('LoginScreen', () => {
  it('debería renderizar campos de entrada', () => {
    render(<LoginScreen />);
    
    expect(screen.getByPlaceholderText(/email/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeTruthy();
  });
  
  it('debería validar email requerido', () => {
    render(<LoginScreen />);
    
    const button = screen.getByText(/iniciar sesión/i);
    fireEvent.press(button);
    
    expect(screen.getByText(/email requerido/i)).toBeTruthy();
  });
});
```

## 📍 Geolocalización

### Usar expo-location

```bash
npx expo install expo-location
```

### Código

```typescript
import * as Location from 'expo-location';

const getLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status === 'granted') {
    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }
};
```

## 🎥 Iconos

### Usar @expo/vector-icons

```typescript
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

<Ionicons name="home" size={24} color="blue" />
<MaterialIcons name="email" size={24} color="black" />
```

[Galería de iconos](https://icons.expo.fyi/)

## 🔍 Debugging

### React Native Debugger

```bash
# Instalar
npm install -g react-native-debugger

# Abrir
react-native-debugger
```

### Logs en Consola

```typescript
console.log('Debug:', data);
console.error('Error:', error);
console.warn('Advertencia:', warning);
```

### En Expo

```bash
npm start

# En menú:
# - Presiona 'j' para abrir debugger
# - Presiona 'o' para abrir iOS simulator
# - Presiona 'a' para abrir Android simulator
```

## 📦 Build para Producción

### iOS

```bash
eas build --platform ios --auto-submit
```

### Android

```bash
eas build --platform android --auto-submit
```

### Web

```bash
expo export --platform web
# Generar en ./dist/ - hospedar en Vercel, Netlify, etc.
```

## ✅ Checklist de Deploy

- [ ] Cambiar API_BASE_URL a URL de producción del backend
- [ ] Configurar variables de entorno (app.json)
- [ ] Revisar permisos en app.json (location, camera, etc.)
- [ ] Ejecutar `npm test` (todos pasen)
- [ ] Verificar formularios con datos reales
- [ ] Testar geolocalización en dispositivo real
- [ ] Probar pagos (Stripe) en modo test
- [ ] Revisar performance en dispositivo lento
- [ ] Configurar push notifications
- [ ] Crear política de privacidad

---

**Última actualización:** 2026-06-15  
**Estado:** ✅ Listo para producción
