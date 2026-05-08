'use client'

import React, { useState } from 'react'
import type { Evidencia } from '@/tipos/evidencia'
import { ItemChecklist } from './ItemChecklist'
import { BarraProgreso } from '@/componentes/inicio/BarraProgreso'
import { Modal } from '@/componentes/comunes/Modal'
import { Boton } from '@/componentes/comunes/Boton'

interface PropiedadesGridChecklist {
  evidencias: Evidencia[]
  cargando?: boolean
  puedeCargar?: boolean
  puedeValidar?: boolean
  onCargar?: (evidenciaId: string, archivo: File) => void
  onAprobar?: (evidenciaId: string) => void
  onRechazar?: (evidenciaId: string, comentario: string) => void
  idsCargando?: Set<string>
}

export function GridChecklist({
  evidencias,
  cargando = false,
  puedeCargar = false,
  puedeValidar = false,
  onCargar,
  onAprobar,
  onRechazar,
  idsCargando = new Set(),
}: PropiedadesGridChecklist) {
  const [rechazoModal, setRechazoModal] = useState<{ id: string; nombre: string } | null>(null)
  const [comentarioRechazo, setComentarioRechazo] = useState('')

  // Separar evidencias fijas (sin sesión) de las de sesión
  const fijas = evidencias.filter((e) => e.sesion === null)
  const porSesion = evidencias.filter((e) => e.sesion !== null)
  const sesiones = Array.from(new Set(porSesion.map((e) => e.sesion))).sort(
    (a, b) => (a ?? 0) - (b ?? 0)
  )

  const aprobados = evidencias.filter((e) => e.estado === 'aprobado').length
  const total = evidencias.length

  const confirmarRechazo = () => {
    if (!rechazoModal || !comentarioRechazo.trim()) return
    onRechazar?.(rechazoModal.id, comentarioRechazo.trim())
    setRechazoModal(null)
    setComentarioRechazo('')
  }

  if (cargando) {
    return (
      <div className="py-8 text-center text-[#6B6B6B] text-sm">
        <span className="inline-block w-4 h-4 border-2 border-primario border-t-transparent rounded-full animate-spin mr-2 align-middle" />
        Cargando evidencias...
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-superficie border border-borde">
        <BarraProgreso
          valor={aprobados}
          total={total}
          etiqueta="Evidencias aprobadas"
          altura="md"
        />
      </div>

      {fijas.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide mb-2 px-1">
            Documentos generales
          </h3>
          <div className="border border-borde">
            {fijas.map((ev) => (
              <ItemChecklist
                key={ev.id}
                evidencia={ev}
                puedeCargar={puedeCargar}
                puedeValidar={puedeValidar}
                subiendo={idsCargando.has(ev.id)}
                onCargar={(archivo) => onCargar?.(ev.id, archivo)}
                onAprobar={() => onAprobar?.(ev.id)}
                onRechazar={() => setRechazoModal({ id: ev.id, nombre: ev.nombre })}
              />
            ))}
          </div>
        </section>
      )}

      {sesiones.map((sesion) => {
        const items = porSesion.filter((e) => e.sesion === sesion)
        const sesionNum = String(sesion).padStart(2, '0')
        const sesionAprobados = items.filter((e) => e.estado === 'aprobado').length

        return (
          <section key={sesion} className="mb-4">
            <div className="flex items-center gap-3 mb-2 px-1">
              <h3 className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
                Sesión {sesionNum}
              </h3>
              <span className="text-xs text-[#9B9B9B] tabular-nums">
                {sesionAprobados}/{items.length}
              </span>
            </div>
            <div className="border border-borde">
              {items.map((ev) => (
                <ItemChecklist
                  key={ev.id}
                  evidencia={ev}
                  puedeCargar={puedeCargar}
                  puedeValidar={puedeValidar}
                  subiendo={idsCargando.has(ev.id)}
                  onCargar={(archivo) => onCargar?.(ev.id, archivo)}
                  onAprobar={() => onAprobar?.(ev.id)}
                  onRechazar={() => setRechazoModal({ id: ev.id, nombre: ev.nombre })}
                />
              ))}
            </div>
          </section>
        )
      })}

      <Modal
        abierto={!!rechazoModal}
        titulo="Rechazar evidencia"
        onCerrar={() => {
          setRechazoModal(null)
          setComentarioRechazo('')
        }}
        pie={
          <>
            <Boton
              variante="secundario"
              onClick={() => {
                setRechazoModal(null)
                setComentarioRechazo('')
              }}
            >
              Cancelar
            </Boton>
            <Boton
              variante="peligro"
              onClick={confirmarRechazo}
              disabled={!comentarioRechazo.trim()}
            >
              Confirmar rechazo
            </Boton>
          </>
        }
      >
        <p className="text-sm text-texto mb-1">
          Evidencia: <strong>{rechazoModal?.nombre}</strong>
        </p>
        <p className="text-xs text-[#6B6B6B] mb-3">
          El motivo será visible para el consultor.
        </p>
        <textarea
          value={comentarioRechazo}
          onChange={(e) => setComentarioRechazo(e.target.value)}
          className="w-full border border-borde px-3 py-2 text-sm text-texto resize-none focus:outline-none focus:ring-1 focus:ring-primario"
          rows={3}
          placeholder="Describe el motivo del rechazo..."
        />
      </Modal>
    </div>
  )
}
