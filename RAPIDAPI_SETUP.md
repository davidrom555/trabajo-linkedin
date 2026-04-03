# Configuración Rápida de LinkedIn API (RapidAPI)

## ⚡ Pasos (2 minutos)

### 1. Abre este enlace
👉 **https://rapidapi.com/jaypat87/api/linkedin-jobs-search**

### 2. Suscríbete al plan gratuito
- Haz clic en el botón **"Subscribe to Test"** (naranja)
- Selecciona **"Basic"** - $0.00/month
- Haz clic en **"Subscribe"**

![Ubicación del botón](https://i.imgur.com/placeholder.png)

### 3. Obtén tu API Key
- Ve a: https://rapidapi.com/developer/dashboard
- Haz clic en **"Apps"** en el menú lateral
- Selecciona **"Default Application"**
- Copia el valor de **"Application Key"**

### 4. Actualiza el archivo .env
```bash
# Abre el archivo
notepad server/.env

# Reemplaza la línea de RAPIDAPI_KEY con tu nueva key:
RAPIDAPI_KEY=tu_nueva_api_key_aqui
```

### 5. Reinicia el servidor
```bash
# Mata el servidor actual (Ctrl+C) y reinicia:
npm run server
```

### 6. Verifica que funciona
```bash
curl "http://localhost:3333/api/jobs/search?q=react&sources=linkedin&limit=5"
```

Deberías ver empleos reales de LinkedIn.

---

## 📊 Límites del plan gratuito

| Plan | Requests/mes | Costo |
|------|-------------|-------|
| Basic | 500 | **GRATIS** |
| Pro | 10,000 | $10/mes |
| Ultra | 50,000 | $30/mes |

---

## 🆘 Si tienes problemas

### "You are not subscribed"
→ No completaste el paso 2. Ve a la página y haz clic en "Subscribe".

### "401 Unauthorized"
→ Tu API key es incorrecta. Verifica que copiaste la key completa.

### "429 Too Many Requests"
→ Has excedido los 500 requests/mes. Espera al mes siguiente o actualiza tu plan.

---

## ✅ Verificación visual

Después de configurar, el dashboard mostrará:
```
✓ LinkedIn API: CONFIGURADA (500 req/mes disponibles)
```

Y podrás buscar empleos reales de LinkedIn desde la aplicación.
