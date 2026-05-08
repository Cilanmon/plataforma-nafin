export interface Consultor {
  id: string
  nombre: string
  correo: string
  telefono?: string
  competencias?: string[]   // IDs de programas
  activo: boolean
  fechaAlta: Date
}
