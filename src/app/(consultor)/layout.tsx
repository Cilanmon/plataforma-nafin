'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderOpen, Menu } from 'lucide-react'
import { useAutenticacion } from '@/hooks/useAutenticacion'
import { BreadcrumbNavbar } from '@/componentes/layout/BreadcrumbNavbar'
import { AvatarMenu } from '@/componentes/layout/AvatarMenu'

const COLOR     = '#6B1A2A'
const SIDEBAR_W = 224

const NAV = [
  { href: '/mis-servicios', etiqueta: 'Mis servicios', icono: <FolderOpen size={15} /> },
]

export default function LayoutConsultor({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menu, setMenu] = useState(false)
  const { usuario, fotoURL, cerrarSesion } = useAutenticacion()
  const cerrar = () => setMenu(false)

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex"
        style={{ height: 52, backgroundColor: COLOR }}
      >
        <div
          className="hidden lg:flex items-center justify-center shrink-0 px-3"
          style={{ width: SIDEBAR_W, borderRight: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="COMPECER"
            style={{
              mixBlendMode: 'screen',
              height: 36,
              width: SIDEBAR_W - 24,
              objectFit: 'contain',
            }}
          />
        </div>

        <div className="flex-1 flex items-center gap-3 px-4 min-w-0">
          <button
            onClick={() => setMenu((v) => !v)}
            className="lg:hidden text-white/70 hover:text-white p-1 -ml-1 shrink-0"
          >
            <Menu size={18} />
          </button>

          <span className="text-white font-semibold whitespace-nowrap shrink-0" style={{ fontSize: 15 }}>
            Control de Servicios
          </span>

          <div className="hidden md:flex items-center gap-3 min-w-0 flex-1">
            <div className="w-px h-5 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
            <BreadcrumbNavbar />
          </div>

          <div className="flex-1 lg:hidden" />
          <AvatarMenu usuario={usuario} fotoURL={fotoURL} cerrarSesion={cerrarSesion} />
        </div>
      </header>

      <div
        className="flex"
        style={{ marginTop: 52, height: 'calc(100vh - 52px)' }}
      >
        <aside
          className="hidden lg:flex flex-col shrink-0 overflow-y-auto"
          style={{ width: SIDEBAR_W, backgroundColor: COLOR }}
        >
          <nav className="flex-1 px-2 py-4">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest select-none"
               style={{ color: 'rgba(255,255,255,0.35)' }}>
              Principal
            </p>
            {NAV.map((item) => {
              const ac = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} onClick={cerrar}
                  className="flex items-center gap-2.5 px-3 py-[9px] text-[13px] rounded-sm transition-colors"
                  style={{
                    color:           ac ? '#fff' : 'rgba(255,255,255,0.60)',
                    backgroundColor: ac ? 'rgba(255,255,255,0.10)' : undefined,
                    borderLeft:      ac ? '2px solid #fff' : '2px solid transparent',
                    fontWeight:      ac ? 600 : 400,
                  }}
                >
                  <span className="w-4 flex justify-center shrink-0">{item.icono}</span>
                  {item.etiqueta}
                </Link>
              )
            })}
          </nav>
        </aside>

        <aside
          className="lg:hidden fixed bottom-0 left-0 z-40 flex flex-col overflow-y-auto transition-transform duration-200"
          style={{
            top: 52,
            width: SIDEBAR_W,
            backgroundColor: COLOR,
            transform: menu ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <nav className="flex-1 px-2 py-4">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest select-none"
               style={{ color: 'rgba(255,255,255,0.35)' }}>
              Principal
            </p>
            {NAV.map((item) => {
              const ac = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} onClick={cerrar}
                  className="flex items-center gap-2.5 px-3 py-[9px] text-[13px] rounded-sm"
                  style={{
                    color:           ac ? '#fff' : 'rgba(255,255,255,0.60)',
                    backgroundColor: ac ? 'rgba(255,255,255,0.10)' : undefined,
                    borderLeft:      ac ? '2px solid #fff' : '2px solid transparent',
                    fontWeight:      ac ? 600 : 400,
                  }}
                >
                  <span className="w-4 flex justify-center shrink-0">{item.icono}</span>
                  {item.etiqueta}
                </Link>
              )
            })}
          </nav>
        </aside>

        {menu && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black/40"
               style={{ top: 52 }} onClick={cerrar} />
        )}

        <main className="flex-1 overflow-auto p-6 min-w-0">
          {children}
        </main>
      </div>
    </>
  )
}
