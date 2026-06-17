# 🚀 Guía de Deployment y Producción

Pasos para llevar Técnicos Ya a producción de forma segura.

## 📋 Pre-Deploy Checklist

### Código
- [ ] Todos los tests pasan: `pytest tests/test_api.py -v`
- [ ] No hay errores en linter
- [ ] No hay console.log ni print() innecesarios en código
- [ ] No hay credenciales hardcodeadas
- [ ] No hay comentarios con TODOs pendientes

### Configuración
- [ ] `.env` configurado con valores reales
- [ ] `JWT_SECRET` es una cadena aleatoria fuerte (32+ caracteres)
- [ ] `STRIPE_API_KEY` es clave real (no test)
- [ ] `DATABASE_URL` apunta a BD de producción
- [ ] Logs están configurados apropiadamente
- [ ] CORS solo permite dominio real (no "*")

### Seguridad
- [ ] Contraseñas se hashean con bcrypt
- [ ] Tokens JWT tienen expiración
- [ ] HTTPS está habilitado
- [ ] Headers de seguridad configurados
- [ ] Rate limiting implementado (opcional)
- [ ] CORS restrictivo

### Frontend
- [ ] API_BASE_URL apunta a backend de producción
- [ ] No hay logs de debug en producción
- [ ] Assets optimizados (imágenes comprimidas)
- [ ] Build está minificado

### Base de Datos
- [ ] Backup reciente realizado
- [ ] Índices creados en columnas búsquedas frecuentes
- [ ] Datos sensibles están encriptados
- [ ] Plan de backup automatizado

---

## 🔧 Setup de Producción

### 1. Servidor Backend (Linux/AWS/DigitalOcean)

#### Opción A: Manual en VPS

```bash
# 1. Conectar al servidor
ssh root@tu_servidor_ip

# 2. Instalar dependencias del sistema
apt update && apt upgrade -y
apt install python3.10 python3-pip supervisor nginx -y

# 3. Crear usuario sin privilegios
useradd -m -s /bin/bash tecnicosya
su - tecnicosya

# 4. Clonar repositorio
git clone https://github.com/tu_usuario/tecnicosya.git
cd tecnicosya/tecnicos-ya-backend/backend

# 5. Setup virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 6. Configurar variables de entorno
nano .env
# Llenar valores reales

# 7. Probar servidor
uvicorn server:app --host 0.0.0.0 --port 8000
```

#### Opción B: Usar Docker (Recomendado)

```dockerfile
# Crear archivo Dockerfile en backend/

FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

Construir y correr:
```bash
docker build -t tecnicosya-backend .
docker run -e DATABASE_URL=postgresql://... \
           -e JWT_SECRET=... \
           -e STRIPE_API_KEY=... \
           -p 8000:8000 \
           tecnicosya-backend
```

#### Opción C: Platform as a Service (Más fácil)

**Heroku:**
```bash
# 1. Instalar Heroku CLI
# 2. Crear app: heroku create tecnicosya-api
# 3. Agregar archivo Procfile:
web: uvicorn server:app --host 0.0.0.0 --port $PORT

# 4. Configurar variables de entorno
heroku config:set JWT_SECRET=xxx
heroku config:set STRIPE_API_KEY=xxx
heroku config:set DATABASE_URL=postgresql://...

# 5. Deploy
git push heroku main
```

**Railway.app:**
```
1. Conectar repositorio GitHub
2. Agregar variables de entorno en dashboard
3. Deploy automático en cada push
```

**Render:**
```
Similar a Railway pero con UI más simple
```

---

### 2. Configurar Nginx (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/tecnicosya

upstream tecnicosya_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.tecnicosya.com;
    
    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.tecnicosya.com;
    
    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.tecnicosya.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tecnicosya.com/privkey.pem;
    
    # Seguridad
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://tecnicosya_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Habilitar:
```bash
ln -s /etc/nginx/sites-available/tecnicosya /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

Obtener certificado SSL:
```bash
apt install certbot python3-certbot-nginx -y
certbot certonly --nginx -d api.tecnicosya.com
```

---

### 3. Configurar Supervisor (Para que uvicorn se mantenga activo)

```ini
# /etc/supervisor/conf.d/tecnicosya.conf

[program:tecnicosya]
directory=/home/tecnicosya/tecnicosya/tecnicos-ya-backend/backend
command=/home/tecnicosya/tecnicosya/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000 --workers 4
user=tecnicosya
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/tecnicosya.log
```

Activar:
```bash
supervisorctl reread
supervisorctl update
supervisorctl start tecnicosya
```

---

### 4. Base de Datos en Producción

#### Cambiar de SQLite a PostgreSQL

1. Instalar PostgreSQL:
```bash
apt install postgresql postgresql-contrib -y
sudo -u postgres psql
```

