'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Boton } from '@/componentes/comunes/Boton'
import { Tabla, type ColumnaTabla } from '@/componentes/comunes/Tabla'
import { Insignia } from '@/componentes/comunes/Insignia'
import { useExpedientes } from '@/hooks/useExpedientes'
import { obtenerConsultoresRegistrados, obtenerTodasEvidencias } from '@/servicios/baseDatos'
import type { Expediente, EstadoExpediente } from '@/tipos/expediente'
import type { Usuario } from '@/tipos/usuario'
import type { Evidencia } from '@/tipos/evidencia'
import { formatearFechaCorta } from '@/utilidades/formatos'
import { PROGRAMA_POR_ID } from '@/constantes/programas'
import { MiniProgreso } from '@/componentes/comunes/MiniProgreso'

const ESTADOS_FILTRO: Array<{ valor: EstadoExpediente | ''; etiqueta: string }> = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'en_proceso', etiqueta: 'En proceso' },
  { valor: 'listo_para_envio', etiqueta: 'Listos para envío' },
  { valor: 'enviado_institucion', etiqueta: 'Enviados' },
  { valor: 'aprobado_institucion', etiqueta: 'Aprobados' },
]

const INSTITUCIONES_FILTRO = [
  { valor: '', etiqueta: 'Todas las instituciones' },
  { valor: 'NF', etiqueta: 'NAFIN' },
  { valor: 'BX', etiqueta: 'BANCOMEXT' },
]

