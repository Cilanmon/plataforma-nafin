export interface Comentario {
  id: string
  expedienteId: string
  evidenciaId: string | null
  nombreEvidencia: string
  texto: string
  creadoPor: string
  nombreAutor: string
  rol: 'gestor' | 'consultor'
  fechaCreacion: Date
}
