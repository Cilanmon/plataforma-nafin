'use client'

import React from 'react'
import { Menu } from 'lucide-react'
import { BreadcrumbNavbar } from './BreadcrumbNavbar'
import { CampanaNotificaciones } from './CampanaNotificaciones'
import { AvatarMenu } from './AvatarMenu'
import type { Usuario } from '@/tipos/usuario'

interface Props {
  color: string
  usuario: Usuario | null
  fotoURL?: string | null
  cargandoAuth: boolean
  mostrarCampana?: boolean   // solo gestor
  cerrarSesion: () => void
  onAbrirMenu?: () => void
}

export function NavbarSuperior({
  color,
  usuario,
  fotoURL,
  cargandoAuth,
  mostrarCampana = false,
  cerrarSesion,
  onAbrirMenu,
}: Props) {
  return (
    <header
      className="h-[52px] flex items-center px-3 lg:px-4 gap-3 text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {onAbrirMenu && (
        <button
          onClick={onAbrirMenu}
          className="lg:hidden p-1.5 text-white/80 hover:text-white"
          aria-label="Menú"
        >
          <Menu size={18} />
        </button>
      )}

      <div className="flex items-center gap-3 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="COMPECER"
          className="h-10 w-auto object-contain shrink-0"
          style={{ mixBlendMode: 'screen', width: 48 }}
        />
        <span className="font-semibold whitespace-nowrap leading-tight text-[14px]">
          Control de Servicios
        </span>
      </div>

      <div className="flex items-center gap-3 flex-1 min-w-0 ml-4">
        <div className="w-px h-5 bg-white/25 shrink-0" />
        <BreadcrumbNavbar />
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {mostrarCampana && (
          <>
            <CampanaNotificaciones cargandoAuth={cargandoAuth} />
            <div className="w-px h-5 bg-white/20 mx-1" />
          </>
        )}
        <AvatarMenu usuario={usuario} fotoURL={fotoURL} cerrarSesion={cerrarSesion} />
      </div>
    </header>
  )
}
