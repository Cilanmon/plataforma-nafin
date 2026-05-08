export type EstadoExpediente =
  | 'en_proceso'
  | 'listo_para_envio'
  | 'enviado_institucion'
  | 'aprobado_institucion'
  // estados legacy — se mantienen para datos existentes
  | 'enviado'
  | 'cerrado'

export interface Expediente {
  id: string
  idEmpresa: string
  nombreEmpresa: string
  institucion: 'NF' | 'BX'
  programaId: string
  consultorId: string
  estado: EstadoExpediente
  carpetaDriveId: string
  nombreCarpeta: string
  fechaCreacion: Date
  fechaEnvio?: Date
  fechaAprobacion?: Date
  fechaCierre?: Date
  creadoPor: string
}
