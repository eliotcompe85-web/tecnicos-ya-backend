# 🔧 Guía de Troubleshooting

Soluciones rápidas para problemas comunes en Técnicos Ya.

## 🚨 Problemas Backend

### "ModuleNotFoundError: No module named 'fastapi'"

**Causa:** Dependencias no instaladas o entorno virtual incorrecto

**Solución:**
```bash
cd tecnicos-ya-backend/backend
pip install -r requirements.txt
```

### "Address already in use" en puerto 8000

**Causa:** Ya hay un proceso usando el puerto 8000

**Solución:**
```bash
# Windows - Encontrar proceso
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>

# O usar puerto diferente
uvicorn server:app --port 8001
```

### "database is locked" en tests

**Causa:** BD SQLite siendo accedida por múltiples procesos

**Solución:**
```bash
# Limpiar base de datos de test
rm -f test.db

# Ejecutar tests en secuencia (no paralelo)
pytest tests/test_api.py -v --tb=short
```

### "JWT token expired" en cliente

**Causa:** Token vencido (válido 24 horas)

**Solución:**
```bash
# Limpiar storage del dispositivo
# En React Native:
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();

# Volver a hacer login
```

### Tests fallan con "AttributeError"

**Causa:** Cambios en modelos sin migración

**Solución:**
```bash
# Eliminar BD vieja
rm tecnicos_ya.db

# Los modelos se recrearán automáticamente en primer inicio
uvicorn server:app --reload
```

### "CORS error" desde frontend

**Causa:** Frontend en puerto diferente sin CORS configurado

**Solución:** En `server.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar en producción a dominio específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🚨 Problemas Frontend

### "Cannot find module '@expo/vector-icons'"

**Causa:** Dependencias incompletas

**Solución:**
```bash
cd frontend
npm install
npx expo install @expo/vector-icons
```

### "TypeError: Cannot read property 'token' of undefined"

**Causa:** AuthContext no está disponible

**Solución:**
```typescript
// Verificar que AuthProvider envuelve la app
// En app/_layout.tsx:
<AuthProvider>
  <Stack>
    {/* rutas */}
  </Stack>
</AuthProvider>
```

### "Network request failed" en emulador

**Causa:** Emulador no puede alcanzar localhost

**Solución:**
```typescript
// En frontend/src/services/api.ts
// Cambiar de localhost a tu IP local
const API_BASE_URL = 'http://192.168.1.100:8000/api';  // Reemplazar con tu IP

// O en Android:
const API_BASE_URL = 'http://10.0.2.2:8000/api';  // Android emulator special IP
```

### "Permission denied" para geolocalización

**Causa:** Permisos no otorgados

**Solución:**
```bash
# En app.json, agregar:
{
  "plugins": [
    [
      "expo-location",
      {
        "locationAlwaysAndWhenInUsePermissions": "allow"
      }
    ]
  ]
}

# Luego:
npx expo prebuild --clean
```

### Expo Metro bundler muy lento

**Causa:** Caché corrupta

**Solución:**
```bash
npm start -- --clear
```

### "Module not found" después de instalar paquete

**Causa:** Metro bundler no refresca

**Solución:**
```bash
npm start -- --reset-cache
```

---

## 🚨 Problemas de Integración

### Frontend no se conecta al backend

**Checklist:**
1. ✅ Backend corriendo: `http://localhost:8000`
2. ✅ API_BASE_URL correcta en `frontend/src/services/api.ts`
3. ✅ Token siendo enviado en headers
4. ✅ CORS habilitado en backend
5. ✅ Firewall permitiendo puerto 8000

**Test rápido:**
```bash
# Desde browser
curl -H "Authorization: Bearer tu_token" \
  http://localhost:8000/api/auth/me
```

### Datos no persisten en BD

**Causa:** Cambios no se comitean (`db.commit()`)

**Solución en server.py:**
```python
db.add(new_object)
db.commit()  # IMPORTANTE: No olvidar
db.refresh(new_object)
return new_object
```

### Imagenes no cargan en frontend

**Causa:** Path incorrecto o archivo no existe

**Solución:**
```typescript
// Usar require para assets estáticas
import { Image } from 'react-native';

<Image
  source={require('../assets/images/logo.png')}
  style={{ width: 100, height: 100 }}
/>
```

---

## 🔍 Debugging Avanzado

### Ver requests HTTP en tiempo real

**Backend:**
```bash
# Habilitar logging
export PYTHONUNBUFFERED=1
uvicorn server:app --reload --log-level debug
```

**Frontend:**
```typescript
// En api.ts
apiClient.interceptors.request.use((config) => {
  console.log('📤 REQUEST:', config.method.toUpperCase(), config.url, config.data);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('📥 RESPONSE:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ ERROR:', error.response?.data || error.message);
    throw error;
  }
);
```

### Inspeccionar BD SQLite

```bash
# Instalar sqlite3 CLI
# Windows: https://www.sqlite.org/download.html
# Mac: brew install sqlite3
# Linux: apt install sqlite3

# Conectar
sqlite3 tecnicos_ya.db

# Ver tablas
.tables

# Consultar
SELECT * FROM users;

# Salir
.quit
```

### Debug de tokens JWT

```python
# En Python REPL
from jose import jwt
import os

token = "eyJhbGc..."  # Tu token
secret = os.getenv("JWT_SECRET")

try:
    payload = jwt.decode(token, secret, algorithms=["HS256"])
    print(payload)
except Exception as e:
    print(f"Token inválido: {e}")
```

### Profiling de performance

```python
# En server.py
from time import perf_counter

@app.get("/api/technicians/search")
def search_technicians(...):
    start = perf_counter()
    
    # Tu código aquí
    results = db.query(TechnicianProfile).all()
    
    elapsed = perf_counter() - start
    print(f"⏱️ Query took {elapsed:.3f}s")
    
    return results
```

---

## 📞 Checklist Final de Debugging

Cuando algo no funcione, verifica:

- [ ] ¿Está corriendo el servidor backend? (`uvicorn server:app --reload`)
- [ ] ¿Está el frontend conectado? (verificar API_BASE_URL)
- [ ] ¿Hay token válido? (console.log del token en AuthContext)
- [ ] ¿Responde el backend? (`curl http://localhost:8000/docs`)
- [ ] ¿Hay errores en la terminal? (revisar stdout/stderr)
- [ ] ¿Está actualized el código? (guardar y reload si necesario)
- [ ] ¿Cambiaste requirements.txt? (reinstalar: `pip install -r requirements.txt`)
- [ ] ¿Agregaste paquete npm? (reinstalar: `npm install`)

---

## 📚 Recursos Útiles

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [Pydantic Docs](https://docs.pydantic.dev/)

---

**Última actualización:** 2026-06-15  
**¿No encontraste tu problema?** Abre issue en GitHub o contacta soporte.
