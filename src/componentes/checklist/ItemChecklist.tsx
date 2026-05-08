'use client'

import React, { useRef } from 'react'
import type { Evidencia } from '@/tipos/evidencia'
import { Insignia } from '@/componentes/comunes/Insignia'
import { Boton } from '@/componentes/comunes/Boton'
import { formatearFechaCorta } from '@/utilidades/formatos'

interface PropiedadesItemChecklist {
  evidencia: Evidencia
  puedeCargar?: boolean
  puedeValidar?: boolean
  onCargar?: (archivo: File) => void
  onAprobar?: () => void
  onRechazar?: () => void
  subiendo?: boolean
}

export function ItemChecklist({
  evidencia,
  puedeCargar = false,
  puedeValidar = false,
  onCargar,
  onAprobar,
  onRechazar,
  subiendo = false,
}: PropiedadesItemChecklist) {
  const inputRef = useRef<HTMLInputElement>(null)

  const manejarCambioArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo && onCargar) {
      onCargar(archivo)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-borde last:border-b-0 bg-white hover:bg-[#FAFAFA] transition-colors">
      <div className="w-2 h-2 rounded-full shrink-0" style={{
        backgroundColor:
          evidencia.estado === 'aprobado' ? '#1A5C2A'
          : evidencia.estado === 'cargado' ? '#1B4D35'
          : evidencia.estado === 'rechazado' ? '#8B1A1A'
          : '#CCCCCC',
      }} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-texto truncate">{evidencia.nombre}</p>
        {evidencia.sesion !== null && (
          <p className="text-xs text-[#6B6B6B]">Sesión {String(evidencia.sesion).padStart(2, '0')}</p>
        )}
        {evidencia.estado === 'rechazado' && evidencia.comentarioRechazo && (
          <p className="text-xs text-[#8B1A1A] mt-0.5 italic">
            Motivo: {evidencia.comentarioRechazo}
          </p>
        )}
        {evidencia.fechaCarga && (
          <p className="text-xs text-[#9B9B9B]">
            Cargado {formatearFechaCorta(evidencia.fechaCarga)}
          </p>
        )}
      </div>

      <Insignia tipo="evidencia" estado={evidencia.estado} tamaño="sm" />

      <div className="flex items-center gap-2 shrink-0">
        {evidencia.urlDrive && (
          <a
            href={evidencia.urlDrive}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primario underline hover:no-underline"
          >
            Ver
          </a>
        )}

        {puedeCargar && (evidencia.estado === 'pendiente' || evidencia.estado === 'rechazado') && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.jpg,.png"
              className="sr-only"
              onChange={manejarCambioArchivo}
            />
            <Boton
              variante="secundario"
              tamaño="sm"
              cargando={subiendo}
              onClick={() => inputRef.current?.click()}
            >
              Cargar
            </Boton>
          </>
        )}

        {puedeValidar && evidencia.estado === 'cargado' && (
          <>
            <Boton variante="primario" tamaño="sm" onClick={onAprobar}>
              Aprobar
            </Boton>
            <Boton variante="peligro" tamaño="sm" onClick={onRechazar}>
              Rechazar
            </Boton>
          </>
        )}
      </div>
    </div>
  )
}
