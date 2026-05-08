'use client'

import React, { useState } from 'react'
import { Boton } from '@/componentes/comunes/Boton'
import { PROGRAMAS } from '@/constantes/programas'
import type { Institucion } from '@/tipos/programa'
import { validarNombreEmpresa } from '@/utilidades/validaciones'

interface DatosFormulario {
  nombreEmpresa: string
  institucion: 'NF' | 'BX'
  programaId: string
  consultorId: string
}

interface PropiedadesFormulario {
  consultores: Array<{ id: string; nombre: string }>
  onSubmit: (datos: DatosFormulario) => Promise<void>
  onCancelar: () => void
  cargando?: boolean
}

const INSTITUCIONES: Array<{ valor: 'NF' | 'BX'; etiqueta: string }> = [
  { valor: 'NF', etiqueta: 'NAFIN' },
  { valor: 'BX', etiqueta: 'BANCOMEXT' },
]

export function FormularioExpediente({
  consultores,
  onSubmit,
  onCancelar,
  cargando = false,
}: PropiedadesFormulario) {
  const [datos, setDatos] = useState<DatosFormulario>({
    nombreEmpresa: '',
    institucion: 'NF',
    programaId: '',
    consultorId: '',
  })
  const [errores, setErrores] = useState<Partial<Record<keyof DatosFormulario, string>>>({})

  const programasFiltrados = PROGRAMAS.filter(
    (p) => p.institucion === datos.institucion || p.institucion === ('AMBOS' as Institucion)
  )

  const cambiar = (campo: keyof DatosFormulario, valor: string) => {
    setDatos((prev) => {
      const siguiente = { ...prev, [campo]: valor }
      // Resetear programa al cambiar institución
      if (campo === 'institucion') siguiente.programaId = ''
      return siguiente
    })
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  const validar = (): boolean => {
    const nuevosErrores: Partial<Record<keyof DatosFormulario, string>> = {}

    const valNombre = validarNombreEmpresa(datos.nombreEmpresa)
    if (!valNombre.valido) nuevosErrores.nombreEmpresa = valNombre.error

    if (!datos.programaId) nuevosErrores.programaId = 'Selecciona un programa'
    if (!datos.consultorId) nuevosErrores.consultorId = 'Asigna un consultor'

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validar()) return
    await onSubmit(datos)
  }

  const claseInput = (campo: keyof DatosFormulario) =>
    [
      'w-full border px-3 py-2 text-sm text-texto bg-white',
      'focus:outline-none focus:ring-1 focus:ring-primario',
      errores[campo] ? 'border-[#8B1A1A]' : 'border-borde',
    ].join(' ')

  return (
    <form onSubmit={manejarSubmit} noValidate>
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-texto mb-1.5 uppercase tracking-wide">
            Nombre de la empresa <span className="text-[#8B1A1A]">*</span>
          </label>
          <input
            type="text"
            value={datos.nombreEmpresa}
            onChange={(e) => cambiar('nombreEmpresa', e.target.value)}
            className={claseInput('nombreEmpresa')}
            placeholder="Razón social de la empresa"
          />
          {errores.nombreEmpresa && (
            <p className="text-xs text-[#8B1A1A] mt-1">{errores.nombreEmpresa}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-texto mb-1.5 uppercase tracking-wide">
            Institución <span className="text-[#8B1A1A]">*</span>
          </label>
          <div className="flex gap-3">
            {INSTITUCIONES.map((inst) => (
              <label
                key={inst.valor}
                className={[
                  'flex items-center gap-2 border px-4 py-2 text-sm cursor-pointer flex-1 justify-center',
                  datos.institucion === inst.valor
                    ? 'border-primario bg-[#E8F2ED] text-primario font-semibold'
                    : 'border-borde text-texto hover:bg-superficie',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="institucion"
                  value={inst.valor}
                  checked={datos.institucion === inst.valor}
                  onChange={(e) => cambiar('institucion', e.target.value)}
                  className="sr-only"
                />
                {inst.etiqueta}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-texto mb-1.5 uppercase tracking-wide">
            Programa <span className="text-[#8B1A1A]">*</span>
          </label>
          <select
            value={datos.programaId}
            onChange={(e) => cambiar('programaId', e.target.value)}
            className={claseInput('programaId')}
          >
            <option value="">-- Selecciona un programa --</option>
            {programasFiltrados.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.numeroSesiones} sesiones)
              </option>
            ))}
          </select>
          {errores.programaId && (
            <p className="text-xs text-[#8B1A1A] mt-1">{errores.programaId}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-texto mb-1.5 uppercase tracking-wide">
            Consultor asignado <span className="text-[#8B1A1A]">*</span>
          </label>
          <select
            value={datos.consultorId}
            onChange={(e) => cambiar('consultorId', e.target.value)}
            className={claseInput('consultorId')}
          >
            <option value="">-- Selecciona un consultor --</option>
            {consultores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {errores.consultorId && (
            <p className="text-xs text-[#8B1A1A] mt-1">{errores.consultorId}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-borde">
        <Boton variante="secundario" type="button" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton variante="primario" type="submit" cargando={cargando}>
          Crear expediente
        </Boton>
      </div>
    </form>
  )
}
