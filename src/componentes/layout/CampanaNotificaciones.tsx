'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { suscribirCargadasPendientes, type EvidenciaCargada } from '@/servicios/baseDatos'

interface Props {
  cargandoAuth: boolean
}

function tiempoRelativo(fecha?: Date): string {
  if (!fecha) return ''
  const min = Math.floor((Date.now() - fecha.getTime()) / 60000)
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export function CampanaNotificaciones({ cargandoAuth }: Props) {
  const [cantidad, setCantidad] = useState(0)
  const [items, setItems] = useState<EvidenciaCargada[]>([])
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cargandoAuth) return
    const cancelar = suscribirCargadasPendientes((n, lista) => {
      setCantidad(n)
      setItems(lista)
    })
    return cancelar
  }, [cargandoAuth])

  // cierra el panel al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    if (abierto) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [abierto])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="relative p-2 text-white/80 hover:text-white transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {cantidad > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-[#B91C1C] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 tabular-nums">
            {cantidad > 99 ? '99+' : cantidad}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-borde shadow-lg z-50">
          <div className="px-4 py-2.5 border-b border-borde flex items-center justify-between">
            <p className="text-xs font-semibold text-texto uppercase tracking-wide">
              Evidencias pendientes
            </p>
            <span className="text-[10px] text-[#9B9B9B] tabular-nums">{cantidad} total</span>
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-4 text-xs text-[#9B9B9B]">Sin evidencias pendientes de revisión.</p>
          ) : (
            <div>
              {items.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/expedientes/${ev.expedienteId}`}
                  onClick={() => setAbierto(false)}
                  className="flex items-start gap-3 px-4 py-3 border-b border-borde last:border-b-0 hover:bg-superficie transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C] shrink-0 mt-1.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-texto truncate">{ev.nombre}</p>
                    <p className="text-[10px] text-[#9B9B9B] font-mono truncate">{ev.expedienteId}</p>
                    {ev.fechaCarga && (
                      <p className="text-[10px] text-[#9B9B9B]">{tiempoRelativo(ev.fechaCarga)}</p>
                    )}
                  </div>
                </Link>
              ))}
              {cantidad > 5 && (
                <Link
                  href="/expedientes"
                  onClick={() => setAbierto(false)}
                  className="block px-4 py-2.5 text-xs text-primario hover:underline text-center border-t border-borde"
                >
                  Ver los {cantidad - 5} restantes en expedientes
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
