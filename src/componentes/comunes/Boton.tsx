'use client'

import React from 'react'

type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma'
type TamañoBoton = 'sm' | 'md' | 'lg'

interface PropiedadesBoton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton
  tamaño?: TamañoBoton
  cargando?: boolean
  icono?: React.ReactNode
  iconoDerecho?: React.ReactNode
}

const estilosVariante: Record<VarianteBoton, string> = {
  primario:
    'bg-primario text-white border-primario hover:bg-[#163f2b] active:bg-[#122e20]',
  secundario:
    'bg-white text-texto border-borde hover:bg-superficie active:bg-[#e8e8e8]',
  peligro:
    'bg-[#8B1A1A] text-white border-[#8B1A1A] hover:bg-[#701515] active:bg-[#5a1111]',
  fantasma:
    'bg-transparent text-primario border-transparent hover:bg-superficie active:bg-borde',
}

const estilosTamaño: Record<TamañoBoton, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}

export function Boton({
  variante = 'primario',
  tamaño = 'md',
  cargando = false,
  icono,
  iconoDerecho,
  children,
  disabled,
  className = '',
  ...props
}: PropiedadesBoton) {
  const estaDeshabilitado = disabled || cargando

  return (
    <button
      {...props}
      disabled={estaDeshabilitado}
      className={[
        'inline-flex items-center gap-2 border font-medium transition-colors duration-100',
        'focus:outline-none focus:ring-2 focus:ring-primario focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        estilosVariante[variante],
        estilosTamaño[tamaño],
        className,
      ].join(' ')}
    >
      {cargando ? (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icono
      )}
      {children}
      {!cargando && iconoDerecho}
    </button>
  )
}
