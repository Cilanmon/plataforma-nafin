'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Boton } from '@/componentes/comunes/Boton'
import { Modal } from '@/componentes/comunes/Modal'
import { useComentarios } from '@/hooks/useComentarios'
import { formatearFechaHora } from '@/utilidades/formatos'
import type { Usuario } from '@/tipos/usuario'

interface PropiedadesSeccionHistorial {
  expedienteId: string
  usuario: Usuario
  cargandoAuth: boolean
}

export function SeccionHistorial({
  expedienteId,
  usuario,
  cargandoAuth,
}: PropiedadesSeccionHistorial) {
  const { comentarios, cargando, guardando, error, agregar, eliminar, limpiarError } =
    useComentarios({
      expedienteId,
      autorId: usuario.id,
      nombreAutor: usuario.nombre,
      rol: usuario.rol,
      cargandoAuth,
    })

  const [texto, setTexto] = useState('')
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)
  const esGestor = usuario.rol === 'gestor'

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight
    }
  }, [comentarios.length])

  const enviar = async () => {
    if (!texto.trim()) return
    await agregar(texto)
    setTexto('')
  }

  const confirmarEliminar = async () => {
    if (!confirmId) return
    setEliminandoId(confirmId)
    setConfirmId(null)
    await eliminar(confirmId)
    setEliminandoId(null)
  }

  return (
    <div className="bg-white border border-borde mt-6">
      <div className="px-4 py-3 border-b border-borde">
        <h2 className="text-sm font-semibold text-texto">Historial de comentarios</h2>
      </div>

      <div ref={listaRef} className="max-h-64 overflow-y-auto">
        {cargando ? (
          <p className="px-4 py-5 text-sm text-[#9B9B9B]">Cargando...</p>
        ) : error ? (
          <p className="px-4 py-5 text-sm text-[#8B1A1A]">{error}</p>
        ) : comentarios.length === 0 ? (
          <p className="px-4 py-5 text-sm text-[#9B9B9B]">Sin comentarios todavía.</p>
        ) : (
          comentarios.map((c) => (
            <div key={c.id} className="px-4 py-3 border-b border-borde last:border-b-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: c.rol === 'gestor' ? '#1B4D35' : '#8B6914' }}
                />
                <span className="text-xs font-semibold text-texto">{c.nombreAutor}</span>
                <span className="text-xs text-[#9B9B9B]">·</span>
                <span className="text-xs text-[#6B6B6B] italic">{c.nombreEvidencia}</span>
                <span className="text-xs text-[#9B9B9B] ml-auto shrink-0">
                  {formatearFechaHora(c.fechaCreacion)}
                </span>
                {esGestor && (
                  <button
                    onClick={() => setConfirmId(c.id)}
                    disabled={eliminandoId === c.id}
                    className="text-[#9B9B9B] hover:text-[#8B1A1A] transition-colors text-xs leading-none shrink-0 disabled:opacity-40"
                    title="Eliminar comentario"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="text-sm text-texto pl-4">{c.texto}</p>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-borde bg-superficie">
        {error && (
          <p className="text-xs text-[#8B1A1A] mb-2">
            {error}{' '}
            <button onClick={limpiarError} className="underline text-xs">Cerrar</button>
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); enviar() } }}
            placeholder="Escribe un comentario... (Enter para enviar)"
            className="campo-input flex-1 text-sm"
            disabled={guardando || cargandoAuth}
          />
          <Boton
            variante="secundario"
            tamaño="sm"
            onClick={enviar}
            cargando={guardando}
            disabled={!texto.trim() || cargandoAuth}
          >
            Enviar
          </Boton>
        </div>
      </div>

      <Modal
        abierto={!!confirmId}
        titulo="Eliminar comentario"
        onCerrar={() => setConfirmId(null)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setConfirmId(null)}>Cancelar</Boton>
            <Boton variante="peligro" onClick={confirmarEliminar}>Eliminar</Boton>
          </>
        }
      >
        <p className="text-sm text-texto">¿Eliminar este comentario?</p>
        <p className="text-xs text-[#6B6B6B] mt-1">Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  )
}
