'use client'

import React from 'react'

interface PropiedadesMiniProgreso {
  aprobadas: number
  total: number
  rechazadas?: number
  ancho?: string
}

// barra compacta con conteo + color según estado:
// rojo si hay rechazadas · verde si todas aprobadas · ámbar en pendiente
export function MiniProgreso({
  aprobadas,
  total,
  rechazadas = 0,
  ancho = 'w-20',
}: PropiedadesMiniProgreso) {
  const porcentaje = total === 0 ? 0 : Math.round((aprobadas / total) * 100)

  const color =
    rechazadas > 0
      ? '#8B1A1A'
      : aprobadas === total && total > 0
      ? '#1A5C2A'
      : '#8B6914'

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color }}>
        {aprobadas}/{total}
      </span>
      <div className={`${ancho} h-1.5 bg-[#E0E0E0] shrink-0`}>
        <div
          className="h-1.5 transition-all duration-300"
          style={{ width: `${porcentaje}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
