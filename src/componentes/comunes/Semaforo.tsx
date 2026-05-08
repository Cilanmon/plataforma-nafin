'use client'

import React from 'react'

type NivelSemaforo = 'verde' | 'amarillo' | 'rojo' | 'gris'

interface PropiedadesSemaforo {
  nivel: NivelSemaforo
  etiqueta?: string
  tamaño?: 'sm' | 'md' | 'lg'
}

const colores: Record<NivelSemaforo, string> = {
  verde: '#1A5C2A',
  amarillo: '#8B6914',
  rojo: '#8B1A1A',
  gris: '#6B6B6B',
}

const tamaños = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
}

export function Semaforo({ nivel, etiqueta, tamaño = 'md' }: PropiedadesSemaforo) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-block rounded-full ${tamaños[tamaño]}`}
        style={{ backgroundColor: colores[nivel] }}
        aria-hidden="true"
      />
      {etiqueta && <span className="text-sm text-texto">{etiqueta}</span>}
    </span>
  )
}

/**
 * Calcula el nivel de semáforo basado en porcentaje de avance.
 */
export function nivelPorPorcentaje(porcentaje: number): NivelSemaforo {
  if (porcentaje >= 90) return 'verde'
  if (porcentaje >= 50) return 'amarillo'
  if (porcentaje > 0) return 'rojo'
  return 'gris'
}
