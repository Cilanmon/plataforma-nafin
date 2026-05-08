import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Control de Servicios NAFIN',
  description: 'Plataforma de gestión de evidencias — Asistencia Técnica NAFIN / BANCOMEXT',
}

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
