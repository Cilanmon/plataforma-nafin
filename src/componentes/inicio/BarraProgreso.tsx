'use client'

import React from 'react'

interface PropiedadesBarraProgreso {
  valor: number
  total: number
  etiqueta?: string
  mostrarPorcentaje?: boolean
  color?: string
  altura?: 'xs' | 'sm' | 'md'
}

const alturas = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
}

export function BarraProgreso({
  valor,
  total,
  etiqueta,
  mostrarPorcentaje = true,
  color = '#1B4D35',
  altura = 'sm',
}: PropiedadesBarraProgreso) {
  const porcentaje = total === 0 ? 0 : Math.min(100, Math.round((valor / total) * 100))

  return (
    <div className="w-full">
      {(etiqueta || mostrarPorcentaje) && (
        <div className="flex items-center justify-between mb-1">
          {etiqueta && (
            <span className="text-xs text-[#6B6B6B]">{etiqueta}</span>
          )}
          {mostrarPorcentaje && (
            <span className="text-xs font-semibold text-texto tabular-nums ml-auto">
              {valor}/{total} &mdash; {porcentaje}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-[#E0E0E0] ${alturas[altura]}`}>
        <div
          className={`${alturas[altura]} transition-all duration-300`}
          style={{ width: `${porcentaje}%`, backgroundColor: color }}
          role="progressbar"
          aria-valuenow={porcentaje}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
