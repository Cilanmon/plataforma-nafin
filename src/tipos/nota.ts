export interface Nota {
  id: string
  expedienteId: string
  texto: string
  creadoPor: string
  nombreAutor: string
  rol: 'gestor' | 'consultor'
  fechaCreacion: Date
}
