'use client'

import React from 'react'
import Link from 'next/link'
import { useAutenticacion } from '@/hooks/useAutenticacion'
import { useExpedientes } from '@/hooks/useExpedientes'
import { Insignia } from '@/componentes/comunes/Insignia'
import { PROGRAMA_POR_ID } from '@/constantes/programas'
import { formatearFechaCorta } from '@/utilidades/formatos'
import type { EstadoExpediente } from '@/tipos/expediente'

// estados que indican que el servicio sigue en curso
const ESTADOS_ACTIVOS: EstadoExpediente[] = ['en_proceso', 'listo_para_envio']

// estados que indican que el servicio ya terminó (incluye los nuevos y los legacy)
const ESTADOS_HISTORICO: EstadoExpediente[] = [
  'enviado_institucion',
  'aprobado_institucion',
  'enviado',
  'cerrado',
]

export default function PaginaMisServicios() {
  const { usuario, cargando: cargandoAuth } = useAutenticacion()

  // filtra por usuario para no cargar expedientes ajenos
  const { expedientes, cargando: cargandoExp } = useExpedientes(
    usuario ? { consultorId: usuario.id } : undefined
  )

  const cargando = cargandoAuth || cargandoExp

  const activos = expedientes.filter((e) => ESTADOS_ACTIVOS.includes(e.estado))
  const historicos = expedientes.filter((e) => ESTADOS_HISTORICO.includes(e.estado))

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-[#6B6B6B] py-16">
        <span className="w-4 h-4 border-2 border-nafin border-t-transparent rounded-full animate-spin" />
        Cargando servicios...
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-texto">Mis servicios</h1>
        <p className="text-sm text-[#6B6B6B] mt-0.5">
          {activos.length} servicio{activos.length !== 1 ? 's' : ''} en curso
        </p>
      </div>

      {activos.length > 0 && (
        <section className="mb-8">
          <h2 className="seccion-titulo">En curso</h2>
          <div className="space-y-2">
            {activos.map((exp) => (
              <Link
                key={exp.id}
                href={`/mis-servicios/${exp.id}`}
                className="block bg-white border border-borde border-l-4 border-l-nafin px-4 py-3 hover:bg-superficie transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-texto truncate">
                        {exp.nombreEmpresa}
                      </span>
                      <Insignia tipo="expediente" estado={exp.estado} tamaño="sm" />
                    </div>
                    <p className="text-xs text-[#6B6B6B]">
                      {PROGRAMA_POR_ID[exp.programaId]?.nombre ?? exp.programaId}
                      {' · '}
                      <span className="font-mono">{exp.nombreCarpeta}</span>
                    </p>
                  </div>
                  <span className="text-xs text-[#9B9B9B] shrink-0">
                    {formatearFechaCorta(exp.fechaCreacion)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {historicos.length > 0 && (
        <section>
          <h2 className="seccion-titulo">Histórico</h2>
          <div className="space-y-2">
            {historicos.map((exp) => (
              <Link
                key={exp.id}
                href={`/mis-servicios/${exp.id}`}
                className="block bg-white border border-borde px-4 py-3 hover:bg-superficie transition-colors opacity-75"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-texto truncate">
                        {exp.nombreEmpresa}
                      </span>
                      <Insignia tipo="expediente" estado={exp.estado} tamaño="sm" />
                    </div>
                    <p className="text-xs text-[#6B6B6B]">
                      {PROGRAMA_POR_ID[exp.programaId]?.nombre ?? exp.programaId}
                    </p>
                  </div>
                  <span className="text-xs text-[#9B9B9B] shrink-0">
                    {formatearFechaCorta(exp.fechaCreacion)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {expedientes.length === 0 && (
        <div className="bg-white border border-borde py-16 text-center">
          <p className="text-[#9B9B9B] text-sm">
            No tienes servicios asignados actualmente
          </p>
        </div>
      )}
    </div>
  )
}
