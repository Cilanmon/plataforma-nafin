'use client'

import React, { useEffect } from 'react'

interface PropiedadesModal {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: React.ReactNode
  ancho?: 'sm' | 'md' | 'lg' | 'xl'
  pie?: React.ReactNode
}

const anchos = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Modal({ abierto, titulo, onCerrar, children, ancho = 'md', pie }: PropiedadesModal) {
  useEffect(() => {
    const manejarEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    if (abierto) document.addEventListener('keydown', manejarEsc)
    return () => document.removeEventListener('keydown', manejarEsc)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCerrar}
        aria-hidden="true"
      />

      <div
        className={`relative w-full ${anchos[ancho]} mx-4 bg-white border border-borde shadow-2xl`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-borde">
          <h2 id="modal-titulo" className="text-base font-semibold text-texto">
            {titulo}
          </h2>
          <button
            onClick={onCerrar}
            className="text-[#6B6B6B] hover:text-texto transition-colors p-1 leading-none text-lg"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {pie && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-borde bg-superficie">
            {pie}
          </div>
        )}
      </div>
    </div>
  )
}
