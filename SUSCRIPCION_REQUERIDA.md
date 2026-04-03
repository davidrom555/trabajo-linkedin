# ⚠️ Suscripción Requerida en RapidAPI

Tu API key está configurada, pero **NO tienes suscripción activa** al endpoint de LinkedIn Jobs.

---

## 🔴 Estado Actual

```
API Key: a0aebd8c3fmsh445df06fde0a6fep172687jsnff9589be4690
Estado: Activa pero SIN suscripción a LinkedIn API
Error: 403 - "You are not subscribed to this API"
```

---

## ✅ Solución (1 minuto)

### Paso 1: Ve a la página de la API
👉 **Haz clic aquí:** https://rapidapi.com/jaypat87/api/linkedin-jobs-search

### Paso 2: Suscríbete al plan gratuito
1. Busca el botón **naranja** que dice: **"Subscribe to Test"**
2. Haz clic en él
3. Selecciona el plan **"Basic"** (el que dice $0.00)
4. Haz clic en **"Subscribe"**

![Ejemplo del botón](https://i.imgur.com/example.png)

### Paso 3: Verifica que funciona
Una vez suscrito, ejecuta este comando:

```bash
curl "http://localhost:3333/api/jobs/linkedin-test"
```

Deberías ver:
```json
{
  "status": "success",
  "message": "✓ LinkedIn API configurada correctamente",
  "jobsFound": 10
}
```

---

## 🖼️ Capturas de pantalla de referencia

### Dónde encontrar el botón "Subscribe":
```
┌─────────────────────────────────────────────────┐
│  LinkedIn Jobs Search API                        │
│                                                  │
│  [Pricing] [Endpoints] [Discussions]             │
│                                                  │
│  ┌─────────────────────────────────────┐        │
│  │  🟠 Subscribe to Test               │        │
│  │     Basic: $0.00/month              │        │
│  │     500 requests/month              │        │
│  └─────────────────────────────────────┘        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Después de suscribirte:
```
┌─────────────────────────────────────────────────┐
│  ✓ Subscribed to Basic Plan                     │
│                                                  │
│  Your subscription is active!                    │
│  500 requests remaining this month               │
└─────────────────────────────────────────────────┘
```

---

## ⚡ Comando para probar inmediatamente

Después de suscribirte, prueba con:

```bash
# Test rápido
curl "http://localhost:3333/api/jobs/search?q=javascript&location=Spain&sources=linkedin&limit=5"

# O busca cualquier término
curl "http://localhost:3333/api/jobs/search?q=react&sources=linkedin"
curl "http://localhost:3333/api/jobs/search?q=python&location=Madrid&sources=linkedin"
```

---

## ❓ Preguntas frecuentes

### ¿Por qué necesito suscribirme si ya tengo API key?
En RapidAPI necesitas:
1. **API Key** = Identidad (quién eres)
2. **Suscripción** = Permiso (a qué APIs puedes acceder)

### ¿Es realmente gratis?
Sí, el plan "Basic" es 100% gratuito. No pide tarjeta de crédito.

### ¿Qué pasa si excedo los 500 requests?
El sistema automáticamente usa Adzuna y otras fuentes como fallback.

### ¿Necesito suscribirme cada mes?
No, la suscripción es recurrente. Se renueva automáticamente cada mes.

---

## 🚀 Alternativa mientras tanto

Si prefieres no suscribirte ahora, el sistema ya funciona con:

```bash
# Adzuna (5,000 req/mes - incluye datos de LinkedIn)
curl "http://localhost:3333/api/jobs/search?q=developer&sources=adzuna"

# Remotive (trabajos remotos ilimitados)
curl "http://localhost:3333/api/jobs/search?q=javascript&sources=remotive"

# Todas las fuentes (menos LinkedIn hasta que te suscribas)
curl "http://localhost:3333/api/jobs/search?q=react"
```

---

**¿Lograste suscribirte?** Ejecuta el comando de prueba y dime qué resultado obtuviste.
