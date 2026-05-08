'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { TarjetaEstadistica } from '@/componentes/inicio/TarjetaEstadistica'
import { BarraProgreso } from '@/componentes/inicio/BarraProgreso'
import { Insignia } from '@/componentes/comunes/Insignia'
import { MiniProgreso } from '@/componentes/comunes/MiniProgreso'
import { CentroActividad } from '@/componentes/inicio/CentroActividad'
import { useAutenticacion } from '@/hooks/useAutenticacion'
import { FileText, Loader2, Send, CheckCircle2 } from 'lucide-react'
import {
  obtenerExpedientes,
  obtenerExpedientesRecientes,
  obtenerTodasEvidencias,
  obtenerConsultoresRegistrados,
} from '@/servicios/baseDatos'
import type { Expediente } from '@/tipos/expediente'
import type { Evidencia } from '@/tipos/evidencia'
import type { Usuario } from '@/tipos/usuario'
import { PROGRAMA_POR_ID } from '@/constantes/programas'
import { formatearFechaCorta } from '@/utilidades/formatos'

interface Conteos {
  total: number
  en_proceso: number
  listo_para_envio: number
  enviado_institucion: number
  aprobado_institucion: number
}

const ESTADOS_ACTIVOS = new Set(['en_proceso', 'listo_para_envio', 'enviado_institucion'])
const DIAS_SIN_MOVIMIENTO = 7

