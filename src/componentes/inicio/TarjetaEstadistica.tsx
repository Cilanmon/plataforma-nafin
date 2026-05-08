'use client'

import React from 'react'

interface PropiedadesTarjetaEstadistica {
  titulo: string
  valor: number | string
  descripcion?: string
  icono?: React.ReactNode
  color?: 'primario' | 'nafin' | 'acento' | 'neutro'
}

const coloresHeader: Record<string, string> = {
  primario: 'border-t-primario',
  nafin: 'border-t-nafin',
  acento: 'border-t-acento',
  neutro: 'border-t-[#6B6B6B]',
}

export function TarjetaEstadistica({
  titulo,
  valor,
  descripcion,
  icono,
  color = 'primario',
}: PropiedadesTarjetaEstadistica) {
  return (
    <div
      className={`bg-white border border-borde border-t-4 ${coloresHeader[color]} p-5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-2">
            {titulo}
          </p>
          <p className="text-3xl font-bold text-texto tabular-nums">{valor}</p>
          {descripcion && (
            <p className="text-xs text-[#6B6B6B] mt-1">{descripcion}</p>
          )}
        </div>
        {icono && (
          <div className="text-2xl text-[#AAAAAA] shrink-0">{icono}</div>
        )}
      </div>
    </div>
  )
}
