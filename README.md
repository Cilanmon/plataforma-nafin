# Control de Servicios NAFIN/BANCOMEXT

Plataforma interna para gestión de evidencias de Asistencia Técnica — COMPECER.

## Requisitos

- Node.js 18+
- Cuenta Firebase configurada (Auth + Firestore)
- Google Apps Script desplegado como Web App

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.local.example` a `.env.local` y llena los valores:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_APPS_SCRIPT_URL=
NEXT_PUBLIC_APPS_SCRIPT_CLAVE=
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
npm start
```

Desplegado en Vercel. Cada push a `main` despliega automáticamente.

## Reglas y índices de Firestore

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Estructura

```
src/app          — páginas y rutas (App Router)
src/componentes  — componentes reutilizables
src/hooks        — lógica de negocio
src/servicios    — Firebase y Apps Script
src/constantes   — catálogo de programas
src/tipos        — tipos TypeScript
apps-script/     — código del proxy de Drive
```

## Roles

- **Gestor** — gestiona expedientes, valida evidencias, asigna consultores
- **Consultor** — sube evidencias a sus servicios asignados
