'use client'

import { useState, useCallback } from 'react'
import { subirEvidencia as subirADrive } from '@/servicios/almacenamiento'
import { actualizarEvidencia, registrarActividad } from '@/servicios/baseDatos'
import { validarArchivo } from '@/utilidades/validaciones'

interface EstadoCarga {
  subiendo: boolean
  progreso: number
  error: string | null
}

interface AccionesCarga {
  subirEvidencia: (params: ParamsSubida) => Promise<void>
  limpiarError: () => void
}

interface ParamsSubida {
  archivo: File
  expedienteId: string
  evidenciaId: string
  carpetaId: string
  nombreArchivo: string
  subcarpeta?: string
  cargadoPor?: string
  nombreExpediente?: string
  nombreEvidencia?: string
  nombreUsuario?: string
}

export function useCarga(): EstadoCarga & AccionesCarga {
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const subirEvidencia = useCallback(async ({
    archivo,
    expedienteId,
    evidenciaId,
    carpetaId,
    nombreArchivo,
    subcarpeta,
    cargadoPor,
    nombreExpediente,
    nombreEvidencia,
    nombreUsuario,
  }: ParamsSubida): Promise<void> => {
    const validacion = validarArchivo(archivo)
    if (!validacion.valido) {
      setError(validacion.error ?? 'Archivo no válido')
      return
    }

    setSubiendo(true)
    setProgreso(10)
    setError(null)

    try {
      setProgreso(30)
      const resultado = await subirADrive(archivo, carpetaId, nombreArchivo, subcarpeta)
      setProgreso(75)

      await actualizarEvidencia(evidenciaId, {
        estado: 'cargado',
        fileId: resultado.fileId,
        urlDrive: resultado.url,
        nombreArchivo: resultado.nombre,
        fechaCarga: new Date(),
        cargadoPor: cargadoPor ?? 'desconocido',
      })

      // registra en el feed de actividad si vienen los metadatos
      if (nombreExpediente && nombreEvidencia && nombreUsuario) {
        try {
          await registrarActividad({
            expedienteId,
            nombreExpediente,
            tipoAccion: 'subida',
            nombreEvidencia,
            nombreUsuario,
            usuarioId: cargadoPor ?? 'desconocido',
            fechaCreacion: new Date(),
          })
        } catch (err) {
          console.warn('actividad no registrada:', err)
        }
      }

      setProgreso(100)
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al subir el archivo'
      setError(mensaje)
    } finally {
      setSubiendo(false)
    }
  }, [])

  const limpiarError = useCallback(() => {
    setError(null)
    setProgreso(0)
  }, [])

  return { subiendo, progreso, error, subirEvidencia, limpiarError }
}
