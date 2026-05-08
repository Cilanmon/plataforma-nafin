'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { crearComentario, suscribirComentarios, eliminarComentario } from '@/servicios/baseDatos'
import type { Comentario } from '@/tipos/comentario'

interface Params {
  expedienteId: string
  autorId: string
  nombreAutor: string
  rol: 'gestor' | 'consultor'
  cargandoAuth: boolean
}

interface Estado {
  comentarios: Comentario[]
  cargando: boolean
  guardando: boolean
  error: string | null
}

interface Acciones {
  agregar: (texto: string, evidenciaId?: string | null, nombreEvidencia?: string) => Promise<void>
  eliminar: (comentarioId: string) => Promise<void>
  limpiarError: () => void
}

export function useComentarios({
  expedienteId,
  autorId,
  nombreAutor,
  rol,
  cargandoAuth,
}: Params): Estado & Acciones {
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ref para evitar listeners duplicados de onSnapshot
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!expedienteId || !autorId || cargandoAuth) return

    // cancela listener anterior antes de crear uno nuevo
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }

    let activo = true

    const cancelar = suscribirComentarios(
      expedienteId,
      (nuevos) => {
        if (!activo) return
        setComentarios(nuevos)
        setCargando(false)
        setError(null)
      },
      (err) => {
        if (!activo) return
        console.error('comentarios onSnapshot:', err.message)
        setError('Error al cargar comentarios')
        setCargando(false)
      }
    )

    unsubRef.current = cancelar

    return () => {
      activo = false
      cancelar()
      unsubRef.current = null
    }
  }, [expedienteId, autorId, cargandoAuth])

  const agregar = useCallback(
    async (
      texto: string,
      evidenciaId: string | null = null,
      nombreEvidencia = 'General'
    ) => {
      const textLimpio = texto.trim()
      if (!textLimpio || !autorId) return
      setGuardando(true)
      setError(null)
      try {
        await crearComentario({
          expedienteId,
          evidenciaId,
          nombreEvidencia,
          texto: textLimpio,
          creadoPor: autorId,
          nombreAutor,
          rol,
          fechaCreacion: new Date(),
        })
      } catch {
        setError('Error al guardar el comentario')
      } finally {
        setGuardando(false)
      }
    },
    [expedienteId, autorId, nombreAutor, rol]
  )

  const eliminar = useCallback(async (comentarioId: string) => {
    try {
      await eliminarComentario(comentarioId)
    } catch {
      setError('Error al eliminar el comentario')
    }
  }, [])

  const limpiarError = useCallback(() => setError(null), [])

  return { comentarios, cargando, guardando, error, agregar, eliminar, limpiarError }
}
