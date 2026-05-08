export type Institucion = 'NF' | 'BX' | 'AMBOS'

export interface ItemChecklist {
  orden: number
  nombre: string
  slug: string
  obligatorio: boolean
  tiposPermitidos: string[]
}

export interface Programa {
  id: string
  nombre: string
  institucion: Institucion
  prefijo: 'NF' | 'BX'
  numeroSesiones: number
  checklistFijo: ItemChecklist[]
  checklistPorSesion: ItemChecklist[]
}