2. Crear base de datos:
```sql
CREATE DATABASE tecnicosya_prod;
CREATE USER tecnicosya WITH PASSWORD 'contraseña_fuerte_aqui';
ALTER ROLE tecnicosya SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE tecnicosya_prod TO tecnicosya;
\q
```

3. Cambiar DATABASE_URL:
```env
DATABASE_URL=postgresql://tecnicosya:contraseña_fuerte_aqui@localhost/tecnicosya_prod
```

4. Instalar driver:
```bash
pip install psycopg2-binary
```

---

### 5. Frontend en Producción

#### Build para Web

```bash
cd frontend
npm run build  # O expo export --platform web
# Genera carpeta 'build' o 'dist'
```

#### Deploy a Vercel (Recomendado para web)

```bash
npm install -g vercel
vercel --prod
```

#### Deploy a Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

#### Deploy App Nativa (iOS/Android)

```bash
# Usando EAS Build (Servicio de Expo)
npm install -g eas-cli
eas login
eas build --platform all
# Genera builds para enviar a App Store y Google Play
```

---

## 🔒 Checklist de Seguridad

### Backend
- [ ] CORS solo acepta dominios conocidos
- [ ] Headers de seguridad configurados:
  ```python
  app.add_middleware(
      TrustedHostMiddleware, 
      allowed_hosts=["tecnicosya.com", "www.tecnicosya.com"]
  )
  ```
- [ ] Rate limiting en auth endpoints
- [ ] Logs de acceso guardados
- [ ] Errores no exponen detalles internos
- [ ] JWT solo usa HTTPS en producción

### Base de Datos
- [ ] Backups diarios automatizados
- [ ] Datos sensibles encriptados (contraseñas, tokens)
- [ ] Solo técnico accede a BD directamente
- [ ] Connection strings no en código

### Infraestructura
- [ ] HTTPS habilitado
- [ ] Firewall solo abre puertos necesarios
- [ ] SSH usa key-based auth (sin password)
- [ ] Todos los sistemas actualizados

---

## 📊 Monitoreo en Producción

### Logs

```bash
# Ver logs en tiempo real
tail -f /var/log/tecnicosya.log

# Con timestamp
tail -f /var/log/tecnicosya.log | grep -E '\[.*\]'

# Errores solamente
grep "ERROR" /var/log/tecnicosya.log
```

### Métricas

```python
# En server.py agregar prometheus
from prometheus_client import Counter, Histogram
import time

REQUEST_COUNT = Counter('requests_total', 'Total requests')
REQUEST_DURATION = Histogram('request_duration_seconds', 'Request duration')

@app.middleware("http")
async def track_metrics(request: Request, call_next):
    REQUEST_COUNT.inc()
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    REQUEST_DURATION.observe(duration)
    return response
```

### Uptime Monitoring

Usar servicios como:
- [Datadog](https://www.datadoghq.com/)
- [New Relic](https://newrelic.com/)
- [Sentry](https://sentry.io/) (para errores)
- [StatusPage.io](https://www.statuspage.io/) (status público)

---

## 💰 Costos Estimados (AWS/GCP/Azure)

| Componente | Costo Mensual |
|-----------|--------------|
| VPS Backend (t3.micro) | $10-15 |
| Database (RDS micro) | $10-15 |
| Frontend hosting (Vercel) | $0-20 |
| SSL Certificate (Let's Encrypt) | $0 |
| **TOTAL** | **~$20-50/mes** |

---

## 🔄 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - run: |
          cd tecnicos-ya-backend/backend
          pip install -r requirements.txt
          pytest tests/test_api.py

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: |
          # Deploy a servidor
          ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} \
            'cd tecnicosya && git pull && systemctl restart tecnicosya'
```

---

## 📈 Scaling (Cuando crezca)

### Problemas y Soluciones

| Problema | Solución |
|----------|----------|
| BD lenta | Agregar índices, caché (Redis) |
| API lenta | Aumentar workers uvicorn, load balancing |
| Muchas desconexiones | DB connection pooling |
| Almacenamiento imágenes | S3/CloudStorage |

---

## 📞 Post-Deploy Checklist

- [ ] ¿Responde API en dominio real?
- [ ] ¿Funciona login?
- [ ] ¿Cargan datos desde BD real?
- [ ] ¿Se ven los logs?
- [ ] ¿Frontend conecta a backend?
- [ ] ¿Funciona geolocalización?
- [ ] ¿Stripe es modo producción?
- [ ] ¿Certificado SSL válido?
- [ ] ¿Backups automatizados?
- [ ] ¿Monitoreo activo?

---

**Última actualización:** 2026-06-15  
**Tiempo estimado setup:** 2-3 horas  
**Dificultad:** Media-Alta
