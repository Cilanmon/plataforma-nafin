'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Users, Menu } from 'lucide-react'
import { useAutenticacion } from '@/hooks/useAutenticacion'
import { suscribirCargadasPendientes } from '@/servicios/baseDatos'
import { BreadcrumbNavbar } from '@/componentes/layout/BreadcrumbNavbar'
import { CampanaNotificaciones } from '@/componentes/layout/CampanaNotificaciones'
import { AvatarMenu } from '@/componentes/layout/AvatarMenu'

const COLOR      = '#1B4D35'
const SIDEBAR_W  = 224   // 14rem = w-56

interface ItemNav {
  href: string
  etiqueta: string
  icono: React.ReactNode
  badgeKey?: 'cargadas'
}

const PRINCIPAL: ItemNav[] = [
  { href: '/inicio',      etiqueta: 'Inicio',      icono: <LayoutDashboard size={15} /> },
  { href: '/expedientes', etiqueta: 'Expedientes',  icono: <FolderOpen size={15} />, badgeKey: 'cargadas' },
]
const ADMIN: ItemNav[] = [
  { href: '/administracion/consultores', etiqueta: 'Usuarios', icono: <Users size={15} /> },
]

function Grupo({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest select-none"
       style={{ color: 'rgba(255,255,255,0.35)' }}>
      {label}
    </p>
  )
}

function NavItem({ item, activo, badge, onClick }: {
  item: ItemNav; activo: boolean; badge?: number; onClick: () => void
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-[9px] text-[13px] rounded-sm transition-colors"
      style={{
        color:           activo ? '#fff' : 'rgba(255,255,255,0.60)',
        backgroundColor: activo ? 'rgba(255,255,255,0.10)' : undefined,
        borderLeft:      activo ? '2px solid #fff' : '2px solid transparent',
        fontWeight:      activo ? 600 : 400,
      }}
    >
      <span className="w-4 flex justify-center shrink-0">{item.icono}</span>
      <span className="flex-1 truncate">{item.etiqueta}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-bold bg-[#B91C1C] text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center tabular-nums">
          {badge}
        </span>
      )}
    </Link>
  )
}

export default function LayoutGestor({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const [menu, setMenu] = useState(false)
  const [cargadas, setCargadas] = useState(0)
  const { usuario, fotoURL, cargando: cargandoAuth, cerrarSesion } = useAutenticacion()

  useEffect(() => {
    if (cargandoAuth || !usuario) return
    return suscribirCargadasPendientes((n) => setCargadas(n))
  }, [cargandoAuth, usuario])

  const cerrar  = () => setMenu(false)
  const activo  = (href: string) =>
    pathname === href || (href !== '/inicio' && pathname.startsWith(href))

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

          <CampanaNotificaciones cargandoAuth={cargandoAuth} />
          <div className="w-px h-5 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.20)' }} />
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
          <nav className="flex-1 px-2 py-2">
            <Grupo label="Principal" />
            {PRINCIPAL.map((item) => (
              <NavItem key={item.href} item={item} activo={activo(item.href)}
                badge={item.badgeKey === 'cargadas' ? cargadas : undefined} onClick={cerrar} />
            ))}
            <Grupo label="Administración" />
            {ADMIN.map((item) => (
              <NavItem key={item.href} item={item} activo={activo(item.href)} onClick={cerrar} />
            ))}
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
          <nav className="flex-1 px-2 py-2">
            <Grupo label="Principal" />
            {PRINCIPAL.map((item) => (
              <NavItem key={item.href} item={item} activo={activo(item.href)}
                badge={item.badgeKey === 'cargadas' ? cargadas : undefined} onClick={cerrar} />
            ))}
            <Grupo label="Administración" />
            {ADMIN.map((item) => (
              <NavItem key={item.href} item={item} activo={activo(item.href)} onClick={cerrar} />
            ))}
          </nav>
        </aside>

        {menu && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/40"
            style={{ top: 52 }}
            onClick={cerrar}
          />
        )}

        <main className="flex-1 overflow-auto p-6 min-w-0">
          {children}
        </main>
      </div>
    </>
  )
}
