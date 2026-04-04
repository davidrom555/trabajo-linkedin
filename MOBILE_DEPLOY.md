# Guía de Despliegue para iOS/Android

## 🔴 Problema en Apps Móviles

En móvil (Capacitor), la app corre desde `file://` local, por lo que:
- ❌ `/api` NO funciona (no hay servidor web local)
- ✅ Necesita URL absoluta: `https://tu-api.com/api`

---

## 📋 Pre-requisitos

1. Backend desplegado en internet (no localhost)
2. URL accesible públicamente
3. CORS configurado en el backend para permitir el origen de la app

---

## 🚀 Pasos para iOS

### 1. Configura la URL del Backend

Edita `src/environments/environment.mobile.ts`:

```typescript
const BACKEND_URL = 'https://api.tudominio.com/api';
// o con ngrok para testing:
// const BACKEND_URL = 'https://xxxx.ngrok-free.app/api';
```

### 2. Construye la app para móvil

```bash
npm run build:mobile
```

### 3. Sincroniza con iOS

```bash
npx cap sync ios
```

### 4. Abre Xcode

```bash
npx cap open ios
```

### 5. En Xcode:
- Selecciona tu dispositivo o simulador
- Presiona ▶️ Run

---

## 🤖 Pasos para Android

### 1-2. Igual que iOS (configura URL y build)

### 3. Sincroniza con Android

```bash
npx cap sync android
```

### 4. Abre Android Studio

```bash
npx cap open android
```

### 5. En Android Studio:
- Selecciona dispositivo
- Presiona ▶️ Run

---

## 🧪 Testing Local con Ngrok (Sin deployar backend)

Si quieres probar en tu dispositivo físico sin deployar el backend:

### 1. Instala ngrok
```bash
npm install -g ngrok
```

### 2. Inicia tu servidor local
```bash
npm run server
# o: node server/index.js
```

### 3. Expón el puerto con ngrok
```bash
ngrok http 3333
```

### 4. Copia la URL HTTPS
```
Forwarding  https://abcd-123-45-67-89.ngrok-free.app -> http://localhost:3333
          └─ Usa esta URL
```

### 5. Configura en environment.mobile.ts
```typescript
const BACKEND_URL = 'https://abcd-123-45-67-89.ngrok-free.app/api';
```

### 6. Rebuild y sync
```bash
npm run sync:ios
# o: npm run sync:android
```

---

## ⚠️ Importante: CORS en Backend

El backend debe permitir CORS desde cualquier origen (la app móvil no tiene dominio):

```javascript
// server/index.js ya está configurado para esto:
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps)
    if (!origin) return callback(null, true);
    // ... resto de la config
  }
}));
```

---

## 📝 Comandos Rápidos

```bash
# Build + Sync iOS completo
npm run sync:ios

# Build + Sync Android completo
npm run sync:android

# Solo build para móvil
npm run build:mobile

# Abrir en Xcode
npm run open:ios

# Abrir en Android Studio
npm run open:android
```

---

## 🔧 Troubleshooting

### Error: "Network Error" o "Failed to fetch"
- Verifica que la URL del backend sea accesible desde internet
- Prueba la URL en el navegador del móvil
- Verifica que el backend esté corriendo

### Error de CORS
- Asegúrate que el backend permita CORS sin origin
- Reinicia el servidor backend

### Cambios no se ven en la app
- Limpia el build: `npm run build:mobile`
- Sync de nuevo: `npx cap sync ios`
- En Xcode/Android Studio: Clean Build Folder / Rebuild

### App muestra pantalla blanca
- Revisa la consola de Safari DevTools (iOS) o Chrome DevTools (Android)
- Verifica que no haya errores de JavaScript
