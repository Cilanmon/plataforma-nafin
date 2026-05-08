'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Insignia } from '@/componentes/comunes/Insignia'
import { Boton } from '@/componentes/comunes/Boton'
import { Modal } from '@/componentes/comunes/Modal'
import { BarraProgreso } from '@/componentes/inicio/BarraProgreso'
import { SeccionHistorial } from '@/componentes/expedientes/SeccionHistorial'
import { ModalEditarExpediente } from '@/componentes/expedientes/ModalEditarExpediente'
import { Check, Trash2 } from 'lucide-react'
import { useChecklist } from '@/hooks/useChecklist'
import { useAutenticacion } from '@/hooks/useAutenticacion'
import {
  obtenerExpediente,
  actualizarEstadoExpediente,
  actualizarConsultorExpediente,
  obtenerUsuario,
  obtenerConsultoresRegistrados,
  resetearEvidencia,
  eliminarEvidenciasExpediente,
  eliminarExpedienteDoc,
  crearComentario,
  registrarActividad,
} from '@/servicios/baseDatos'
import { eliminarCarpeta, eliminarEvidencia as eliminarArchivoEnDrive } from '@/servicios/almacenamiento'
import type { Expediente, EstadoExpediente } from '@/tipos/expediente'
import type { Evidencia } from '@/tipos/evidencia'
import type { Usuario } from '@/tipos/usuario'
import { PROGRAMA_POR_ID } from '@/constantes/programas'
import { formatearFecha, formatearFechaCorta } from '@/utilidades/formatos'
import { ESTADOS_EVIDENCIA } from '@/constantes/estados'

function etiquetaInstitucion(inst: 'NF' | 'BX') {
  return inst === 'NF' ? 'NAFIN' : 'BANCOMEXT'
}

interface FilaEvidenciaProps {
  evidencia: Evidencia
  onAprobar: (comentario?: string) => void
  onRechazar: (comentario: string) => Promise<void>
  onEliminarArchivo: () => void
}

function FilaEvidencia({ evidencia, onAprobar, onRechazar, onEliminarArchivo }: FilaEvidenciaProps) {
  const cfg = ESTADOS_EVIDENCIA[evidencia.estado]
  const esCargado = evidencia.estado === 'cargado'
  const esAprobado = evidencia.estado === 'aprobado'
  const tieneArchivo = esCargado || esAprobado

  // siempre arranca vacía — el comentario anterior queda en el historial
  const [comentario, setComentario] = React.useState('')
  const [errorComentario, setErrorComentario] = React.useState(false)

  const handleAprobar = () => {
    setErrorComentario(false)
    onAprobar(comentario.trim() || undefined)
  }

  const handleRechazar = async () => {
    if (!comentario.trim()) { setErrorComentario(true); return }
    setErrorComentario(false)
    await onRechazar(comentario.trim())
    setComentario('')
  }

  return (
    <div className="border-b border-borde last:border-b-0 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />

        <span className="flex-1 min-w-0 text-sm font-medium text-texto">
          {evidencia.nombre}
          {evidencia.sesion !== null && (
            <span className="text-[10px] text-[#9B9B9B] ml-1 tabular-nums">
              S.{String(evidencia.sesion).padStart(2, '0')}
            </span>
          )}
        </span>

        <div className="w-[250px] shrink-0">
          {esCargado && (
            <input
              type="text"
              value={comentario}
              onChange={(e) => { setComentario(e.target.value); setErrorComentario(false) }}
              placeholder="Comentario para el consultor..."
              className={[
                'w-full text-xs px-2 py-1 border bg-white',
                'focus:outline-none focus:ring-1 focus:ring-primario',
                errorComentario ? 'border-[#8B1A1A]' : 'border-borde',
              ].join(' ')}
            />
          )}
        </div>

        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 border shrink-0"
          style={{ color: cfg.color, backgroundColor: cfg.fondo, borderColor: cfg.color + '40' }}
        >
          {cfg.etiqueta}
        </span>

        {evidencia.urlDrive && (
          <a href={evidencia.urlDrive} target="_blank" rel="noopener noreferrer"
            className="text-xs text-primario underline hover:no-underline shrink-0">
            Ver
          </a>
        )}

        {tieneArchivo && (
          <button onClick={onEliminarArchivo}
            className="text-xs text-[#9B9B9B] hover:text-[#8B1A1A] transition-colors underline shrink-0">
            Quitar
          </button>
        )}

        {esCargado && (
          <>
            <Boton variante="primario" tamaño="sm" onClick={handleAprobar}>Aprobar</Boton>
            <Boton variante="peligro" tamaño="sm" onClick={handleRechazar}>Rechazar</Boton>
          </>
        )}
      </div>

      {tieneArchivo && (evidencia.nombreArchivo || evidencia.fechaCarga) && (
        <div className="flex items-center gap-3 mt-0.5 pl-4">
          {evidencia.nombreArchivo && (
            evidencia.urlDrive ? (
              <a href={evidencia.urlDrive} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-primario underline hover:no-underline font-mono">
                {evidencia.nombreArchivo}
              </a>
            ) : (
              <span className="text-[10px] text-[#6B6B6B] font-mono">{evidencia.nombreArchivo}</span>
            )
          )}
          {evidencia.fechaCarga && (
            <span className="text-[10px] text-[#9B9B9B]">
              Cargado {formatearFechaCorta(evidencia.fechaCarga)}
            </span>
          )}
        </div>
      )}

      {errorComentario && (
        <p className="mt-0.5 pl-4 text-xs text-[#8B1A1A]">
          Escribe un comentario antes de rechazar
        </p>
      )}
    </div>
  )
}

