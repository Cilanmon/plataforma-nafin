import type { EstadoEvidencia } from '@/tipos/evidencia'
import type { EstadoExpediente } from '@/tipos/expediente'

export interface ConfigEstado {
  etiqueta: string
  color: string
  fondo: string
  icono: string
}

export const ESTADOS_EVIDENCIA: Record<EstadoEvidencia, ConfigEstado> = {
  pendiente: {
    etiqueta: 'Pendiente',
    color: '#6B6B6B',
    fondo: '#F0F0F0',
    icono: '○',
  },
  cargado: {
    etiqueta: 'Cargado',
    color: '#1B4D35',
    fondo: '#E8F2ED',
    icono: '●',
  },
  aprobado: {
    etiqueta: 'Aprobado',
    color: '#1A5C2A',
    fondo: '#D4EDDA',
    icono: '✓',
  },
  rechazado: {
    etiqueta: 'Rechazado',
    color: '#8B1A1A',
    fondo: '#FDECEA',
    icono: '✗',
  },
}

export const ESTADOS_EXPEDIENTE: Record<EstadoExpediente, ConfigEstado> = {
  en_proceso: {
    etiqueta: 'En proceso',
    color: '#8B6914',
    fondo: '#FDF3DC',
    icono: '⟳',
  },
  listo_para_envio: {
    etiqueta: 'Listo para envío',
    color: '#1B4D35',
    fondo: '#E8F2ED',
    icono: '▲',
  },
  enviado_institucion: {
    etiqueta: 'Enviado',
    color: '#1A3A6B',
    fondo: '#E0E8F5',
    icono: '→',
  },
  aprobado_institucion: {
    etiqueta: 'Aprobado',
    color: '#1A5C2A',
    fondo: '#D4EDDA',
    icono: '✓',
  },
  // legacy
  enviado: {
    etiqueta: 'Enviado',
    color: '#1A3A6B',
    fondo: '#E0E8F5',
    icono: '→',
  },
  cerrado: {
    etiqueta: 'Cerrado',
    color: '#3A3A3A',
    fondo: '#EBEBEB',
    icono: '■',
  },
}

// Orden del flujo principal (legacy excluido)
export const ORDEN_ESTADOS_EXPEDIENTE: EstadoExpediente[] = [
  'en_proceso',
  'listo_para_envio',
  'enviado_institucion',
  'aprobado_institucion',
]
