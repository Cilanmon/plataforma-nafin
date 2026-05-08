const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function formatearFecha(fecha: Date): string {
  const d = new Date(fecha)
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

export function formatearFechaCorta(fecha: Date): string {
  const d = new Date(fecha)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatearEstado(estado: string): string {
  return estado
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatearTamañoArchivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatearPorcentaje(valor: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((valor / total) * 100)}%`
}

export function formatearFechaHora(fecha: Date): string {
  const d = new Date(fecha)
  const f = d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const h = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${f} ${h}`
}