export default function PaginaExpediente() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { usuario, cargando: cargandoAuth } = useAutenticacion()

  const [expediente, setExpediente] = useState<Expediente | null>(null)
  const [cargandoExpediente, setCargandoExpediente] = useState(true)
  const [nombreConsultor, setNombreConsultor] = useState('')
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [eliminarEvidenciaTarget, setEliminarEvidenciaTarget] = useState<Evidencia | null>(null)
  const [eliminandoEvidencia, setEliminandoEvidencia] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [modalReasignar, setModalReasignar] = useState(false)
  const [consultoresDisp, setConsultoresDisp] = useState<Usuario[]>([])
  const [nuevoConsultorId, setNuevoConsultorId] = useState('')
  const [reasignando, setReasignando] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)

  const {
    evidencias, cargando: cargandoEvidencias,
    totalItems, itemsAprobados, todasAprobadas,
    aprobar, rechazar, recargar,
  } = useChecklist(id)

  useEffect(() => {
    obtenerExpediente(id).then(async (exp) => {
      setExpediente(exp)
      if (exp?.consultorId) {
        const c = await obtenerUsuario(exp.consultorId)
        setNombreConsultor(c?.nombre ?? exp.consultorId)
      }
    }).finally(() => setCargandoExpediente(false))
  }, [id])

  const avanzarAEnviado = async () => {
    if (!expediente) return
    setCambiandoEstado(true)
    await actualizarEstadoExpediente(id, 'enviado_institucion')
    setExpediente((p) => p ? { ...p, estado: 'enviado_institucion', fechaEnvio: new Date() } : null)
    setCambiandoEstado(false)
  }

  const avanzarAAprobado = async () => {
    if (!expediente) return
    setCambiandoEstado(true)
    await actualizarEstadoExpediente(id, 'aprobado_institucion')
    setExpediente((p) => p ? { ...p, estado: 'aprobado_institucion', fechaAprobacion: new Date() } : null)
    setCambiandoEstado(false)
  }

  const manejarAprobar = async (evidenciaId: string, nombreEvidencia: string, comentario?: string) => {
    if (!usuario || !expediente) return
    await aprobar(evidenciaId, usuario.id, comentario)
    if (comentario) {
      await crearComentario({
        expedienteId: id,
        evidenciaId,
        nombreEvidencia,
        texto: comentario,
        creadoPor: usuario.id,
        nombreAutor: usuario.nombre,
        rol: 'gestor',
        fechaCreacion: new Date(),
      })
    }
    await registrarActividad({
      expedienteId: id,
      nombreExpediente: expediente.nombreCarpeta,
      tipoAccion: 'aprobado',
      nombreEvidencia,
      nombreUsuario: usuario.nombreCorto || usuario.nombre,
      usuarioId: usuario.id,
      fechaCreacion: new Date(),
    })
  }

  const manejarRechazar = async (evidenciaId: string, nombreEvidencia: string, comentario: string) => {
    if (!usuario || !expediente) return
    await rechazar(evidenciaId, comentario, usuario.id)
    await crearComentario({
      expedienteId: id,
      evidenciaId,
      nombreEvidencia,
      texto: comentario,
      creadoPor: usuario.id,
      nombreAutor: usuario.nombre,
      rol: 'gestor',
      fechaCreacion: new Date(),
    })
    await registrarActividad({
      expedienteId: id,
      nombreExpediente: expediente.nombreCarpeta,
      tipoAccion: 'rechazado',
      nombreEvidencia,
      nombreUsuario: usuario.nombreCorto || usuario.nombre,
      usuarioId: usuario.id,
      fechaCreacion: new Date(),
    })
  }

  const confirmarEliminarEvidencia = async () => {
    if (!eliminarEvidenciaTarget) return
    setEliminandoEvidencia(true)
    try {
      if (eliminarEvidenciaTarget.fileId) {
        await eliminarArchivoEnDrive(eliminarEvidenciaTarget.fileId)
      }
      await resetearEvidencia(eliminarEvidenciaTarget.id)
      await recargar()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el archivo')
    } finally {
      setEliminandoEvidencia(false)
      setEliminarEvidenciaTarget(null)
    }
  }

  const confirmarEliminar = async () => {
    if (!expediente) return
    setEliminando(true)
    setError(null)
    try {
      if (expediente.carpetaDriveId) await eliminarCarpeta(expediente.carpetaDriveId)
      await eliminarEvidenciasExpediente(id)
      await eliminarExpedienteDoc(id)
      router.push('/expedientes')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      setEliminando(false)
      setModalEliminar(false)
    }
  }

  const abrirReasignar = async () => {
    try {
      const lista = await obtenerConsultoresRegistrados()
      setConsultoresDisp(lista)
      setNuevoConsultorId(expediente?.consultorId ?? '')
      setModalReasignar(true)
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string }
      console.error('error cargando consultores:', e.code, e.message)
      setError('No se pudo cargar la lista de consultores. Verifica que las reglas de Firestore estén desplegadas.')
    }
  }

  const confirmarReasignacion = async () => {
    if (!nuevoConsultorId || nuevoConsultorId === expediente?.consultorId) {
      setModalReasignar(false); return
    }
    setReasignando(true)
    await actualizarConsultorExpediente(id, nuevoConsultorId)
    const nuevo = consultoresDisp.find((c) => c.id === nuevoConsultorId)
    setNombreConsultor(nuevo?.nombre ?? nuevoConsultorId)
    setExpediente((p) => p ? { ...p, consultorId: nuevoConsultorId } : null)
    setReasignando(false)
    setModalReasignar(false)
  }

  const programa = expediente ? PROGRAMA_POR_ID[expediente.programaId] : null
  const fijas = evidencias.filter((e) => e.sesion === null)
  const sesiones = Array.from(new Set(
    evidencias.filter((e) => e.sesion !== null).map((e) => e.sesion)
  )).sort((a, b) => (a ?? 0) - (b ?? 0))

  const inst = expediente?.institucion ?? 'NF'
  const nombreInst = etiquetaInstitucion(inst)
  const puedeMarcarListo = expediente?.estado === 'en_proceso' && todasAprobadas
  const puedeAvanzarAEnviado = expediente?.estado === 'listo_para_envio'
  const puedeAvanzarAAprobado = expediente?.estado === 'enviado_institucion'
  const finalizado = expediente?.estado === 'aprobado_institucion'
  const puedeReasignar = expediente && expediente.estado !== 'aprobado_institucion'

  const colorContadorSesion = (items: Evidencia[]) => {
    if (items.every((e) => e.estado === 'aprobado')) return '#1A5C2A'
    if (items.some((e) => e.estado === 'rechazado')) return '#8B1A1A'
    return '#9B9B9B'
  }

  if (cargandoExpediente) {
    return (
      <div className="flex items-center gap-2 text-[#6B6B6B] py-16">
        <span className="w-4 h-4 border-2 border-primario border-t-transparent rounded-full animate-spin" />
        Cargando expediente...
      </div>
    )
  }

  if (!expediente) {
    return (
      <div className="py-16 text-center">
        <p className="text-[#6B6B6B]">Expediente no encontrado</p>
        <Link href="/expedientes" className="text-sm text-primario underline mt-2 inline-block">
          Volver a expedientes
        </Link>
      </div>
    )
  }

  return (
    <div>
      <nav className="flex items-center gap-2 text-xs text-[#6B6B6B] mb-6">
        <Link href="/expedientes" className="hover:text-texto">Expedientes</Link>
        <span>/</span>
        <span className="text-texto font-medium">{expediente.nombreCarpeta}</span>
      </nav>

      {error && (
        <div className="bg-[#FDECEA] border border-[#8B1A1A]/30 px-4 py-3 text-sm text-[#8B1A1A] mb-4 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="underline text-xs">Cerrar</button>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-lg font-bold text-texto">{expediente.nombreEmpresa}</h1>
            <Insignia tipo="expediente" estado={expediente.estado} />
            {expediente.estado !== 'aprobado_institucion' && (
              <button
                onClick={async () => {
                  if (consultoresDisp.length === 0) {
                    try {
                      const lista = await obtenerConsultoresRegistrados()
                      setConsultoresDisp(lista)
                    } catch {
                      setConsultoresDisp([])
                    }
                  }
                  setModalEditar(true)
                }}
                className="text-xs text-primario underline hover:no-underline"
              >
                Editar
              </button>
            )}
          </div>
          <p className="text-xs font-mono text-[#6B6B6B]">{expediente.nombreCarpeta}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {puedeMarcarListo && (
            <Boton variante="primario" tamaño="sm" cargando={cambiandoEstado}
              onClick={async () => {
                setCambiandoEstado(true)
                await actualizarEstadoExpediente(id, 'listo_para_envio')
                setExpediente((p) => p ? { ...p, estado: 'listo_para_envio' } : null)
                setCambiandoEstado(false)
              }}>
              Marcar listo para envío
            </Boton>
          )}
          {expediente.estado === 'en_proceso' && !todasAprobadas && (
            <p className="text-xs text-[#9B9B9B]">Faltan {totalItems - itemsAprobados} evidencias</p>
          )}
          {puedeAvanzarAEnviado && (
            <Boton variante="primario" tamaño="sm" cargando={cambiandoEstado} onClick={avanzarAEnviado}>
              Marcar como enviado a {nombreInst}
            </Boton>
          )}
          {puedeAvanzarAAprobado && (
            <Boton variante="primario" tamaño="sm" cargando={cambiandoEstado} onClick={avanzarAAprobado}>
              Aprobado por {nombreInst}
            </Boton>
          )}
          {finalizado && (
            <span className="text-sm font-semibold text-[#1A5C2A] inline-flex items-center gap-1">
              <Check size={14} /> Aprobado por {nombreInst}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Institución', valor: nombreInst },
          { label: 'Programa', valor: programa?.nombre ?? '—' },
          { label: 'Alta', valor: formatearFecha(expediente.fechaCreacion) },
          expediente.fechaEnvio
            ? { label: 'Fecha envío', valor: formatearFecha(expediente.fechaEnvio) }
            : expediente.fechaAprobacion
            ? { label: 'Aprobación', valor: formatearFecha(expediente.fechaAprobacion) }
            : { label: 'Sesiones', valor: String(programa?.numeroSesiones ?? '—') },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-borde p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6B6B] mb-1">{item.label}</p>
            <p className="text-sm font-medium text-texto truncate">{item.valor}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-borde p-3 mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6B6B] mb-0.5">Consultor</p>
          <p className="text-sm font-medium text-texto">{nombreConsultor}</p>
        </div>
        {puedeReasignar && (
          <Boton variante="secundario" tamaño="sm" onClick={abrirReasignar}>Reasignar</Boton>
        )}
      </div>

      <div className="bg-white border border-borde p-4 mb-6">
        <BarraProgreso valor={itemsAprobados} total={totalItems} etiqueta="Avance general" altura="md" />
      </div>

      <div className="bg-white border border-borde">
        <div className="px-4 py-3 border-b border-borde flex items-center justify-between">
          <h2 className="text-sm font-semibold text-texto">Checklist de evidencias</h2>
          <button onClick={recargar} className="text-xs text-[#6B6B6B] hover:text-texto underline">
            Actualizar
          </button>
        </div>

        {cargandoEvidencias ? (
          <div className="flex items-center gap-2 px-4 py-8 text-[#6B6B6B] text-sm">
            <span className="w-4 h-4 border-2 border-primario border-t-transparent rounded-full animate-spin" />
            Cargando evidencias...
          </div>
        ) : (
          <div>
            {fijas.length > 0 && (
              <section>
                <div className="px-4 py-2 bg-[#F5F5F5] border-b border-borde">
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
                    Documentos generales
                  </p>
                </div>
                {fijas.map((ev) => (
                  <FilaEvidencia key={ev.id} evidencia={ev}
                    onAprobar={(c) => manejarAprobar(ev.id, ev.nombre, c)}
                    onRechazar={(c) => manejarRechazar(ev.id, ev.nombre, c)}
                    onEliminarArchivo={() => setEliminarEvidenciaTarget(ev)}
                  />
                ))}
              </section>
            )}
            {sesiones.map((sesion) => {
              const items = evidencias.filter((e) => e.sesion === sesion)
              const aprobados = items.filter((e) => e.estado === 'aprobado').length
              const colorContador = colorContadorSesion(items)
              return (
                <section key={sesion}>
                  <div className="px-4 py-2 bg-[#F5F5F5] border-b border-borde flex items-center gap-3">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
                      Sesión {String(sesion).padStart(2, '0')}
                    </p>
                    <span className="text-xs font-medium tabular-nums" style={{ color: colorContador }}>
                      {aprobados}/{items.length}
                    </span>
                  </div>
                  {items.map((ev) => (
                    <FilaEvidencia key={ev.id} evidencia={ev}
                      onAprobar={(c) => manejarAprobar(ev.id, ev.nombre, c)}
                      onRechazar={(c) => manejarRechazar(ev.id, ev.nombre, c)}
                      onEliminarArchivo={() => setEliminarEvidenciaTarget(ev)}
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

      <div className="mt-8 pt-6 border-t border-borde">
        <Boton variante="peligro" tamaño="sm" icono={<Trash2 size={14} />} onClick={() => setModalEliminar(true)}>
          Eliminar expediente
        </Boton>
        <p className="text-xs text-[#9B9B9B] mt-1">
          Elimina la carpeta en Drive y todos los registros en Firestore.
        </p>
      </div>

      <Modal abierto={!!eliminarEvidenciaTarget} titulo="Quitar archivo"
        onCerrar={() => setEliminarEvidenciaTarget(null)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setEliminarEvidenciaTarget(null)}>Cancelar</Boton>
            <Boton variante="peligro" onClick={confirmarEliminarEvidencia} cargando={eliminandoEvidencia}>
              Quitar archivo
            </Boton>
          </>
        }>
        <p className="text-sm text-texto mb-2">
          ¿Quitar el archivo de <strong>{eliminarEvidenciaTarget?.nombre}</strong>?
        </p>
        <p className="text-xs text-[#6B6B6B]">
          El archivo va a la papelera de Drive y la evidencia vuelve a pendiente.
        </p>
      </Modal>

      <Modal abierto={modalEliminar} titulo="Eliminar expediente"
        onCerrar={() => setModalEliminar(false)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModalEliminar(false)}>Cancelar</Boton>
            <Boton variante="peligro" onClick={confirmarEliminar} cargando={eliminando}>
              Eliminar definitivamente
            </Boton>
          </>
        }>
        <p className="text-sm text-texto mb-2">
          ¿Eliminar expediente <strong>{expediente.nombreCarpeta}</strong>?
        </p>
        <p className="text-sm text-[#8B1A1A] mb-1 font-medium">Esta acción no se puede deshacer.</p>
        <p className="text-xs text-[#6B6B6B]">
          Se eliminarán la carpeta en Drive (con todos sus archivos) y las evidencias.
        </p>
      </Modal>

      <Modal abierto={modalReasignar} titulo="Reasignar consultor"
        onCerrar={() => setModalReasignar(false)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setModalReasignar(false)}>Cancelar</Boton>
            <Boton variante="primario" onClick={confirmarReasignacion} cargando={reasignando}
              disabled={!nuevoConsultorId || nuevoConsultorId === expediente.consultorId}>
              Confirmar reasignación
            </Boton>
          </>
        }>
        <p className="text-xs text-[#6B6B6B] mb-4 italic">
          Reasignar el consultor no afecta las evidencias ni el progreso del expediente.
        </p>
        <div className="campo-grupo">
          <label className="campo-label">Nuevo consultor</label>
          {(() => {
            // solo consultores con competencia en el programa actual
            const elegibles = consultoresDisp.filter(
              (c) => c.competencias?.includes(expediente.programaId)
            )
            if (elegibles.length === 0) {
              return (
                <p className="text-sm text-[#8B1A1A]">
                  No hay consultores con competencia en este programa.
                </p>
              )
            }
            return (
              <select
                value={nuevoConsultorId}
                onChange={(e) => setNuevoConsultorId(e.target.value)}
                className="campo-input"
              >
                <option value="">-- Selecciona un consultor --</option>
                {elegibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            )
          })()}
        </div>
      </Modal>

      {modalEditar && (
        <ModalEditarExpediente
          abierto={modalEditar}
          expediente={expediente}
          consultores={consultoresDisp}
          onCerrar={() => setModalEditar(false)}
          onGuardado={async (actualizado) => {
            setExpediente(actualizado)
            // si se reseteó el programa, recarga evidencias y nombre del consultor
            await recargar()
            if (actualizado.consultorId !== expediente.consultorId) {
              const c = await obtenerUsuario(actualizado.consultorId)
              setNombreConsultor(c?.nombre ?? actualizado.consultorId)
            }
          }}
        />
      )}
    </div>
  )
}
