export type EstadoEvidencia = 'pendiente' | 'cargado' | 'aprobado' | 'rechazado'

export interface Evidencia {
  id: string
  expedienteId: string
  nombre: string
  slug: string
  sesion: number | null
  nombreArchivo: string
  estado: EstadoEvidencia
  fileId?: string
  urlDrive?: string
  comentarioRechazo?: string
  fechaCarga?: Date
  cargadoPor?: string
  fechaValidacion?: Date
  validadoPor?: string
}
