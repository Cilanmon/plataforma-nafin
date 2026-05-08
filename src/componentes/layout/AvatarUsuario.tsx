'use client'

import React from 'react'

interface Props {
  nombre: string
  fotoURL?: string | null
  tamaño?: number
}

export function AvatarUsuario({ nombre, fotoURL, tamaño = 36 }: Props) {
  const inicial = (nombre?.trim()?.[0] ?? '?').toUpperCase()
  const estilo = { width: tamaño, height: tamaño }

  if (fotoURL) {
    // <img> en lugar de next/image — la URL viene de Google y no está en next.config
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={fotoURL}
        alt={nombre}
        style={estilo}
        referrerPolicy="no-referrer"
        className="rounded-full object-cover border border-white/20"
      />
    )
  }

  return (
    <div
      style={estilo}
      className="rounded-full bg-white/15 text-white text-sm font-semibold flex items-center justify-center border border-white/20"
    >
      {inicial}
    </div>
  )
}
