import { validarArchivo } from '@/utilidades/validaciones'

export interface ResultadoCarpeta {
  carpetaId: string
  url: string
}

export interface ResultadoCarga {
  fileId: string
  url: string
  nombre: string
}

interface RespuestaAppsScript {
  error?: string
  carpetaId?: string
  url?: string
  fileId?: string
  nombre?: string
  ok?: boolean
}

async function llamarAppsScript(
  accion: string,
  params: Record<string, unknown>
): Promise<RespuestaAppsScript> {
  const url = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
  const clave = process.env.NEXT_PUBLIC_APPS_SCRIPT_CLAVE

  if (!url) throw new Error('Apps Script no configurado — falta NEXT_PUBLIC_APPS_SCRIPT_URL')
  if (!clave) throw new Error('Apps Script no configurado — falta NEXT_PUBLIC_APPS_SCRIPT_CLAVE')

  let respuesta: Response
  try {
    respuesta = await fetch(url, {
      method: 'POST',
      // text/plain evita preflight CORS en Web Apps públicas
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ accion, clave, ...params }),
      redirect: 'follow',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Sin conexión con el servidor (${msg})`)
  }

  const texto = await respuesta.text()

  let json: RespuestaAppsScript
  try {
    json = JSON.parse(texto) as RespuestaAppsScript
  } catch {
    throw new Error(
      `Apps Script devolvió una respuesta inesperada (status ${respuesta.status}). ` +
      'Verifica que el Web App esté desplegado.'
    )
  }

  if (json.error) throw new Error(`Apps Script: ${json.error}`)

  return json
}

function archivoABase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const resultado = reader.result as string
      resolve(resultado.split(',')[1])
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsDataURL(archivo)
  })
}

export async function crearCarpetaExpediente(
  nombreCarpeta: string,
  subcarpetas: string[] = []
): Promise<ResultadoCarpeta> {
  const res = await llamarAppsScript('crearCarpeta', { nombreCarpeta, subcarpetas })
  if (!res.carpetaId || !res.url) throw new Error('Respuesta incompleta del servidor')
  return { carpetaId: res.carpetaId, url: res.url }
}

export async function subirEvidencia(
  archivo: File,
  carpetaId: string,
  nombreArchivo: string,
  subcarpeta?: string
): Promise<ResultadoCarga> {
  const validacion = validarArchivo(archivo)
  if (!validacion.valido) throw new Error(validacion.error)

  const contenidoB64 = await archivoABase64(archivo)

  const payload: Record<string, unknown> = {
    carpetaId,
    nombreArchivo,
    contenidoB64,
    mimeType: archivo.type,
  }
  if (subcarpeta) payload.subcarpeta = subcarpeta

  const res = await llamarAppsScript('subirArchivo', payload)

  if (!res.fileId || !res.url || !res.nombre) {
    throw new Error('Respuesta incompleta del servidor')
  }

  return { fileId: res.fileId, url: res.url, nombre: res.nombre }
}

export async function eliminarEvidencia(fileId: string): Promise<void> {
  await llamarAppsScript('eliminarArchivo', { fileId })
}

export async function eliminarCarpeta(carpetaId: string): Promise<void> {
  await llamarAppsScript('eliminarCarpeta', { carpetaId })
}
