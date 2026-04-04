# Guía de Despliegue a Producción

## 🔴 Problema: La búsqueda de trabajos no funciona en producción

### Causa Raíz
En desarrollo (`ng serve`), el proxy de Angular redirige `/api` a `http://localhost:3333`. 
En producción, este proxy **no existe**, por lo que las llamadas a `/api` fallan.

---

## ✅ Soluciones

### Opción 1: Mismo dominio (Recomendada)
Sirve el frontend y backend desde el mismo dominio:

```
https://tu-dominio.com/     →  Angular app (dist/)
https://tu-dominio.com/api/  →  Node.js server (proxy reverso)
```

**Configuración con Nginx:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend Angular
    location / {
        root /var/www/html/dist/browser;
        try_files $uri $uri/ /index.html;
    }

    # Backend API - proxy reverso
    location /api/ {
        proxy_pass http://localhost:3333/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**En este caso:**
- `environment.prod.ts` → `apiBaseUrl: '/api'` (sin cambios necesarios)

---

### Opción 2: Dominios separados
Frontend y backend en diferentes dominios/URLs:

```
https://app.tu-dominio.com    →  Angular app
https://api.tu-dominio.com    →  Node.js server
```

**Configuración:**
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.tu-dominio.com/api',
};
```

**Y actualiza CORS en server/index.js:**
```javascript
const ALLOWED_ORIGINS = [
  'http://localhost:4200',
  'https://app.tu-dominio.com',  // tu dominio de producción
];
```

---

### Opción 3: Serverless (Vercel, Netlify Functions)
Si despliegas en Vercel/Netlify con funciones serverless:

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiBaseUrl: '/api',  // Las funciones serverless usan el mismo dominio
};
```

Necesitas mover la lógica del servidor a:
- **Vercel:** `api/jobs/search.js` (Serverless Functions)
- **Netlify:** `netlify/functions/jobs-search.js` (Netlify Functions)

---

## 🚀 Pasos para desplegar

### 1. Construir el frontend
```bash
npm run build
```

### 2. Verificar la configuración
- Revisa `src/environments/environment.prod.ts`
- Asegúrate que `apiBaseUrl` apunte a tu backend

### 3. Desplegar backend
```bash
# Ejemplo con PM2
pm2 start server/index.js --name "smartjob-api"
```

### 4. Desplegar frontend
Copia `dist/browser/` a tu servidor web (Nginx, Apache, etc.)

---

## 🧪 Verificación post-despliegue

1. Abre la consola del navegador (F12)
2. Intenta buscar trabajos
3. Verifica que las llamadas a `/api/jobs/search` respondan 200 OK
4. Si ves errores 404 o CORS, revisa la configuración

---

## ⚠️ Notas importantes

1. **Variables de entorno:** El archivo `server/.env` debe estar en el servidor de producción
2. **API Keys:** Las keys de RapidAPI y Gemini deben ser válidas
3. **HTTPS:** En producción, usa HTTPS para evitar problemas de mixed content
