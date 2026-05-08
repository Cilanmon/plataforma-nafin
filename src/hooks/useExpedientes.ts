'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  obtenerExpedientes,
  obtenerExpediente,
  crearExpediente,
  actualizarEstadoExpediente,
  contarExpedientes,
  crearEvidenciasExpediente,
} from '@/servicios/baseDatos'
import { crearCarpetaExpediente } from '@/servicios/almacenamiento'
import { generarIdEmpresa, generarNombreCarpeta, generarNombreArchivo } from '@/utilidades/nomenclatura'
import { PROGRAMA_POR_ID } from '@/constantes/programas'
import type { Expediente, EstadoExpediente } from '@/tipos/expediente'

export interface FiltrosExpedientes {
  consultorId?: string
  estado?: EstadoExpediente
}

export interface DatosNuevoExpediente {
  nombreEmpresa: string
  institucion: 'NF' | 'BX'
  programaId: string
  consultorId: string
  creadoPor: string
}

interface Estado {
  expedientes: Expediente[]
  cargando: boolean
  error: string | null
}

interface Acciones {
  recargar: () => Promise<void>
  cargarExpediente: (id: string) => Promise<Expediente | null>
  crearExpedienteCompleto: (datos: DatosNuevoExpediente) => Promise<string>
  cambiarEstado: (id: string, estado: EstadoExpediente) => Promise<void>
}

export function useExpedientes(filtros?: FiltrosExpedientes): Estado & Acciones {
  const [expedientes, setExpedientes] = useState<Expediente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await obtenerExpedientes(filtros)
      setExpedientes(data)
    } catch {
      setError('Error al cargar los expedientes')
    } finally {
      setCargando(false)
    }
  }, [filtros?.consultorId, filtros?.estado]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    recargar()
  }, [recargar])

  const cargarExpediente = useCallback(async (id: string) => {
    return obtenerExpediente(id)
  }, [])

  const crearExpedienteCompleto = useCallback(
    async (datos: DatosNuevoExpediente): Promise<string> => {
      console.log('[crearExpediente] inicio', datos)

      const programa = PROGRAMA_POR_ID[datos.programaId]
      if (!programa) throw new Error('Programa no encontrado')

      // genera nomenclatura
      console.log('[crearExpediente] contando expedientes existentes...')
      const total = await contarExpedientes()
      const idEmpresa = generarIdEmpresa(total)
      const nombreCarpeta = generarNombreCarpeta(programa.prefijo, idEmpresa)
      console.log('[crearExpediente] nomenclatura generada:', { idEmpresa, nombreCarpeta })

      // genera subcarpetas: una por sesión + una para documentos generales
      const subcarpetas = ['generales']
      for (let s = 1; s <= programa.numeroSesiones; s++) {
        subcarpetas.push(`sesion-${String(s).padStart(2, '0')}`)
      }

      // crea carpeta en Drive
      console.log('[crearExpediente] creando carpeta en Drive...', { nombreCarpeta, subcarpetas })
      const { carpetaId } = await crearCarpetaExpediente(nombreCarpeta, subcarpetas)
      console.log('[crearExpediente] carpeta creada:', carpetaId)

      // guarda expediente en Firestore
      console.log('[crearExpediente] guardando expediente en Firestore...')
      const expedienteId = await crearExpediente({
        idEmpresa,
        nombreEmpresa: datos.nombreEmpresa.trim(),
        institucion: datos.institucion,
        programaId: datos.programaId,
        consultorId: datos.consultorId,
        estado: 'en_proceso',
        carpetaDriveId: carpetaId,
        nombreCarpeta,
        fechaCreacion: new Date(),
        creadoPor: datos.creadoPor,
      })
      console.log('[crearExpediente] expediente guardado:', expedienteId)

      // genera evidencias del checklist en Firestore (batch)
      const evidenciasBase: Array<{
        expedienteId: string
        nombre: string
        slug: string
        sesion: number | null
        nombreArchivo: string
      }> = []

      // documentos fijos del programa
      programa.checklistFijo.forEach((item) => {
        evidenciasBase.push({
          expedienteId,
          nombre: item.nombre,
          slug: item.slug,
          sesion: null,
          nombreArchivo: generarNombreArchivo(programa.prefijo, idEmpresa, null, item.slug),
        })
      })

      // evidencias por sesión
      for (let sesion = 1; sesion <= programa.numeroSesiones; sesion++) {
        programa.checklistPorSesion.forEach((item) => {
          evidenciasBase.push({
            expedienteId,
            nombre: item.nombre,
            slug: item.slug,
            sesion,
            nombreArchivo: generarNombreArchivo(programa.prefijo, idEmpresa, sesion, item.slug),
          })
        })
      }

      console.log('[crearExpediente] creando', evidenciasBase.length, 'evidencias en Firestore...')
      await crearEvidenciasExpediente(evidenciasBase)
      console.log('[crearExpediente] ✓ completado. id:', expedienteId)

      return expedienteId
    },
    []
  )

  const cambiarEstado = useCallback(async (id: string, estado: EstadoExpediente) => {
    await actualizarEstadoExpediente(id, estado)
    setExpedientes((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, estado } : exp))
    )
  }, [])

  return { expedientes, cargando, error, recargar, cargarExpediente, crearExpedienteCompleto, cambiarEstado }
}
