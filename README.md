# GiraCanchera · Frontend

[![QA](https://github.com/wevillegas/giracanchera-qa/actions/workflows/qa.yml/badge.svg?branch=main)](https://github.com/wevillegas/giracanchera-qa/actions/workflows/qa.yml)

**GiraCanchera** es una bitácora de estadios de fútbol. Recorrés un planeta en 3D con imágenes satelitales, registrás cada cancha
que pisaste, contás cómo la viviste y descubrís cuánto cuesta y cómo es ir a cada estadio, con la mirada de otros hinchas.

🌐 **App:** https://giracanchera.vercel.app · ⚙️ **Backend:** [giracanchera-backend](https://github.com/wevillegas/giracanchera-backend) · 🧪 **QA:** [giracanchera-qa](https://github.com/wevillegas/giracanchera-qa)

---

## Qué se puede hacer

**Mapa**
- Planeta en 3D con imágenes satelitales, pines con el escudo de cada club y viaje animado hasta cada estadio.
- Búsqueda de estadios y usuarios; filtros por todos, visitados y por visitar.

**Ficha de cada estadio**
- Postal con las fotos del estadio (se da vuelta y se inclina), colores tomados del escudo del club.
- Datos clave, ficha técnica, historia, datos curiosos, distribución de puntajes y gasto típico.
- Ubicación en Google Maps, estadios cercanos y fotos de los hinchas en un visor que se navega como galería.
- Link propio para compartir (`/estadio/<id>`), con vista previa en WhatsApp y redes.

**Reseñas**
- Puntuación de 1 a 10, texto, fecha, partido (local, visitante, resultado), gastos del día y hasta 4 fotos.
- Me gusta, guardar, denunciar y filtro por estrellas.

**Perfil**
- Cabecera con los colores del club del que sos hincha, reseñas, fotos, estadios visitados y por visitar.
- Seguidores y seguidos, estadísticas personales (estadio favorito, gasto total, mes con más visitas), me gusta y guardadas.

**Comunidad y estadísticas**
- Página de estadísticas: hinchas por club con podio, estadios más reseñados, mejor puntuados y por provincia.
- Sugerir correcciones de datos de un estadio.

**Panel de administración**
- Resumen de pendientes, gestión de usuarios (editar, silenciar, reiniciar contraseña, ver actividad), estadios, clubes y fotos.
- Moderación de reseñas y denuncias, correcciones sugeridas, importación de datos desde Wikidata.
- Analíticas por período y auditoría de cambios con filtros y exportación a CSV.

**Además:** diseño responsive con menú móvil, página Acerca de y página de privacidad (`/privacidad`).

## Tecnologías

| Área | Tecnologías |
|---|---|
| Interfaz | React 19, Vite 8, Tailwind CSS 3, Lucide (íconos) |
| Mapa | MapLibre GL (globo 3D, imágenes satelitales de Esri) |
| Datos | Axios contra la API REST del backend (cookie de sesión, mismo origen) |
| Monitoreo | Sentry (errores del navegador, sin datos personales ni grabación de sesiones) |
| Calidad | oxlint, node:test |
| Despliegue | Vercel (con reenvío de `/api` al backend en Render y vista previa para redes en `api/og.js`) |

## Estructura

```
src/
  main.jsx                 punto de entrada (Sentry, AuthProvider, ErrorBoundary)
  App.jsx                  estado global: vista actual, estadios, filtros, búsqueda y navegación (/estadio/<id>, /privacidad)
  theme.js                 colores y tipografías
  components/              pantallas y componentes (mapa, ficha, reseña, perfil, estadísticas, modales, visor de fotos…)
  components/admin/        panel de administración
  services/                llamadas a la API (estadios, reseñas, usuarios, clubes, estadísticas, admin)
  context/AuthContext.jsx  sesión del usuario
  utils/                   distancias, colores del escudo, estadísticas de reseñas, validaciones, URLs (con tests)
api/og.js                  vista previa de /estadio/<id> para WhatsApp y redes (función serverless de Vercel)
vercel.json                reenvío de /api al backend, rutas de la app y cabeceras de seguridad
```

## Puesta en marcha (local)

Requisitos: Node 22 o superior y el [backend](https://github.com/wevillegas/giracanchera-backend) corriendo en `localhost:5000`.

```bash
npm install
cp .env.example .env
npm run dev
```

La app levanta en `http://localhost:5173`. En desarrollo Vite reenvía `/api` al backend, igual que Vercel en producción, así la
cookie de sesión queda en el mismo origen.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `VITE_API_URL` | Dirección de la API. Dejarla en `/api` (o vacía): en producción Vercel la reenvía al backend |
| `VITE_SENTRY_DSN` | Avisos de errores del navegador (vacío = desactivado) |
| `API_URL` | Solo en Vercel: dirección del backend, para la vista previa de los links en redes |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | Revisión del código con oxlint |
| `npm test` | Tests de las utilidades |

## QA y testing

El repo [giracanchera-qa](https://github.com/wevillegas/giracanchera-qa) prueba esta app de punta a punta en cada push y pull
request (GitHub Actions), contra el backend real y una base de datos de prueba:

- **E2E con Playwright + TypeScript:** el mapa se renderiza, buscar un estadio y abrir su ficha, login correcto y con error,
  crear una reseña con sesión, acciones protegidas sin sesión y la vista mobile (Pixel 7). Usa Page Object Model y
  selectores por rol y label; el único `data-testid` está en el contenedor del mapa, que no tiene rol accesible.
- **API con Postman/Newman:** 54 requests y 371 aserciones sobre el backend.

El estado está en el badge.

## Seguridad

- Sin tokens en el navegador: la sesión es una cookie httpOnly que el JavaScript de la página no puede leer.
- Content Security Policy: solo se cargan scripts propios y se conecta a la API, a los mapas y a Sentry.
- La página no se puede incrustar en otros sitios (`frame-ancestors 'none'`), HSTS y `nosniff` desde Vercel.

## Despliegue

Vercel construye `main` automáticamente. `vercel.json` reenvía `/api/*` al backend en Render, sirve la app para cualquier otra
ruta y manda a los bots de redes (WhatsApp, X, Facebook…) a `api/og.js` para que los links de estadios tengan vista previa.

---

Desarrollado por **Wenceslao José Villegas** · Ingeniería Informática, UNSTA ·
[LinkedIn](https://www.linkedin.com/in/wenceslaojosevillegas/) · [GitHub](https://github.com/wevillegas)
