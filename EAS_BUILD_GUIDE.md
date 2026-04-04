# Guía: Compilar RapidWork para iOS sin Mac (EAS Build)

Esta guía te permite generar el archivo `.ipa` de **RapidWork** para iOS usando **EAS Build** de Expo, sin necesidad de tener una Mac física.

---

## ¿Qué es EAS Build?

**EAS Build** es un servicio en la nube de Expo que compila aplicaciones nativas (iOS y Android) en servidores Mac de Expo. Se encarga de:
- Compilar el proyecto Xcode automáticamente
- Firmar la app con certificados de Apple
- Entregarte un `.ipa` listo para instalar o publicar

---

## Requisitos previos

1. **Node.js** y **npm** instalados
2. Proyecto **RapidWork** ya configurado (Capacitor + iOS)
3. Una cuenta gratuita en **Expo** → https://expo.dev/signup
4. (Opcional) Cuenta de **Apple Developer** ($99/año) si querés distribuir por App Store

---

## Paso 1: Iniciar sesión en Expo

```bash
npx eas login
```

Ingresá tu usuario y contraseña de Expo.

---

## Paso 2: Configurar el proyecto en EAS

```bash
npx eas build:configure
```

Cuando te pregunte, seleccioná:
- **Plataforma**: `iOS`
- Esto creará el proyecto en tu dashboard de Expo.

---

## Paso 3: Elegir tipo de build

### Opción A — Preview (para probar en tu iPhone)
Ideal para instalar la app en tu dispositivo sin publicarla.

```bash
npx eas build --platform ios --profile preview
```

**¿Necesita Apple Developer?**
- **No obligatoriamente**. EAS puede generar un perfil **ad-hoc** usando tu Apple ID gratuito.
- Si elegís ad-hoc, deberás registrar el **UDID** de tu iPhone en el portal de Apple.

**Flujo típico:**
1. EAS te pregunta si querés iniciar sesión con tu Apple ID → decí que sí.
2. Ingresá tu Apple ID y contraseña.
3. Elegí el tipo de certificado: seleccioná **Ad Hoc**.
4. Registrá el UDID de tu iPhone cuando te lo solicite.
5. Esperá ~15-30 minutos.
6. Al finalizar, recibirás un enlace para descargar el `.ipa` o un **QR** para instalarlo directamente.

> **Nota:** Para registrar el UDID de tu iPhone, andá a `Ajustes > General > Información > Número de serie (tocar para ver UDID)` o conectalo a iTunes/Finder.

---

### Opción B — Producción (para App Store)
Usalo cuando quieras subir la app a **App Store Connect**.

```bash
npx eas build --platform ios --profile production
```

**Requisitos:**
- Sí necesitás **Apple Developer Program** ($99/año).
- EAS puede manejar automáticamente certificados y provisioning profiles.

**Flujo típico:**
1. Iniciá sesión con tu Apple ID vinculado a Apple Developer.
2. Elegí **App Store** como tipo de distribución.
3. EAS genera y firma todo automáticamente.
4. Al finalizar, te da un `.ipa` listo para subir a App Store Connect.

**Subir automáticamente a App Store (opcional):**
```bash
npx eas submit --platform ios
```

---

### Opción C — Desarrollo (con live reload)
Ideal para iterar rápidamente mientras desarrollás.

```bash
npx eas build --platform ios --profile development
```

Incluye el **Expo Development Client**, que te permite probar cambios sin recompilar cada vez.

---

## Estructura de archivos de configuración

### `eas.json`
```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### `app.json`
```json
{
  "name": "RapidWork",
  "slug": "rapidwork",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./public/icon.png",
  "userInterfaceStyle": "light",
  "splash": {
    "image": "./public/assets/splash/launch-1242x2208.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff"
  },
  "assetBundlePatterns": [
    "**/*"
  ],
  "ios": {
    "bundleIdentifier": "com.rapidwork.app",
    "buildNumber": "1.0.0"
  },
  "android": {
    "package": "com.rapidwork.app",
    "versionCode": 1
  }
}
```

---

## Paso 4: Ver el estado del build

Podés seguir el progreso en la terminal o en tu navegador:

```bash
npx eas build:list
```

O ingresá a: https://expo.dev/accounts/[TU_USUARIO]/projects/rapidwork/builds

---

## Paso 5: Instalar la app en tu iPhone

### Si usaste Preview (Ad Hoc)
1. Escaneá el **QR code** que te da EAS al finalizar.
2. O descargá el `.ipa` desde el enlace.
3. Instalalo con **Apple Configurator 2** o **AltStore**.

### Si usaste Development
1. Escaneá el QR con la cámara del iPhone.
2. Se abre Expo Go o el Development Client.
3. La app se instala directamente.

---

## Comandos útiles

| Acción | Comando |
|--------|---------|
| Login en Expo | `npx eas login` |
| Configurar EAS | `npx eas build:configure` |
| Build de preview | `npx eas build --platform ios --profile preview` |
| Build de producción | `npx eas build --platform ios --profile production` |
| Build de desarrollo | `npx eas build --platform ios --profile development` |
| Ver builds | `npx eas build:list` |
| Subir a App Store | `npx eas submit --platform ios` |
| Logout | `npx eas logout` |

---

## Troubleshooting

### "You are not enrolled in the Apple Developer Program"
- Si elegís **App Store** o **TestFlight** sin tener cuenta de pago, fallará.
- Solución: usá `--profile preview` con distribución **internal** o **ad-hoc**.

### "Device not registered"
- En modo ad-hoc, solo los dispositivos con UDID registrado pueden instalar la app.
- Agregá tu UDID en el portal de Apple o dejá que EAS te guíe para hacerlo.

### Build falla por iconos o splash
- Asegurate de que `public/icon.png` exista.
- El splash screen debería estar en `public/assets/splash/launch-1242x2208.png`.

---

## Resumen: ¿Con o sin Apple Developer?

| Objetivo | Apple Developer ($99/año) | Comando recomendado |
|----------|---------------------------|---------------------|
| Probar en mi iPhone | No | `npx eas build --platform ios --profile preview` |
| Distribuir por TestFlight | Sí | `npx eas build --platform ios --profile production` |
| Publicar en App Store | Sí | `npx eas build --platform ios --profile production` |
| Desarrollo rápido | No | `npx eas build --platform ios --profile development` |

---

## Próximo paso recomendado

1. Ejecutá `npx eas login`.
2. Ejecutá `npx eas build:configure`.
3. Ejecutá `npx eas build --platform ios --profile preview`.
4. Seguí las instrucciones interactivas de EAS.
