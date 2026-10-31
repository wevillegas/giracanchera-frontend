import * as Sentry from '@sentry/react'

// Avisos de errores del navegador (Sentry). Sin VITE_SENTRY_DSN no hace nada.
// Solo errores y tiempos de carga: sin grabación de sesiones ni datos personales (ver la página de privacidad).
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION,
  sendDefaultPii: false,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
})
