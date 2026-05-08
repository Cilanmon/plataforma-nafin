'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Trash2, Upload, Check, X } from 'lucide-react'
import { Modal } from '@/componentes/comunes/Modal'
import { Boton } from '@/componentes/comunes/Boton'
import {
  suscribirActividadReciente,
  limpiarActividadAntigua,
  limpiarTodaActividad,
} from '@/servicios/baseDatos'
import type { Actividad, TipoAccion } from '@/tipos/actividad'

interface Props {
  cantidad?: number
  cargandoAuth: boolean
}

const ICONO: Record<TipoAccion, React.ReactNode> = {
  subida: <Upload size={11} />,
  aprobado: <Check size={13} />,
  rechazado: <X size={13} />,
}

const COLOR: Record<TipoAccion, string> = {
  subida: '#1A3A6B',
  aprobado: '#1A5C2A',
  rechazado: '#8B1A1A',
}

const VERBO: Record<TipoAccion, string> = {
  subida: 'subió',
  aprobado: 'aprobó',
  rechazado: 'rechazó',
}

function tiempoRelativo(fecha: Date): string {
  const seg = Math.floor((Date.now() - fecha.getTime()) / 1000)
  if (seg < 60) return 'hace un momento'
  const min = Math.floor(seg / 60)
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `hace ${d} d`
  return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const CLAVE_LIMPIEZA = 'actividad_limpiada_hoy'

export function CentroActividad({ cantidad = 20, cargandoAuth }: Props) {
  const [items, setItems] = useState<Actividad[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalLimpiar, setModalLimpiar] = useState(false)
  const [limpiando, setLimpiando] = useState(false)
  const limpiado = useRef(false)

  useEffect(() => {
    if (cargandoAuth) return
    const cancelar = suscribirActividadReciente(
      cantidad,
      (lista) => {
        setItems(lista)
        setCargando(false)
        setError(null)
      },
      (err) => {
        console.error('actividad onSnapshot:', err)
        setError('No se pudo cargar la actividad')
        setCargando(false)
      }
    )
    return cancelar
  }, [cantidad, cargandoAuth])

  // auto-limpieza de docs > 24 horas — una vez por sesión
  useEffect(() => {
    if (cargandoAuth || limpiado.current) return
    if (sessionStorage.getItem(CLAVE_LIMPIEZA)) return
    limpiado.current = true
    sessionStorage.setItem(CLAVE_LIMPIEZA, '1')
    limpiarActividadAntigua().catch((err) =>
      console.warn('auto-limpieza actividad falló:', err)
    )
  }, [cargandoAuth])

  const confirmarLimpiar = async () => {
    setLimpiando(true)
    try {
      await limpiarTodaActividad()
      setModalLimpiar(false)
    } catch (err) {
      console.error('error al limpiar actividad:', err)
    } finally {
      setLimpiando(false)
    }
  }

  return (
    <>
      <div className="panel">
        <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
          <h2 className="text-sm font-semibold text-texto">Actividad reciente</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#9B9B9B] tabular-nums">{items.length}</span>
            <button
              onClick={() => setModalLimpiar(true)}
              className="flex items-center gap-1 text-[10px] text-[#9B9B9B] hover:text-[#8B1A1A] transition-colors"
              title="Limpiar historial"
            >
              <Trash2 size={11} />
              Limpiar
            </button>
          </div>
        </div>

        {cargando ? (
          <p className="px-4 py-6 text-sm text-[#9B9B9B]">Cargando...</p>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-[#8B1A1A]">{error}</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[#9B9B9B]">No hay actividad reciente.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((a) => (
              <Link
                key={a.id}
                href={`/expedientes/${a.expedienteId}`}
                className="flex items-start gap-3 px-4 py-2.5 border-b border-borde last:border-b-0 hover:bg-superficie transition-colors"
              >
                <span
                  className="w-5 h-5 shrink-0 flex items-center justify-center text-white mt-0.5"
                  style={{ backgroundColor: COLOR[a.tipoAccion] }}
                >
                  {ICONO[a.tipoAccion]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-texto leading-snug">
                    <span className="font-semibold">{a.nombreUsuario}</span>{' '}
                    {VERBO[a.tipoAccion]}{' '}
                    <span className="font-medium">{a.nombreEvidencia}</span>
                    {' en '}
                    <span className="font-mono text-[10px] text-[#6B6B6B]">{a.nombreExpediente}</span>
                  </p>
                  <p className="text-[10px] text-[#9B9B9B] mt-0.5">{tiempoRelativo(a.fechaCreacion)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal
        abierto={modalLimpiar}
        titulo="Limpiar historial de actividad"
        onCerrar={() => setModalLimpiar(false)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModalLimpiar(false)}>Cancelar</Boton>
            <Boton variante="peligro" onClick={confirmarLimpiar} cargando={limpiando}>
              Limpiar todo
            </Boton>
          </>
        }
      >
        <p className="text-sm text-texto mb-1">¿Limpiar todo el historial de actividad?</p>
        <p className="text-xs text-[#6B6B6B]">Esta acción no se puede deshacer.</p>
      </Modal>
    </>
  )
}
