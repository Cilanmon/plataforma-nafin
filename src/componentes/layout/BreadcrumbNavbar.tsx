'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

const ETIQUETAS: Record<string, string> = {
  inicio: 'Inicio',
  expedientes: 'Expedientes',
  nuevo: 'Nuevo expediente',
  administracion: 'Administración',
  consultores: 'Usuarios',
  'mis-servicios': 'Mis servicios',
}

function esId(segmento: string): boolean {
  // segmento con guiones y números → probablemente un ID de expediente
  return /^[A-Z]{2}-AT-\d+/.test(segmento) || segmento.length > 15
}

export function BreadcrumbNavbar() {
  const pathname = usePathname()

  const partes = pathname
    .split('/')
    .filter(Boolean)
    // elimina segmentos de grupos de rutas (entre paréntesis)
    .filter((s) => !/^\(.*\)$/.test(s))

  if (partes.length === 0) return null

  const segmentos = partes.map((parte) => ({
    etiqueta: ETIQUETAS[parte] ?? (esId(parte) ? parte : parte),
  }))

  return (
    <div className="hidden md:flex items-center gap-1.5 text-[11px] text-white/60 min-w-0">
      {segmentos.map((seg, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-white/40">/</span>}
          <span
            className={
              i === segmentos.length - 1
                ? 'text-white/90 font-medium truncate max-w-[200px]'
                : 'truncate max-w-[120px]'
            }
          >
            {seg.etiqueta}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}
