'use client'

import React from 'react'
import { Check, X, Loader2, ArrowUpCircle, Send, CheckCircle2, Circle } from 'lucide-react'
import { ESTADOS_EVIDENCIA, ESTADOS_EXPEDIENTE } from '@/constantes/estados'
import type { EstadoEvidencia } from '@/tipos/evidencia'
import type { EstadoExpediente } from '@/tipos/expediente'

interface PropiedadesInsignia {
  tipo: 'evidencia' | 'expediente'
  estado: EstadoEvidencia | EstadoExpediente
  mostrarIcono?: boolean
  tamaño?: 'sm' | 'md'
}

// mapeo de claves de estado a iconos Lucide
const ICONO_EVIDENCIA: Record<EstadoEvidencia, React.ReactNode> = {
  pendiente: <Circle size={11} />,
  cargado: <ArrowUpCircle size={11} />,
  aprobado: <Check size={11} />,
  rechazado: <X size={11} />,
}

const ICONO_EXPEDIENTE: Record<EstadoExpediente, React.ReactNode> = {
  en_proceso: <Loader2 size={11} />,
  listo_para_envio: <ArrowUpCircle size={11} />,
  enviado_institucion: <Send size={11} />,
  aprobado_institucion: <CheckCircle2 size={11} />,
  enviado: <Send size={11} />,
  cerrado: <CheckCircle2 size={11} />,
}

export function Insignia({ tipo, estado, mostrarIcono = true, tamaño = 'md' }: PropiedadesInsignia) {
  const config =
    tipo === 'evidencia'
      ? ESTADOS_EVIDENCIA[estado as EstadoEvidencia]
      : ESTADOS_EXPEDIENTE[estado as EstadoExpediente]

  if (!config) return null

  const textSize = tamaño === 'sm' ? 'text-[10px]' : 'text-xs'
  const padding = tamaño === 'sm' ? 'px-1.5 py-0.5' : 'px-2.5 py-1'

  const icono =
    tipo === 'evidencia'
      ? ICONO_EVIDENCIA[estado as EstadoEvidencia]
      : ICONO_EXPEDIENTE[estado as EstadoExpediente]

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium uppercase tracking-wide border whitespace-nowrap ${textSize} ${padding}`}
      style={{
        color: config.color,
        backgroundColor: config.fondo,
        borderColor: config.color + '40',
      }}
    >
      {mostrarIcono && icono && <span className="leading-none">{icono}</span>}
      {config.etiqueta}
    </span>
  )
}
