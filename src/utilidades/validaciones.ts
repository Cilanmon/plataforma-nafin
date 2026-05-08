const TIPOS_PERMITIDOS = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png']

const EXTENSIONES_LEGIBLES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
}

const TAMAÑO_MAXIMO_BYTES = 20 * 1024 * 1024 // 20 MB

export interface ResultadoValidacion {
  valido: boolean
  error?: string
}

export function validarArchivo(archivo: File): ResultadoValidacion {
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    const permitidos = Object.values(EXTENSIONES_LEGIBLES).join(', ')
    return { valido: false, error: `Tipo de archivo no permitido. Se aceptan: ${permitidos}` }
  }

  if (archivo.size > TAMAÑO_MAXIMO_BYTES) {
    const mb = (archivo.size / (1024 * 1024)).toFixed(1)
    return { valido: false, error: `El archivo pesa ${mb} MB. El máximo permitido es 20 MB` }
  }

  return { valido: true }
}

export function validarCorreo(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
}

export function validarNombreEmpresa(nombre: string): ResultadoValidacion {
  if (!nombre.trim()) return { valido: false, error: 'El nombre de la empresa es requerido' }
  if (nombre.trim().length < 3) return { valido: false, error: 'El nombre debe tener al menos 3 caracteres' }
  return { valido: true }
}
