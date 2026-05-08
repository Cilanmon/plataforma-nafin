export type TipoAccion = 'subida' | 'aprobado' | 'rechazado'

export interface Actividad {
  id: string
  expedienteId: string
  nombreExpediente: string
  tipoAccion: TipoAccion
  nombreEvidencia: string
  nombreUsuario: string
  usuarioId: string
  fechaCreacion: Date
}
