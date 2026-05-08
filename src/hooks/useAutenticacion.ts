'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from 'firebase/auth'
import {
  iniciarSesionConGoogle,
  cerrarSesion as cerrarSesionFirebase,
  escucharSesion,
} from '@/servicios/autenticacion'
import {
  obtenerUsuario,
  obtenerUsuarioPendientePorCorreo,
  eliminarUsuarioPendiente,
  crearUsuario,
} from '@/servicios/baseDatos'
import type { Usuario } from '@/tipos/usuario'

interface EstadoAuth {
  usuario: Usuario | null
  fotoURL: string | null
  cargando: boolean
  error: string | null
}

interface AccionesAuth {
  iniciarSesion: () => Promise<void>
  cerrarSesion: () => Promise<void>
  limpiarError: () => void
}

// busca por UID; si no existe, migra desde usuariosPendientes por correo
async function resolverPerfil(firebaseUser: User): Promise<Usuario | null> {
  const directo = await obtenerUsuario(firebaseUser.uid)
  if (directo) return directo

  const correo = firebaseUser.email
  if (!correo) return null

  const pendiente = await obtenerUsuarioPendientePorCorreo(correo)
  if (!pendiente) return null

  const nuevo: Usuario = {
    id: firebaseUser.uid,
    nombre: pendiente.nombre || firebaseUser.displayName || correo,
    nombreCorto: pendiente.nombreCorto || pendiente.primerNombre || correo,
    primerNombre: pendiente.primerNombre,
    segundoNombre: pendiente.segundoNombre,
    primerApellido: pendiente.primerApellido,
    segundoApellido: pendiente.segundoApellido,
    correo: pendiente.correo,
    telefono: pendiente.telefono,
    rol: pendiente.rol,
    competencias: pendiente.competencias ?? [],
    activo: true,
    fechaAlta: pendiente.fechaAlta,
  }
  await crearUsuario(nuevo)
  await eliminarUsuarioPendiente(pendiente.correo)
  return nuevo
}

export function useAutenticacion(): EstadoAuth & AccionesAuth {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [fotoURL, setFotoURL] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cancelar = escucharSesion(async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        setUsuario(null)
        setFotoURL(null)
        setCargando(false)
        return
      }

      setFotoURL(firebaseUser.photoURL ?? null)

      try {
        const perfil = await resolverPerfil(firebaseUser)

        if (!perfil) {
          await cerrarSesionFirebase()
          document.cookie = 'nafin-rol=; path=/; max-age=0'
          setError('Tu cuenta no está registrada en el sistema. Contacta al administrador.')
          setUsuario(null)
          setCargando(false)
          return
        }

        if (!perfil.activo) {
          await cerrarSesionFirebase()
          document.cookie = 'nafin-rol=; path=/; max-age=0'
          setError('Tu cuenta está inactiva. Contacta al administrador.')
          setUsuario(null)
          setCargando(false)
          return
        }

        setUsuario(perfil)
        setError(null)
        document.cookie = `nafin-rol=${perfil.rol}; path=/; SameSite=Lax`
      } catch {
        setError('Error al verificar tu sesión. Intenta de nuevo.')
        setUsuario(null)
      } finally {
        setCargando(false)
      }
    })

    return cancelar
  }, [])

  const iniciarSesion = useCallback(async () => {
    setCargando(true)
    setError(null)

    try {
      await iniciarSesionConGoogle()
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('popup-closed')) {
        setCargando(false)
        return
      }
      setError('No se pudo iniciar sesión. Intenta de nuevo.')
      setCargando(false)
    }
  }, [])

  const cerrarSesion = useCallback(async () => {
    await cerrarSesionFirebase()
    document.cookie = 'nafin-rol=; path=/; max-age=0'
    setUsuario(null)
    router.push('/iniciar-sesion')
  }, [router])

  const limpiarError = useCallback(() => setError(null), [])

  return { usuario, fotoURL, cargando, error, iniciarSesion, cerrarSesion, limpiarError }
}
