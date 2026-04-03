# Configuración de LinkedIn API

Para obtener empleos REALES de LinkedIn, tienes estas opciones:

---

## Opción 1: RapidAPI LinkedIn Jobs (Recomendada - Más fácil)

### Pasos:

1. **Ve a RapidAPI**
   - https://rapidapi.com/jaypat87/api/linkedin-jobs-search

2. **Suscríbete al plan gratuito**
   - Haz clic en "Subscribe to Test"
   - Elige el plan "Basic" (500 requests/mes gratis)
   - No requiere tarjeta de crédito

3. **Obtén tu API Key**
   - Ve a "My Apps" en RapidAPI
   - Copia tu "Application Key"

4. **Configura el archivo .env**
   ```
   RAPIDAPI_KEY=tu_api_key_aqui
   ```

5. **Reinicia el servidor**
   ```bash
   npm run server
   ```

---

## Opción 2: Adzuna API (Alternativa gratuita - 5,000 req/mes)

Adzuna agrega empleos de LinkedIn + otras fuentes.

### Pasos:

1. **Regístrate en Adzuna**
   - https://developer.adzuna.com/

2. **Crea una aplicación**
   - Ve a "Your Applications"
   - Crea nueva app
   - Obtén APP_ID y APP_KEY

3. **Configura el archivo .env**
   ```
   ADZUNA_APP_ID=tu_app_id
   ADZUNA_APP_KEY=tu_app_key
   ```

---

## Opción 3: Ambas APIs (Recomendado para producción)

Configura ambas para tener máxima cobertura:

```env
# Adzuna (5,000 req/mes gratis)
ADZUNA_APP_ID=tu_app_id
ADZUNA_APP_KEY=tu_app_key

# RapidAPI LinkedIn (500 req/mes gratis)
RAPIDAPI_KEY=tu_api_key
```

El sistema usará:
1. LinkedIn API para búsquedas específicas
2. Adzuna como fallback con más requests
3. Remotive y Arbeitnow para trabajos remotos

---

## Verificar que funciona

```bash
# Test de health
curl http://localhost:3333/api/health

# Test de búsqueda en LinkedIn
curl "http://localhost:3333/api/jobs/search?q=react&location=Madrid&sources=linkedin"

# Test de búsqueda en todas las fuentes
curl "http://localhost:3333/api/jobs/search?q=developer&sources=all"
```

---

## Costos

| Fuente | Gratis | Pago |
|--------|--------|------|
| LinkedIn (RapidAPI) | 500 req/mes | $10/mes (10,000 req) |
| Adzuna | 5,000 req/mes | $25/mes (50,000 req) |
| Remotive | Ilimitado | Gratis |
| Arbeitnow | Ilimitado | Gratis |

---

## Troubleshooting

### Error 403 "You are not subscribed"
→ Necesitas suscribirte al plan en RapidAPI

### Error 429 "Too many requests"
→ Has excedido el límite mensual. Espera al siguiente mes o actualiza tu plan.

### No hay resultados
→ Prueba con términos de búsqueda más genéricos como "developer" o "engineer"
