import type { Programa, ItemChecklist } from '@/tipos/programa'

// Documentos comunes a todos los programas
const ITEM_HERRAMIENTA: ItemChecklist = {
  orden: 1,
  nombre: 'Herramienta de diagnóstico',
  slug: 'herramienta',
  obligatorio: true,
  tiposPermitidos: ['xlsx', 'docx'],
}

const ITEM_INFORME_FINAL: ItemChecklist = {
  orden: 2,
  nombre: 'Informe final',
  slug: 'informe-final',
  obligatorio: true,
  tiposPermitidos: ['pdf', 'docx'],
}

const ITEM_EVIDENCIA_FOTOGRAFICA: ItemChecklist = {
  orden: 1,
  nombre: 'Evidencia fotográfica',
  slug: 'evidencia-fotografica',
  obligatorio: true,
  tiposPermitidos: ['jpg', 'png', 'pdf'],
}

// Checklist fijo exclusivo del Diagnóstico Integral
const CHECKLIST_FIJO_DIAGNOSTICO: ItemChecklist[] = [
  {
    orden: 1,
    nombre: 'Carta compromiso',
    slug: 'carta-compromiso',
    obligatorio: true,
    tiposPermitidos: ['pdf', 'docx'],
  },
  {
    orden: 2,
    nombre: 'CSF',
    slug: 'csf',
    obligatorio: true,
    tiposPermitidos: ['pdf'],
  },
  {
    orden: 3,
    nombre: 'Herramienta de diagnóstico',
    slug: 'herramienta',
    obligatorio: true,
    tiposPermitidos: ['xlsx', 'docx'],
  },
  {
    orden: 4,
    nombre: 'Informe final',
    slug: 'informe-final',
    obligatorio: true,
    tiposPermitidos: ['pdf', 'docx'],
  },
]

const CHECKLIST_FIJO_ESTANDAR: ItemChecklist[] = [ITEM_HERRAMIENTA, ITEM_INFORME_FINAL]

const CHECKLIST_POR_SESION: ItemChecklist[] = [ITEM_EVIDENCIA_FOTOGRAFICA]

export const PROGRAMAS: Programa[] = [
  {
    id: 'diagnostico-integral',
    nombre: 'Diagnóstico Integral',
    institucion: 'AMBOS',
    prefijo: 'NF',
    numeroSesiones: 2,
    checklistFijo: CHECKLIST_FIJO_DIAGNOSTICO,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },
  {
    id: 'capacidades-empresariales',
    nombre: 'Capacidades Empresariales',
    institucion: 'AMBOS',
    prefijo: 'NF',
    numeroSesiones: 8,
    checklistFijo: CHECKLIST_FIJO_ESTANDAR,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },

  {
    id: 'hecho-en-mexico',
    nombre: 'Distintivo Hecho en México',
    institucion: 'NF',
    prefijo: 'NF',
    numeroSesiones: 2,
    checklistFijo: CHECKLIST_FIJO_ESTANDAR,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },
  {
    id: 'plan-de-negocio',
    nombre: 'Plan de Negocio',
    institucion: 'NF',
    prefijo: 'NF',
    numeroSesiones: 8,
    checklistFijo: CHECKLIST_FIJO_ESTANDAR,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },
  {
    id: 'gestion-innovacion',
    nombre: 'Gestión de la Innovación',
    institucion: 'NF',
    prefijo: 'NF',
    numeroSesiones: 4,
    checklistFijo: CHECKLIST_FIJO_ESTANDAR,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },
  {
    id: 'sostenibilidad-asg',
    nombre: 'Sostenibilidad Empresarial ASG',
    institucion: 'NF',
    prefijo: 'NF',
    numeroSesiones: 8,
    checklistFijo: CHECKLIST_FIJO_ESTANDAR,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },

  {
    id: 'proceso-exportacion',
    nombre: 'Proceso de Exportación',
    institucion: 'BX',
    prefijo: 'BX',
    numeroSesiones: 6,
    checklistFijo: CHECKLIST_FIJO_ESTANDAR,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },
  {
    id: 'manufactura-esbelta',
    nombre: 'Manufactura Esbelta',
    institucion: 'BX',
    prefijo: 'BX',
    numeroSesiones: 10,
    checklistFijo: CHECKLIST_FIJO_ESTANDAR,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },
  {
    id: 'calidad-iso-9001',
    nombre: 'Gestión de Calidad ISO 9001',
    institucion: 'BX',
    prefijo: 'BX',
    numeroSesiones: 10,
    checklistFijo: CHECKLIST_FIJO_ESTANDAR,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },
  {
    id: 'calidad-as9100',
    nombre: 'Calidad Aeroespacial AS9100',
    institucion: 'BX',
    prefijo: 'BX',
    numeroSesiones: 15,
    checklistFijo: CHECKLIST_FIJO_ESTANDAR,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },
  {
    id: 'protocolo-familia',
    nombre: 'Protocolo Familia Empresaria',
    institucion: 'BX',
    prefijo: 'BX',
    numeroSesiones: 8,
    checklistFijo: CHECKLIST_FIJO_ESTANDAR,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },
  {
    id: 'gobierno-corporativo',
    nombre: 'Gobierno Corporativo',
    institucion: 'BX',
    prefijo: 'BX',
    numeroSesiones: 10,
    checklistFijo: CHECKLIST_FIJO_ESTANDAR,
    checklistPorSesion: CHECKLIST_POR_SESION,
  },
]

export const PROGRAMA_POR_ID = Object.fromEntries(
  PROGRAMAS.map((p) => [p.id, p])
) as Record<string, Programa>
