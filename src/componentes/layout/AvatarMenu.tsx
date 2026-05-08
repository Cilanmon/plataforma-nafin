'use client'

import React, { useEffect, useRef, useState } from 'react'
import { LogOut, User } from 'lucide-react'
import { Modal } from '@/componentes/comunes/Modal'
import { Boton } from '@/componentes/comunes/Boton'
import { AvatarUsuario } from './AvatarUsuario'
import type { Usuario } from '@/tipos/usuario'

interface Props {
  usuario: Usuario | null
  fotoURL?: string | null
  cerrarSesion: () => void
}

export function AvatarMenu({ usuario, fotoURL, cerrarSesion }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [modalPerfil, setModalPerfil] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    if (abierto) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [abierto])

  const nombre = usuario?.nombreCorto || usuario?.nombre || '—'
  const rol = usuario?.rol ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1) : ''

  return (
    <>
      <div ref={ref} className="relative flex items-center gap-2.5">
        <div className="text-right hidden sm:block leading-tight min-w-0">
          <p className="text-[13px] font-semibold text-white truncate max-w-[140px]">{nombre}</p>
          <p className="text-[10px] text-white/60 uppercase tracking-wide">{rol}</p>
        </div>

        <button
          onClick={() => setAbierto((v) => !v)}
          className="shrink-0"
          aria-label="Menú de usuario"
        >
          <AvatarUsuario nombre={nombre} fotoURL={fotoURL} tamaño={32} />
        </button>

        {abierto && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-borde shadow-lg z-50">
            <div className="px-3 py-2 border-b border-borde">
              <p className="text-xs font-semibold text-texto truncate">{usuario?.nombre || '—'}</p>
              <p className="text-[10px] text-[#6B6B6B] truncate">{usuario?.correo || ''}</p>
            </div>
            <button
              onClick={() => { setAbierto(false); setModalPerfil(true) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-texto hover:bg-superficie transition-colors"
            >
              <User size={13} />
              Ver perfil
            </button>
            <button
              onClick={() => { setAbierto(false); cerrarSesion() }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#8B1A1A] hover:bg-[#FDECEA] transition-colors border-t border-borde"
            >
              <LogOut size={13} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      <Modal
        abierto={modalPerfil}
        titulo="Mi perfil"
        onCerrar={() => setModalPerfil(false)}
        pie={<Boton variante="secundario" onClick={() => setModalPerfil(false)}>Cerrar</Boton>}
      >
        {usuario ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4 mb-4">
              <AvatarUsuario nombre={nombre} fotoURL={fotoURL} tamaño={56} />
              <div>
                <p className="font-semibold text-texto">{usuario.nombre}</p>
                <p className="text-xs text-[#6B6B6B]">{rol}</p>
              </div>
            </div>
            {[
              { label: 'Nombre corto', valor: usuario.nombreCorto || '—' },
              { label: 'Correo', valor: usuario.correo },
              { label: 'Teléfono', valor: usuario.telefono || '—' },
            ].map((item) => (
              <div key={item.label} className="flex gap-3">
                <p className="text-[10px] uppercase tracking-wide text-[#6B6B6B] w-24 shrink-0 pt-0.5">{item.label}</p>
                <p className="text-sm text-texto">{item.valor}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#9B9B9B]">No hay sesión activa.</p>
        )}
      </Modal>
    </>
  )
}
