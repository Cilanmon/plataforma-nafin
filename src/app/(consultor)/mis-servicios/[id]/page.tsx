'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Insignia } from '@/componentes/comunes/Insignia'
import { BarraProgreso } from '@/componentes/inicio/BarraProgreso'
import { CargaArchivo } from '@/componentes/comunes/CargaArchivo'
import { SeccionHistorial } from '@/componentes/expedientes/SeccionHistorial'
import { useChecklist } from '@/hooks/useChecklist'
import { useAutenticacion } from '@/hooks/useAutenticacion'
import { obtenerExpediente } from '@/servicios/baseDatos'
import type { Expediente } from '@/tipos/expediente'
import type { Evidencia } from '@/tipos/evidencia'
import type { Usuario } from '@/tipos/usuario'
import { PROGRAMA_POR_ID } from '@/constantes/programas'
import { formatearFecha, formatearFechaCorta } from '@/utilidades/formatos'
import { ESTADOS_EVIDENCIA } from '@/constantes/estados'

interface FilaConsultorProps {
  evidencia: Evidencia
  expediente: Expediente
  usuario: Usuario | null
  puedeCargar: boolean
  onExito: () => void
}

function FilaConsultor({ evidencia, expediente, usuario, puedeCargar, onExito }: FilaConsultorProps) {
  const cfg = ESTADOS_EVIDENCIA[evidencia.estado]

  const subcarpeta =
    evidencia.sesion === null
      ? 'generales'
      : `sesion-${String(evidencia.sesion).padStart(2, '0')}`

  const esRechazado = evidencia.estado === 'rechazado'
  const tieneArchivo = evidencia.estado === 'cargado' || evidencia.estado === 'aprobado'

  return (
    <div className="border-b border-borde last:border-b-0 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: cfg.color }}
        />

        <span className="flex-1 min-w-0 text-sm font-medium text-texto">
          {evidencia.nombre}
          {evidencia.sesion !== null && (
            <span className="text-[10px] text-[#9B9B9B] ml-1 tabular-nums">
              S.{String(evidencia.sesion).padStart(2, '0')}
            </span>
          )}
        </span>

        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 border shrink-0"
          style={{ color: cfg.color, backgroundColor: cfg.fondo, borderColor: cfg.color + '40' }}
        >
          {cfg.etiqueta}
        </span>
      </div>

      {esRechazado && evidencia.comentarioRechazo && (
        <p className="mt-0.5 pl-4 text-xs text-[#8B1A1A]">
          {evidencia.comentarioRechazo}
        </p>
      )}

      {puedeCargar && (evidencia.estado === 'pendiente' || evidencia.estado === 'rechazado') && (
        <div className="mt-2 pl-4">
          <CargaArchivo
            evidenciaId={evidencia.id}
            expedienteId={expediente.id}
            carpetaId={expediente.carpetaDriveId}
            subcarpeta={subcarpeta}
            nombreArchivo={evidencia.nombreArchivo}
            estado={evidencia.estado}
            nombreArchivoActual={evidencia.nombreArchivo}
            urlDrive={evidencia.urlDrive}
            cargadoPor={usuario?.id}
            nombreExpediente={expediente.nombreCarpeta}
            nombreEvidencia={evidencia.nombre}
            nombreUsuario={usuario?.nombreCorto || usuario?.nombre}
            onExito={onExito}
          />
        </div>
      )}

      {tieneArchivo && evidencia.urlDrive && (
        <div className="mt-0.5 pl-4 flex items-center gap-2 flex-wrap">
          <a
            href={evidencia.urlDrive}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primario underline hover:no-underline font-mono"
          >
            {evidencia.nombreArchivo ?? 'archivo'}
          </a>
          {evidencia.fechaCarga && (
            <>
              <span className="text-[10px] text-[#9B9B9B]">·</span>
              <span className="text-[10px] text-[#6B6B6B]">
                Cargado {formatearFechaCorta(evidencia.fechaCarga)}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function PaginaMiServicio() {
  const { id } = useParams<{ id: string }>()
  const { usuario, cargando: cargandoAuth } = useAutenticacion()
  const [expediente, setExpediente] = useState<Expediente | null>(null)
  const [cargandoExpediente, setCargandoExpediente] = useState(true)

  const {
    evidencias,
    cargando: cargandoEvidencias,
    totalItems,
    itemsAprobados,
    porcentaje,
    recargar,
  } = useChecklist(id)

  useEffect(() => {
    obtenerExpediente(id)
      .then(setExpediente)
      .finally(() => setCargandoExpediente(false))
  }, [id])

  const programa = expediente ? PROGRAMA_POR_ID[expediente.programaId] : null
  const puedeCargar = expediente?.estado !== 'cerrado' && expediente?.estado !== 'enviado'

  const fijas = evidencias.filter((e) => e.sesion === null)
  const sesiones = Array.from(
    new Set(evidencias.filter((e) => e.sesion !== null).map((e) => e.sesion))
  ).sort((a, b) => (a ?? 0) - (b ?? 0))

  const colorContadorSesion = (items: Evidencia[]) => {
    if (items.every((e) => e.estado === 'aprobado')) return '#1A5C2A'
    if (items.some((e) => e.estado === 'rechazado')) return '#8B1A1A'
    return '#9B9B9B'
  }

  if (cargandoExpediente) {
    return (
      <div className="flex items-center gap-2 text-[#6B6B6B] py-16">
        <span className="w-4 h-4 border-2 border-nafin border-t-transparent rounded-full animate-spin" />
        Cargando...
      </div>
    )
  }

  if (!expediente) {
    return (
      <div className="py-16 text-center">
        <p className="text-[#6B6B6B]">Servicio no encontrado</p>
        <Link href="/mis-servicios" className="text-sm text-nafin underline mt-2 inline-block">
          Volver a mis servicios
        </Link>
      </div>
    )
  }

  return (
    <div>
      <nav className="flex items-center gap-2 text-xs text-[#6B6B6B] mb-6">
        <Link href="/mis-servicios" className="hover:text-texto">Mis servicios</Link>
        <span>/</span>
        <span className="text-texto font-medium">{expediente.nombreCarpeta}</span>
      </nav>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-lg font-bold text-texto">{expediente.nombreEmpresa}</h1>
          <Insignia tipo="expediente" estado={expediente.estado} />
        </div>
        <p className="text-xs font-mono text-[#6B6B6B]">{expediente.nombreCarpeta}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Programa', valor: programa?.nombre ?? '—' },
          { label: 'Sesiones', valor: String(programa?.numeroSesiones ?? '—') },
          { label: 'Inicio', valor: formatearFecha(expediente.fechaCreacion) },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-borde p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6B6B] mb-1">
              {item.label}
            </p>
            <p className="text-sm font-medium text-texto">{item.valor}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-borde p-4 mb-6">
        <BarraProgreso
          valor={itemsAprobados}
          total={totalItems}
          etiqueta="Evidencias aprobadas"
          altura="md"
        />
      </div>

      {!puedeCargar && (
        <div className="bg-[#EBEBEB] border border-borde px-4 py-3 text-sm text-[#6B6B6B] mb-4">
          Este expediente ya fue enviado y no acepta nuevas cargas.
        </div>
      )}

      <div className="bg-white border border-borde">
        <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
          <h2 className="text-sm font-semibold text-texto">Evidencias del servicio</h2>
          <button
            onClick={recargar}
            className="text-xs text-[#6B6B6B] hover:text-texto underline"
          >
            Actualizar
          </button>
        </div>

        {cargandoEvidencias ? (
          <div className="flex items-center gap-2 px-4 py-8 text-[#6B6B6B] text-sm">
            <span className="w-4 h-4 border-2 border-nafin border-t-transparent rounded-full animate-spin" />
            Cargando evidencias...
          </div>
        ) : (
          <div>
            {fijas.length > 0 && (
              <section>
                <div className="px-4 py-2 bg-[#F5F5F5] border-b border-borde flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
                    Documentos generales
                  </p>
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ color: colorContadorSesion(fijas) }}
                  >
                    {fijas.filter((e) => e.estado === 'aprobado').length}/{fijas.length}
                  </span>
                </div>
                {fijas.map((ev) => (
                  <FilaConsultor
                    key={ev.id}
                    evidencia={ev}
                    expediente={expediente}
                    usuario={usuario}
                    puedeCargar={!!puedeCargar}
                    onExito={recargar}
                  />
                ))}
              </section>
            )}

            {sesiones.map((sesion) => {
              const items = evidencias.filter((e) => e.sesion === sesion)
              const colorContador = colorContadorSesion(items)
              return (
                <section key={sesion}>
                  <div className="px-4 py-2 bg-[#F5F5F5] border-b border-borde flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
                      Sesión {String(sesion).padStart(2, '0')}
                    </p>
                    <span
                      className="text-[10px] font-semibold tabular-nums"
                      style={{ color: colorContador }}
                    >
                      {items.filter((e) => e.estado === 'aprobado').length}/{items.length}
                    </span>
                  </div>
                  {items.map((ev) => (
                    <FilaConsultor
                      key={ev.id}
                      evidencia={ev}
                      expediente={expediente}
                      usuario={usuario}
                      puedeCargar={!!puedeCargar}
                      onExito={recargar}
                    />
                  ))}
                </section>
              )
            })}
          </div>
        )}
      </div>

      {usuario && !cargandoAuth && (
        <SeccionHistorial expedienteId={id} usuario={usuario} cargandoAuth={cargandoAuth} />
      )}
    </div>
  )
}
