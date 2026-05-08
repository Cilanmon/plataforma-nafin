# Apps Script — Guía de despliegue

Este archivo (`codigo.gs`) es el backend que conecta la aplicación
con Google Drive. Se ejecuta en los servidores de Google, con las
credenciales de la cuenta que lo despliega.

---

## Requisitos previos

- Cuenta de Google con acceso a la carpeta raíz de Drive
  donde vivirán los expedientes.
- La cuenta debe tener permisos de editor en esa carpeta.

---

## Pasos de instalación

### 1 · Crear el proyecto en Apps Script

1. Entra a [script.google.com](https://script.google.com)
2. Clic en **Nuevo proyecto**
3. Renombra el proyecto como `Control de Servicios NAFIN`
4. Borra el contenido del editor y pega todo el contenido de `codigo.gs`
5. Guarda (Ctrl + S)

---

### 2 · Crear la carpeta raíz en Drive

1. Ve a [drive.google.com](https://drive.google.com)
2. Crea una carpeta llamada `NAFIN - Expedientes` (o el nombre que prefieras)
3. Abre la carpeta y copia el **ID** de la URL:
   ```
   https://drive.google.com/drive/folders/[ESTE-ES-EL-ID]
   ```

---

### 3 · Configurar las propiedades del script

En el editor de Apps Script:

1. Menú **Proyecto** → **Propiedades del script**
   (o ícono de engranaje en la barra lateral → *Propiedades del script*)
2. Agrega estas dos propiedades:

   | Propiedad         | Valor                                         |
   |-------------------|-----------------------------------------------|
   | `CLAVE_SECRETA`   | Cadena aleatoria larga (mín. 32 caracteres)   |
   | `CARPETA_RAIZ_ID` | El ID de la carpeta que creaste en el paso 2  |

   Para generar una clave segura puedes usar:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Clic en **Guardar propiedades del script**

---

### 4 · Desplegar como Web App

1. Clic en **Implementar** → **Nueva implementación**
2. Tipo de implementación: **Aplicación web**
3. Configuración:
   - **Descripción**: `v1`
   - **Ejecutar como**: `Yo (tu-cuenta@gmail.com)`
   - **Acceso**: `Cualquier persona`
4. Clic en **Implementar**
5. Autoriza los permisos cuando se solicite
   (Drive, propiedades del script)
6. Copia la **URL de la aplicación web** — tiene esta forma:
   ```
   https://script.google.com/macros/s/[ID-LARGO]/exec
   ```

---

### 5 · Configurar variables de entorno en Next.js

Agrega estas líneas a tu `.env.local`:

```env
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/[ID]/exec
APPS_SCRIPT_CLAVE_SECRETA=la-misma-clave-que-pusiste-en-el-script
```

> ⚠️ `APPS_SCRIPT_CLAVE_SECRETA` **no** lleva el prefijo `NEXT_PUBLIC_`
> para que nunca llegue al browser. Se usa solo en llamadas server-side
> si las agregas en el futuro. Por ahora la clave la maneja `almacenamiento.ts`
> leyendo `NEXT_PUBLIC_APPS_SCRIPT_SECRET` — ver nota más abajo.

**Nota sobre la clave en cliente:** En la arquitectura actual la clave viaja
en el body del POST desde el browser, por lo que debe ser `NEXT_PUBLIC_`.
Esto es aceptable porque la clave solo da acceso a Drive (no a Firebase ni
datos sensibles) y el Apps Script valida el origen. En producción considera
mover las llamadas a Drive a un Route Handler de Next.js para que la clave
quede solo en el servidor.

---

### 6 · Verificar el despliegue

Puedes probar el endpoint con curl:

```bash
curl -X POST "https://script.google.com/macros/s/[ID]/exec" \
  -H "Content-Type: application/json" \
  -d '{"accion":"crearCarpeta","clave":"tu-clave","nombreCarpeta":"TEST-001"}'
```

Respuesta esperada:
```json
{ "carpetaId": "...", "url": "https://drive.google.com/..." }
```

---

## Actualizar el código

Cada vez que modifiques `codigo.gs`:

1. Pega el nuevo código en el editor de Apps Script
2. **Implementar** → **Administrar implementaciones**
3. Edita la implementación existente → cambia la versión a **"Nueva versión"**
4. Clic en **Implementar**

> La URL del Web App no cambia entre versiones.

---

## Estructura de carpetas en Drive

```
NAFIN - Expedientes/
├── NF-AT-001-2026/          ← carpeta del expediente
│   ├── generales/           ← documentos fijos (herramienta, informe)
│   └── sesion-01/           ← evidencias por sesión
│       └── evidencia-fotografica-01.jpg
├── BX-AT-002-2026/
│   └── ...
```
