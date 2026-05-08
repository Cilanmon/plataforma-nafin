export interface Usuario {
  id: string
  nombre: string             // nombre completo armado: primer + segundo + apellidos
  nombreCorto: string        // primerNombre + primerApellido — sidebar y listas
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  correo: string
  telefono?: string
  rol: 'gestor' | 'consultor'
  competencias?: string[]    // IDs de programas, solo consultores
  activo: boolean
  fechaAlta: Date
}