export default function PaginaExpedientes() {
  const router = useRouter()
  const { expedientes, cargando, recargar } = useExpedientes()
  // consultores desde usuarios (id = Google UID, coincide con consultorId)
  const [consultores, setConsultores] = useState<Usuario[]>([])
  const [evidencias, setEvidencias] = useState<Evidencia[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoExpediente | ''>('')
  const [filtroInstitucion, setFiltroInstitucion] = useState<'NF' | 'BX' | ''>('')
  const [filtroConsultor, setFiltroConsultor] = useState('')

  useEffect(() => {
    obtenerConsultoresRegistrados()
      .then(setConsultores)
      .catch((err) => {
        console.error('error cargando consultores:', err?.code, err?.message)
        setConsultores([])
      })
    // una sola query — todas las evidencias para calcular progreso por fila
    obtenerTodasEvidencias()
      .then(setEvidencias)
      .catch((err) => {
        console.error('error cargando evidencias:', err?.code, err?.message)
        setEvidencias([])
      })
  }, [])

  // agrupa evidencias por expedienteId — una sola pasada
  const progresoPorExpediente = React.useMemo(() => {
    const mapa = new Map<string, { total: number; aprobadas: number; rechazadas: number }>()
    evidencias.forEach((ev) => {
      const e = mapa.get(ev.expedienteId) ?? { total: 0, aprobadas: 0, rechazadas: 0 }
      e.total += 1
      if (ev.estado === 'aprobado') e.aprobadas += 1
      if (ev.estado === 'rechazado') e.rechazadas += 1
      mapa.set(ev.expedienteId, e)
    })
    return mapa
  }, [evidencias])

  const expedientesFiltrados = expedientes.filter((e) => {
    const termino = busqueda.toLowerCase()
    const coincideBusqueda =
      !busqueda ||
      e.nombreEmpresa.toLowerCase().includes(termino) ||
      e.nombreCarpeta.toLowerCase().includes(termino)

    return (
      coincideBusqueda &&
      (!filtroEstado || e.estado === filtroEstado) &&
      (!filtroInstitucion || e.institucion === filtroInstitucion) &&
      (!filtroConsultor || e.consultorId === filtroConsultor)
    )
  })

  const nombreConsultor = (id: string) => {
    const c = consultores.find((x) => x.id === id)
    return c?.nombreCorto || c?.nombre || '—'
  }

  const columnas: ColumnaTabla<Expediente>[] = [
    {
      clave: 'carpeta',
      cabecera: 'Carpeta',
      ancho: 'w-36',
      render: (e) => (
        <span className="font-mono text-xs text-[#6B6B6B]">{e.nombreCarpeta}</span>
      ),
    },
    {
      clave: 'empresa',
      cabecera: 'Empresa',
      render: (e) => (
        <span className="font-medium text-texto">{e.nombreEmpresa}</span>
      ),
    },
    {
      clave: 'programa',
      cabecera: 'Programa',
      render: (e) => (
        <span className="text-sm text-[#6B6B6B]">
          {PROGRAMA_POR_ID[e.programaId]?.nombre ?? e.programaId}
        </span>
      ),
    },
    {
      clave: 'consultor',
      cabecera: 'Consultor',
      render: (e) => (
        <span className="text-sm text-[#6B6B6B]">{nombreConsultor(e.consultorId)}</span>
      ),
    },
    {
      clave: 'institucion',
      cabecera: 'Inst.',
      ancho: 'w-14',
      alineacion: 'centro',
      render: (e) => (
        <span
          className="text-xs font-bold"
          style={{ color: e.institucion === 'BX' ? '#1A3A6B' : '#6B1A2A' }}
        >
          {e.institucion}
        </span>
      ),
    },
    {
      clave: 'estado',
      cabecera: 'Estado',
      ancho: 'w-44',
      render: (e) => <Insignia tipo="expediente" estado={e.estado} tamaño="sm" />,
    },
    {
      clave: 'progreso',
      cabecera: 'Progreso',
      ancho: 'w-36',
      render: (e) => {
        const p = progresoPorExpediente.get(e.id) ?? { total: 0, aprobadas: 0, rechazadas: 0 }
        return <MiniProgreso aprobadas={p.aprobadas} total={p.total} rechazadas={p.rechazadas} />
      },
    },
    {
      clave: 'fechaInicio',
      cabecera: 'F. inicio',
      ancho: 'w-24',
      render: (e) => (
        <span className="text-xs text-[#6B6B6B] tabular-nums">
          {formatearFechaCorta(e.fechaCreacion)}
        </span>
      ),
    },
    {
      clave: 'fechaCierre',
      cabecera: 'F. cierre',
      ancho: 'w-24',
      render: (e) => (
        <span className="text-xs text-[#6B6B6B] tabular-nums">
          {e.fechaCierre ? formatearFechaCorta(e.fechaCierre) : '—'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-texto">Expedientes</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">
            {expedientesFiltrados.length} de {expedientes.length} registros
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Boton variante="secundario" tamaño="sm" onClick={recargar} disabled={cargando}>
            Actualizar
          </Boton>
          <Link href="/expedientes/nuevo">
            <Boton variante="primario" icono={<span>+</span>}>
              Nuevo expediente
            </Boton>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-borde p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar empresa o carpeta..."
            className="campo-input"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoExpediente | '')}
            className="campo-input"
          >
            {ESTADOS_FILTRO.map((f) => (
              <option key={f.valor} value={f.valor}>{f.etiqueta}</option>
            ))}
          </select>
          <select
            value={filtroInstitucion}
            onChange={(e) => setFiltroInstitucion(e.target.value as 'NF' | 'BX' | '')}
            className="campo-input"
          >
            {INSTITUCIONES_FILTRO.map((f) => (
              <option key={f.valor} value={f.valor}>{f.etiqueta}</option>
            ))}
          </select>
          <select
            value={filtroConsultor}
            onChange={(e) => setFiltroConsultor(e.target.value)}
            className="campo-input"
          >
            <option value="">Todos los consultores</option>
            {consultores.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <Tabla
        columnas={columnas}
        datos={expedientesFiltrados}
        claveFila={(e) => e.id}
        cargando={cargando}
        onClickFila={(e) => router.push(`/expedientes/${e.id}`)}
        vacio={
          <div className="py-4">
            <p className="text-[#6B6B6B]">No se encontraron expedientes</p>
            {expedientes.length === 0 && (
              <Link
                href="/expedientes/nuevo"
                className="text-sm text-primario underline mt-1 inline-block"
              >
                Crear el primero
              </Link>
            )}
          </div>
        }
      />
    </div>
  )
}
