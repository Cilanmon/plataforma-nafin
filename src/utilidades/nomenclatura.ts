const AÑO_ACTUAL = new Date().getFullYear()

/**
 * Genera el ID de empresa con ceros a la izquierda: 001, 002, ...
 */
export function generarIdEmpresa(totalExpedientes: number): string {
  return String(totalExpedientes + 1).padStart(3, '0')
}

/**
 * Genera el nombre de la carpeta en Drive: BX-AT-001-2026
 */
export function generarNombreCarpeta(prefijo: string, idEmpresa: string): string {
  return `${prefijo}-AT-${idEmpresa}-${AÑO_ACTUAL}`
}

/**
 * Genera el nombre del archivo según si pertenece a una sesión o al checklist fijo.
 * Con sesión:   BX-AT-001-01-evidencia-fotografica-2026
 * Sin sesión:   BX-AT-001-carta-compromiso-2026
 */
export function generarNombreArchivo(
  prefijo: string,
  idEmpresa: string,
  sesion: number | null,
  slug: string
): string {
  const base = `${prefijo}-AT-${idEmpresa}`

  if (sesion !== null) {
    const numSesion = String(sesion).padStart(2, '0')
    return `${base}-${numSesion}-${slug}-${AÑO_ACTUAL}`
  }

  return `${base}-${slug}-${AÑO_ACTUAL}`
}