export default function PaginaInicio() {
  const { cargando: cargandoAuth } = useAutenticacion()
  const [conteos, setConteos] = useState<Conteos>({
    total: 0,
    en_proceso: 0,
    listo_para_envio: 0,
    enviado_institucion: 0,
    aprobado_institucion: 0,
  })
  const [expedientes, setExpedientes] = useState<Expediente[]>([])
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [consultores, setConsultores] = useState<Usuario[]>([])
  const [recientes, setRecientes] = useState<Expediente[]>([])
  const [porPrograma, setPorPrograma] = useState<Array<{ nombre: string; total: number }>>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const [todos, ultimosRecientes, todasEv, listaCons] = await Promise.all([
        obtenerExpedientes(),
        obtenerExpedientesRecientes(5),
        obtenerTodasEvidencias().catch(() => [] as Evidencia[]),
        obtenerConsultoresRegistrados().catch(() => [] as Usuario[]),
      ])

      setExpedientes(todos)
      setEvidencias(todasEv)
      setConsultores(listaCons)

      setConteos({
        total: todos.length,
        en_proceso: todos.filter((e) => e.estado === 'en_proceso').length,
        listo_para_envio: todos.filter((e) => e.estado === 'listo_para_envio').length,
        enviado_institucion: todos.filter((e) => e.estado === 'enviado_institucion' || e.estado === 'enviado').length,
        aprobado_institucion: todos.filter((e) => e.estado === 'aprobado_institucion' || e.estado === 'cerrado').length,
      })
      setRecientes(ultimosRecientes)

      const mapa = new Map<string, number>()
      todos.forEach((e) => mapa.set(e.programaId, (mapa.get(e.programaId) ?? 0) + 1))
      setPorPrograma(
        Array.from(mapa.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id, total]) => ({ nombre: PROGRAMA_POR_ID[id]?.nombre ?? id, total }))
      )
      setCargando(false)
    }
    cargar()
  }, [])

  const nombreConsultor = (id: string) =>
    consultores.find((c) => c.id === id)?.nombre ?? '—'

  const evidenciasPorExp = useMemo(() => {
    const mapa = new Map<string, Evidencia[]>()
    evidencias.forEach((ev) => {
      const arr = mapa.get(ev.expedienteId) ?? []
      arr.push(ev)
      mapa.set(ev.expedienteId, arr)
    })
    return mapa
  }, [evidencias])

  const requierenAtencion = useMemo(() => {
    return expedientes
      .filter((e) => ESTADOS_ACTIVOS.has(e.estado))
      .map((e) => {
        const evs = evidenciasPorExp.get(e.id) ?? []
        return { exp: e, rechazadas: evs.filter((ev) => ev.estado === 'rechazado').length }
      })
      .filter((x) => x.rechazadas > 0)
      .sort((a, b) => b.rechazadas - a.rechazadas)
  }, [expedientes, evidenciasPorExp])

  const sinMovimiento = useMemo(() => {
    const ahora = Date.now()
    const limite = DIAS_SIN_MOVIMIENTO * 24 * 60 * 60 * 1000
    return expedientes
      .filter((e) => e.estado === 'en_proceso')
      .map((e) => {
        const evs = evidenciasPorExp.get(e.id) ?? []
        // toma la fecha más reciente entre cargas y validaciones
        const fechas: number[] = []
        evs.forEach((ev) => {
          if (ev.fechaCarga) fechas.push(ev.fechaCarga.getTime())
          if (ev.fechaValidacion) fechas.push(ev.fechaValidacion.getTime())
        })
        const ultima = fechas.length ? Math.max(...fechas) : e.fechaCreacion.getTime()
        const dias = Math.floor((ahora - ultima) / (24 * 60 * 60 * 1000))
        return { exp: e, dias, ultima }
      })
      .filter((x) => ahora - x.ultima > limite)
      .sort((a, b) => b.dias - a.dias)
  }, [expedientes, evidenciasPorExp])

  const progresoConsultores = useMemo(() => {
    return consultores
      .filter((c) => c.activo)
      .map((c) => {
        const expsConsultor = expedientes.filter(
          (e) => e.consultorId === c.id && ESTADOS_ACTIVOS.has(e.estado)
        )
        let total = 0
        let aprobadas = 0
        expsConsultor.forEach((e) => {
          const evs = evidenciasPorExp.get(e.id) ?? []
          total += evs.length
          aprobadas += evs.filter((ev) => ev.estado === 'aprobado').length
        })
        return {
          consultor: c,
          expedientesActivos: expsConsultor.length,
          total,
          aprobadas,
        }
      })
      .filter((x) => x.expedientesActivos > 0)
      .sort((a, b) => b.expedientesActivos - a.expedientesActivos)
  }, [consultores, expedientes, evidenciasPorExp])

  const val = (n: number) => (cargando ? '—' : n)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-texto">Panel de control</h1>
        <p className="text-sm text-[#6B6B6B] mt-0.5">Resumen general de asistencia técnica</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <TarjetaEstadistica titulo="Total expedientes" valor={val(conteos.total)} color="primario" icono={<FileText size={22} />} />
        <TarjetaEstadistica titulo="En proceso" valor={val(conteos.en_proceso)} color="acento" icono={<Loader2 size={22} />}
          descripcion="Con actividad reciente" />
        <TarjetaEstadistica titulo="Enviados" valor={val(conteos.enviado_institucion)} color="primario" icono={<Send size={22} />}
          descripcion="Enviados a institución" />
        <TarjetaEstadistica titulo="Aprobados" valor={val(conteos.aprobado_institucion)} color="neutro" icono={<CheckCircle2 size={22} />}
          descripcion="Aprobados por institución" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="panel">
          <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
            <h2 className="text-sm font-semibold text-texto">Requieren atención</h2>
            <span className="text-xs text-[#9B9B9B] tabular-nums">{requierenAtencion.length}</span>
          </div>
          {cargando ? (
            <p className="px-4 py-6 text-sm text-[#9B9B9B]">Cargando...</p>
          ) : requierenAtencion.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[#9B9B9B]">Ningún expediente con evidencias rechazadas.</p>
          ) : (
            <div>
              {requierenAtencion.slice(0, 6).map(({ exp, rechazadas }) => (
                <Link
                  key={exp.id}
                  href={`/expedientes/${exp.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 border-b border-borde last:border-b-0 hover:bg-superficie transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-texto truncate group-hover:text-primario">
                      {exp.nombreEmpresa}
                    </p>
                    <p className="text-xs text-[#6B6B6B]">{nombreConsultor(exp.consultorId)}</p>
                  </div>
                  <span
                    className="text-xs font-semibold tabular-nums shrink-0 px-2 py-0.5 border"
                    style={{ color: '#8B1A1A', borderColor: '#8B1A1A40', backgroundColor: '#FDECEA' }}
                  >
                    {rechazadas} rechazada{rechazadas === 1 ? '' : 's'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
            <h2 className="text-sm font-semibold text-texto">Sin movimiento ({DIAS_SIN_MOVIMIENTO}+ días)</h2>
            <span className="text-xs text-[#9B9B9B] tabular-nums">{sinMovimiento.length}</span>
          </div>
          {cargando ? (
            <p className="px-4 py-6 text-sm text-[#9B9B9B]">Cargando...</p>
          ) : sinMovimiento.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[#9B9B9B]">Todos los expedientes activos tienen actividad reciente.</p>
          ) : (
            <div>
              {sinMovimiento.slice(0, 6).map(({ exp, dias }) => (
                <Link
                  key={exp.id}
                  href={`/expedientes/${exp.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 border-b border-borde last:border-b-0 hover:bg-superficie transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-texto truncate group-hover:text-primario">
                      {exp.nombreEmpresa}
                    </p>
                    <p className="text-xs text-[#6B6B6B]">{nombreConsultor(exp.consultorId)}</p>
                  </div>
                  <span className="text-xs text-[#8B6914] font-semibold shrink-0 tabular-nums">
                    {dias} día{dias === 1 ? '' : 's'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel mb-6">
        <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
          <h2 className="text-sm font-semibold text-texto">Progreso por consultor</h2>
          <span className="text-xs text-[#9B9B9B] tabular-nums">{progresoConsultores.length} con carga activa</span>
        </div>
        {cargando ? (
          <p className="px-4 py-6 text-sm text-[#9B9B9B]">Cargando...</p>
        ) : progresoConsultores.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[#9B9B9B]">Ningún consultor con expedientes activos.</p>
        ) : (
          <div>
            {progresoConsultores.map(({ consultor, expedientesActivos, total, aprobadas }) => (
              <div
                key={consultor.id}
                className="px-4 py-3 border-b border-borde last:border-b-0"
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-texto truncate">{consultor.nombre}</p>
                    <p className="text-xs text-[#6B6B6B]">
                      {expedientesActivos} expediente{expedientesActivos === 1 ? '' : 's'} activo{expedientesActivos === 1 ? '' : 's'}
                    </p>
                  </div>
                  <MiniProgreso aprobadas={aprobadas} total={total} ancho="w-32" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="panel p-5">
          <h2 className="seccion-titulo">Distribución por estado</h2>
          {cargando ? (
            <p className="text-sm text-[#9B9B9B]">Cargando...</p>
          ) : conteos.total === 0 ? (
            <p className="text-sm text-[#9B9B9B]">Sin expedientes registrados</p>
          ) : (
            <div className="space-y-4">
              <BarraProgreso valor={conteos.en_proceso} total={conteos.total} etiqueta="En proceso" color="#8B6914" />
              <BarraProgreso valor={conteos.listo_para_envio} total={conteos.total} etiqueta="Listos para envío" color="#1B4D35" />
              <BarraProgreso valor={conteos.enviado_institucion} total={conteos.total} etiqueta="Enviados" color="#1A3A6B" />
              <BarraProgreso valor={conteos.aprobado_institucion} total={conteos.total} etiqueta="Aprobados" color="#1A5C2A" />
            </div>
          )}
        </div>

        <div className="panel p-5">
          <h2 className="seccion-titulo">Top programas</h2>
          {cargando ? (
            <p className="text-sm text-[#9B9B9B]">Cargando...</p>
          ) : porPrograma.length === 0 ? (
            <p className="text-sm text-[#9B9B9B]">Sin expedientes registrados</p>
          ) : (
            <div className="space-y-3">
              {porPrograma.map((p) => (
                <div key={p.nombre} className="flex items-center justify-between text-sm gap-4">
                  <span className="text-texto truncate">{p.nombre}</span>
                  <span className="font-semibold tabular-nums text-[#6B6B6B] shrink-0">{p.total} exp.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <CentroActividad cantidad={20} cargandoAuth={cargandoAuth} />
      </div>

      <div className="panel">
        <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
          <h2 className="text-sm font-semibold text-texto">Expedientes recientes</h2>
          <Link href="/expedientes" className="text-xs text-primario underline hover:no-underline">
            Ver todos
          </Link>
        </div>
        {cargando ? (
          <p className="px-4 py-6 text-sm text-[#9B9B9B]">Cargando...</p>
        ) : recientes.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-[#9B9B9B]">Sin expedientes todavía</p>
            <Link href="/expedientes/nuevo" className="text-sm text-primario underline mt-1 inline-block">
              Crear el primero
            </Link>
          </div>
        ) : (
          <div>
            {recientes.map((exp) => (
              <Link
                key={exp.id}
                href={`/expedientes/${exp.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 border-b border-borde last:border-b-0 hover:bg-superficie transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-texto truncate group-hover:text-primario transition-colors">
                    {exp.nombreEmpresa}
                  </p>
                  <p className="text-xs text-[#6B6B6B] font-mono">{exp.nombreCarpeta}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Insignia tipo="expediente" estado={exp.estado} tamaño="sm" />
                  <span className="text-xs text-[#9B9B9B]">{formatearFechaCorta(exp.fechaCreacion)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
