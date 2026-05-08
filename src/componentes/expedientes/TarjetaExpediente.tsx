'use client'

import React from 'react'
import Link from 'next/link'
import type { Expediente } from '@/tipos/expediente'
import { Insignia } from '@/componentes/comunes/Insignia'
import { formatearFechaCorta } from '@/utilidades/formatos'
import { PROGRAMA_POR_ID } from '@/constantes/programas'

interface PropiedadesTarjetaExpediente {
  expediente: Expediente
  avance?: { completados: number; total: number }
  href?: string
}

interface ContenidoTarjetaProps {
  expediente: Expediente
  avance?: { completados: number; total: number }
  conEnlace: boolean
}

function ContenidoTarjeta({ expediente, avance, conEnlace }: ContenidoTarjetaProps) {
  const programa = PROGRAMA_POR_ID[expediente.programaId]
  const porcentaje =
    avance && avance.total > 0
      ? Math.round((avance.completados / avance.total) * 100)
      : null

  return (
    <div
      className={[
        'bg-white border border-borde p-4',
        'border-l-4',
        expediente.institucion === 'BX' ? 'border-l-[#1A3A6B]' : 'border-l-nafin',
        conEnlace ? 'group-hover:bg-superficie transition-colors' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs text-[#6B6B6B] font-mono mb-0.5">{expediente.nombreCarpeta}</p>
          <h3 className="text-sm font-semibold text-texto truncate">{expediente.nombreEmpresa}</h3>
        </div>
        <Insignia tipo="expediente" estado={expediente.estado} tamaño="sm" />
      </div>

      <p className="text-xs text-[#6B6B6B] mb-3">
        {programa?.nombre ?? expediente.programaId}
      </p>

      {avance && porcentaje !== null && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-[#6B6B6B] mb-1">
            <span>Avance</span>
            <span className="font-medium tabular-nums">
              {avance.completados}/{avance.total} ({porcentaje}%)
            </span>
          </div>
          <div className="h-1.5 bg-[#E0E0E0]">
            <div
              className="h-1.5 bg-primario"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-[#9B9B9B]">
        Creado {formatearFechaCorta(expediente.fechaCreacion)}
      </p>
    </div>
  )
}

export function TarjetaExpediente({ expediente, avance, href }: PropiedadesTarjetaExpediente) {
  if (href) {
    return (
      <Link href={href} className="block group">
        <ContenidoTarjeta expediente={expediente} avance={avance} conEnlace />
      </Link>
    )
  }

  return (
    <div className="block">
      <ContenidoTarjeta expediente={expediente} avance={avance} conEnlace={false} />
    </div>
  )
}
