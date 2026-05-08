'use client'

import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/componentes/comunes/Modal'
import { Boton } from '@/componentes/comunes/Boton'
import {
  actualizarExpediente,
  eliminarEvidenciasExpediente,
  eliminarComentariosExpediente,
  crearEvidenciasExpediente,
} from '@/servicios/baseDatos'
import { generarNombreArchivo, generarNombreCarpeta } from '@/utilidades/nomenclatura'
import { PROGRAMAS, PROGRAMA_POR_ID } from '@/constantes/programas'
import type { Expediente } from '@/tipos/expediente'
import type { Usuario } from '@/tipos/usuario'

interface Props {
  abierto: boolean
  expediente: Expediente
  consultores: Usuario[]
  onCerrar: () => void
  onGuardado: (expedienteActualizado: Expediente) => void
}

interface Form {
  nombreEmpresa: string
  consultorId: string
  programaId: string
  institucion: 'NF' | 'BX'
}

export function ModalEditarExpediente({
  abierto,
  expediente,
  consultores,
  onCerrar,
  onGuardado,
}: Props) {
  const [form, setForm] = useState<Form>({
    nombreEmpresa: expediente.nombreEmpresa,
    consultorId: expediente.consultorId,
    programaId: expediente.programaId,
    institucion: expediente.institucion,
  })
  const [confirmaReset, setConfirmaReset] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cambiaPrograma = form.programaId !== expediente.programaId
  const cambiaInstitucion = form.institucion !== expediente.institucion
  const requiereReset = cambiaPrograma || cambiaInstitucion

  const guardar = async () => {
    if (requiereReset && !confirmaReset) {
      setError('Marca la casilla para confirmar la pérdida de progreso')
      return
    }
    setError(null)
    setGuardando(true)

    try {
      const cambios: Partial<Expediente> = {}

      if (form.nombreEmpresa.trim() !== expediente.nombreEmpresa) {
        cambios.nombreEmpresa = form.nombreEmpresa.trim()
      }
      if (form.consultorId !== expediente.consultorId) {
        cambios.consultorId = form.consultorId
      }

      if (requiereReset) {
        const programa = PROGRAMA_POR_ID[form.programaId]
        if (!programa) throw new Error('Programa no encontrado')

        // 1. limpia evidencias y comentarios anteriores
        await Promise.all([
          eliminarEvidenciasExpediente(expediente.id),
          eliminarComentariosExpediente(expediente.id),
        ])

        // 2. genera evidencias del nuevo programa
        const evidencias: Array<{
          expedienteId: string
          nombre: string
          slug: string
          sesion: number | null
          nombreArchivo: string
        }> = []

        programa.checklistFijo.forEach((item) => {
          evidencias.push({
            expedienteId: expediente.id,
            nombre: item.nombre,
            slug: item.slug,
            sesion: null,
            nombreArchivo: generarNombreArchivo(programa.prefijo, expediente.idEmpresa, null, item.slug),
          })
        })
        for (let s = 1; s <= programa.numeroSesiones; s++) {
          programa.checklistPorSesion.forEach((item) => {
            evidencias.push({
              expedienteId: expediente.id,
              nombre: item.nombre,
              slug: item.slug,
              sesion: s,
              nombreArchivo: generarNombreArchivo(programa.prefijo, expediente.idEmpresa, s, item.slug),
            })
          })
        }
        await crearEvidenciasExpediente(evidencias)

        cambios.programaId = form.programaId
        cambios.institucion = form.institucion
        cambios.nombreCarpeta = generarNombreCarpeta(programa.prefijo, expediente.idEmpresa)
      }

      if (Object.keys(cambios).length > 0) {
        await actualizarExpediente(expediente.id, cambios)
      }

      onGuardado({ ...expediente, ...cambios })
      onCerrar()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Editar expediente"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton variante="primario" cargando={guardando} onClick={guardar}>
            Guardar cambios
          </Boton>
        </>
      }
    >
      {error && (
        <div className="bg-[#FDECEA] border border-[#8B1A1A]/30 px-3 py-2 text-xs text-[#8B1A1A] mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="campo-grupo">
          <label className="campo-label">Nombre de empresa</label>
          <input
            type="text"
            value={form.nombreEmpresa}
            onChange={(e) => setForm((p) => ({ ...p, nombreEmpresa: e.target.value }))}
            className="campo-input"
            disabled={guardando}
          />
        </div>

        <div className="campo-grupo">
          <label className="campo-label">Consultor asignado</label>
          <select
            value={form.consultorId}
            onChange={(e) => setForm((p) => ({ ...p, consultorId: e.target.value }))}
            className="campo-input"
            disabled={guardando}
          >
            {consultores.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
            {!consultores.find((c) => c.id === form.consultorId) && (
              <option value={form.consultorId}>UID actual: {form.consultorId}</option>
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="campo-grupo">
            <label className="campo-label">Programa</label>
            <select
              value={form.programaId}
              onChange={(e) => setForm((p) => ({ ...p, programaId: e.target.value }))}
              className="campo-input"
              disabled={guardando}
            >
              {PROGRAMAS.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="campo-grupo">
            <label className="campo-label">Institución</label>
            <select
              value={form.institucion}
              onChange={(e) => setForm((p) => ({ ...p, institucion: e.target.value as 'NF' | 'BX' }))}
              className="campo-input"
              disabled={guardando}
            >
              <option value="NF">NAFIN</option>
              <option value="BX">BANCOMEXT</option>
            </select>
          </div>
        </div>

        {requiereReset && (
          <div className="bg-[#FDECEA] border border-[#8B1A1A]/40 p-3 space-y-2">
            <p className="text-sm text-[#8B1A1A] font-semibold flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>Cambiar el programa eliminará todas las evidencias actuales y su progreso. Esta acción no se puede deshacer.</span>
            </p>
            <label className="flex items-center gap-2 text-xs text-[#8B1A1A]">
              <input
                type="checkbox"
                checked={confirmaReset}
                onChange={(e) => setConfirmaReset(e.target.checked)}
                disabled={guardando}
              />
              Entiendo que se perderá todo el progreso
            </label>
          </div>
        )}
      </div>
    </Modal>
  )
}
