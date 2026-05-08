'use client'

import { useState, useEffect, useCallback } from 'react'
import { obtenerEvidencias, actualizarEstadoEvidencia } from '@/servicios/baseDatos'
import type { Evidencia, EstadoEvidencia } from '@/tipos/evidencia'

interface Estado {
  evidencias: Evidencia[]
  cargando: boolean
  error: string | null
  totalItems: number
  itemsAprobados: number
  porcentaje: number
  todasAprobadas: boolean
}

interface Acciones {
  recargar: () => Promise<void>
  aprobar: (evidenciaId: string, validadoPor: string, comentario?: string) => Promise<void>
  rechazar: (evidenciaId: string, comentario: string, validadoPor: string) => Promise<void>
  actualizarEstado: (evidenciaId: string, estado: EstadoEvidencia) => Promise<void>
}

export function useChecklist(expedienteId: string): Estado & Acciones {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    if (!expedienteId) return
    setCargando(true)
    setError(null)
    try {
      const data = await obtenerEvidencias(expedienteId)
      // ordena: fijos primero (sesion null), luego por sesión y orden
      const ordenadas = [...data].sort((a, b) => {
        if (a.sesion === null && b.sesion !== null) return -1
        if (a.sesion !== null && b.sesion === null) return 1
        return (a.sesion ?? 0) - (b.sesion ?? 0)
      })
      setEvidencias(ordenadas)
    } catch {
      setError('Error al cargar el checklist')
    } finally {
      setCargando(false)
    }
  }, [expedienteId])

  useEffect(() => {
    recargar()
  }, [recargar])

  const aprobar = useCallback(
    async (evidenciaId: string, validadoPor: string, comentario?: string) => {
      await actualizarEstadoEvidencia(evidenciaId, 'aprobado', comentario, validadoPor)
      setEvidencias((prev) =>
        prev.map((e) =>
          e.id === evidenciaId
            ? {
                ...e,
                estado: 'aprobado',
                fechaValidacion: new Date(),
                validadoPor,
                ...(comentario ? { comentarioRechazo: comentario } : {}),
              }
            : e
        )
      )
    },
    []
  )

  const rechazar = useCallback(
    async (evidenciaId: string, comentario: string, validadoPor: string) => {
      await actualizarEstadoEvidencia(evidenciaId, 'rechazado', comentario, validadoPor)
      setEvidencias((prev) =>
        prev.map((e) =>
          e.id === evidenciaId
            ? {
                ...e,
                estado: 'rechazado',
                comentarioRechazo: comentario,
                fechaValidacion: new Date(),
                validadoPor,
              }
            : e
        )
      )
    },
    []
  )

  const actualizarEstado = useCallback(
    async (evidenciaId: string, estado: EstadoEvidencia) => {
      await actualizarEstadoEvidencia(evidenciaId, estado)
      setEvidencias((prev) =>
        prev.map((e) => (e.id === evidenciaId ? { ...e, estado } : e))
      )
    },
    []
  )

  const totalItems = evidencias.length
  const itemsAprobados = evidencias.filter((e) => e.estado === 'aprobado').length
  const porcentaje = totalItems === 0 ? 0 : Math.round((itemsAprobados / totalItems) * 100)
  const todasAprobadas = totalItems > 0 && itemsAprobados === totalItems

  return {
    evidencias,
    cargando,
    error,
    totalItems,
    itemsAprobados,
    porcentaje,
    todasAprobadas,
    recargar,
    aprobar,
    rechazar,
    actualizarEstado,
  }
}
