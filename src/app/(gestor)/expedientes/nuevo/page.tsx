'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Boton } from '@/componentes/comunes/Boton'
import { useExpedientes, type DatosNuevoExpediente } from '@/hooks/useExpedientes'
import { useAutenticacion } from '@/hooks/useAutenticacion'
import { obtenerConsultoresRegistrados } from '@/servicios/baseDatos'
import { PROGRAMAS } from '@/constantes/programas'
import { validarNombreEmpresa } from '@/utilidades/validaciones'
import type { Usuario } from '@/tipos/usuario'
import type { Institucion } from '@/tipos/programa'

interface FormState {
  nombreEmpresa: string
  institucion: 'NF' | 'BX'
  programaId: string
  consultorId: string
}

type Errores = Partial<Record<keyof FormState, string>>

const INSTITUCIONES: Array<{ valor: 'NF' | 'BX'; etiqueta: string }> = [
  { valor: 'NF', etiqueta: 'NAFIN' },
  { valor: 'BX', etiqueta: 'BANCOMEXT' },
]

export default function PaginaNuevoExpediente() {
  const router = useRouter()
  const { usuario } = useAutenticacion()
  const { crearExpedienteCompleto } = useExpedientes()

  const [form, setForm] = useState<FormState>({
    nombreEmpresa: '',
    institucion: 'NF',
    programaId: '',
    consultorId: '',
  })
  const [errores, setErrores] = useState<Errores>({})
  // consultores activos con UID de Google (usado como consultorId)
  const [consultores, setConsultores] = useState<Usuario[]>([])
  const [guardando, setGuardando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [pasoActual, setPasoActual] = useState<string | null>(null)

  useEffect(() => {
    obtenerConsultoresRegistrados()
      .then(setConsultores)
      .catch((err) => {
        console.error('error cargando consultores:', err?.code, err?.message)
        setConsultores([])
      })
  }, [])

  const programasFiltrados = PROGRAMAS.filter(
    (p) => p.institucion === form.institucion || p.institucion === ('AMBOS' as Institucion)
  )

  const cambiar = (campo: keyof FormState, valor: string) => {
    setForm((prev) => {
      const siguiente = { ...prev, [campo]: valor }
      if (campo === 'institucion') {
        siguiente.programaId = ''
        siguiente.consultorId = ''
      }
      // al cambiar de programa, descarta consultor previo si ya no es competente
      if (campo === 'programaId') siguiente.consultorId = ''
      return siguiente
    })
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  // solo consultores con el programa seleccionado en sus competencias
  const consultoresFiltrados = form.programaId
    ? consultores.filter((c) => c.competencias?.includes(form.programaId))
    : consultores

  const validar = (): boolean => {
    const nuevos: Errores = {}
    const valNombre = validarNombreEmpresa(form.nombreEmpresa)
    if (!valNombre.valido) nuevos.nombreEmpresa = valNombre.error
    if (!form.programaId) nuevos.programaId = 'Selecciona un programa'
    if (!form.consultorId) nuevos.consultorId = 'Asigna un consultor'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validar()) return
    if (!usuario) { setErrorGlobal('Sesión no disponible'); return }

    setGuardando(true)
    setErrorGlobal(null)

    try {
      setPasoActual('Creando carpeta en Google Drive...')
      const datos: DatosNuevoExpediente = {
        nombreEmpresa: form.nombreEmpresa,
        institucion: form.institucion,
        programaId: form.programaId,
        consultorId: form.consultorId,
        creadoPor: usuario.id,
      }

      setPasoActual('Guardando expediente y generando checklist...')
      const expedienteId = await crearExpedienteCompleto(datos)

      router.push(`/expedientes/${expedienteId}`)
    } catch (err: unknown) {
      setErrorGlobal(err instanceof Error ? err.message : 'Error al crear el expediente')
      setPasoActual(null)
    } finally {
      setGuardando(false)
    }
  }

  const claseInput = (campo: keyof FormState) =>
    `campo-input ${errores[campo] ? 'border-[#8B1A1A]' : ''}`

  return (
    <div className="max-w-2xl">
      <nav className="flex items-center gap-2 text-xs text-[#6B6B6B] mb-6">
        <Link href="/expedientes" className="hover:text-texto">Expedientes</Link>
        <span>/</span>
        <span className="text-texto">Nuevo expediente</span>
      </nav>

      <h1 className="text-lg font-bold text-texto mb-6">Nuevo expediente</h1>

      {errorGlobal && (
        <div className="bg-[#FDECEA] border border-[#8B1A1A]/30 px-4 py-3 text-sm text-[#8B1A1A] mb-5">
          {errorGlobal}
        </div>
      )}

      <div className="bg-white border border-borde p-6">
        <form onSubmit={manejarSubmit} noValidate>
          <div className="space-y-5">
            <div className="campo-grupo">
              <label className="campo-label">
                Nombre de la empresa <span className="text-[#8B1A1A]">*</span>
              </label>
              <input
                type="text"
                value={form.nombreEmpresa}
                onChange={(e) => cambiar('nombreEmpresa', e.target.value)}
                className={claseInput('nombreEmpresa')}
                placeholder="Razón social de la empresa"
                disabled={guardando}
              />
              {errores.nombreEmpresa && (
                <p className="text-xs text-[#8B1A1A]">{errores.nombreEmpresa}</p>
              )}
            </div>

            <div className="campo-grupo">
              <label className="campo-label">
                Institución <span className="text-[#8B1A1A]">*</span>
              </label>
              <div className="flex gap-3">
                {INSTITUCIONES.map((inst) => (
                  <label
                    key={inst.valor}
                    className={[
                      'flex items-center gap-2 border px-4 py-2.5 text-sm cursor-pointer flex-1 justify-center',
                      guardando ? 'opacity-50 cursor-not-allowed' : '',
                      form.institucion === inst.valor
                        ? 'border-primario bg-[#E8F2ED] text-primario font-semibold'
                        : 'border-borde text-texto hover:bg-superficie',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="institucion"
                      value={inst.valor}
                      checked={form.institucion === inst.valor}
                      onChange={(e) => cambiar('institucion', e.target.value)}
                      className="sr-only"
                      disabled={guardando}
                    />
                    {inst.etiqueta}
                  </label>
                ))}
              </div>
            </div>

            <div className="campo-grupo">
              <label className="campo-label">
                Programa <span className="text-[#8B1A1A]">*</span>
              </label>
              <select
                value={form.programaId}
                onChange={(e) => cambiar('programaId', e.target.value)}
                className={claseInput('programaId')}
                disabled={guardando}
              >
                <option value="">-- Selecciona un programa --</option>
                {programasFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} · {p.numeroSesiones} sesiones
                  </option>
                ))}
              </select>
              {errores.programaId && (
                <p className="text-xs text-[#8B1A1A]">{errores.programaId}</p>
              )}
            </div>

            <div className="campo-grupo">
              <label className="campo-label">
                Consultor asignado <span className="text-[#8B1A1A]">*</span>
              </label>
              <select
                value={form.consultorId}
                onChange={(e) => cambiar('consultorId', e.target.value)}
                className={claseInput('consultorId')}
                disabled={guardando || !form.programaId}
              >
                <option value="">
                  {form.programaId ? '-- Selecciona un consultor --' : '-- Selecciona primero un programa --'}
                </option>
                {consultoresFiltrados.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {errores.consultorId && (
                <p className="text-xs text-[#8B1A1A]">{errores.consultorId}</p>
              )}
              {form.programaId && consultoresFiltrados.length === 0 && (
                <p className="text-xs text-[#8B1A1A]">
                  No hay consultores con competencia en este programa.
                </p>
              )}
              {!form.programaId && consultores.length === 0 && (
                <p className="text-xs text-[#9B9B9B]">
                  No hay consultores con cuenta activa.
                </p>
              )}
            </div>
          </div>

          {guardando && pasoActual && (
            <div className="mt-5 flex items-center gap-2 text-sm text-[#6B6B6B]">
              <span className="inline-block w-3.5 h-3.5 border-2 border-primario border-t-transparent rounded-full animate-spin shrink-0" />
              {pasoActual}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-borde">
            <Boton
              variante="secundario"
              type="button"
              onClick={() => router.push('/expedientes')}
              disabled={guardando}
            >
              Cancelar
            </Boton>
            <Boton variante="primario" type="submit" cargando={guardando}>
              Crear expediente
            </Boton>
          </div>
        </form>
      </div>
    </div>
  )
}
