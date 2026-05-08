'use client'

import React, { useRef, useState, useCallback } from 'react'
import { Check, Circle } from 'lucide-react'
import type { EstadoEvidencia } from '@/tipos/evidencia'
import { useCarga } from '@/hooks/useCarga'
import { formatearTamañoArchivo } from '@/utilidades/formatos'

interface PropiedadesCargaArchivo {
  evidenciaId: string
  expedienteId: string
  carpetaId: string
  subcarpeta: string      // "generales" | "sesion-01" | "sesion-02" ...
  nombreArchivo: string
  estado: EstadoEvidencia
  nombreArchivoActual?: string
  urlDrive?: string
  cargadoPor?: string
  // metadatos para registrar actividad — opcionales
  nombreExpediente?: string
  nombreEvidencia?: string
  nombreUsuario?: string
  onExito: () => void
}

const TIPOS_LEGIBLES = 'PDF, DOCX, XLSX, JPG, PNG'
const PESO_MAXIMO = '20 MB'
const MIME_ACEPTADOS = '.pdf,.docx,.xlsx,.jpg,.jpeg,.png'

export function CargaArchivo({
  evidenciaId,
  expedienteId,
  carpetaId,
  subcarpeta,
  nombreArchivo,
  estado,
  nombreArchivoActual,
  urlDrive,
  cargadoPor,
  nombreExpediente,
  nombreEvidencia,
  nombreUsuario,
  onExito,
}: PropiedadesCargaArchivo) {
  const { subiendo, progreso, error, subirEvidencia, limpiarError } = useCarga()
  const inputRef = useRef<HTMLInputElement>(null)
  const [arrastrandoSobre, setArrastrandoSobre] = useState(false)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)

  const procesarArchivo = useCallback(
    async (archivo: File) => {
      setArchivoSeleccionado(archivo)
      await subirEvidencia({
        archivo,
        evidenciaId,
        expedienteId,
        carpetaId,
        subcarpeta,
        nombreArchivo,
        cargadoPor,
        nombreExpediente,
        nombreEvidencia,
        nombreUsuario,
      })
      // solo notifica éxito si no hubo error
      if (!error) onExito()
    },
    [subirEvidencia, evidenciaId, expedienteId, carpetaId, subcarpeta, nombreArchivo, cargadoPor, nombreExpediente, nombreEvidencia, nombreUsuario, error, onExito]
  )

  const alArrastrarSobre = (e: React.DragEvent) => {
    e.preventDefault()
    setArrastrandoSobre(true)
  }

  const alSalirArrastre = () => setArrastrandoSobre(false)

  const alSoltar = (e: React.DragEvent) => {
    e.preventDefault()
    setArrastrandoSobre(false)
    const archivo = e.dataTransfer.files[0]
    if (archivo) procesarArchivo(archivo)
  }

  const alSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (archivo) procesarArchivo(archivo)
    e.target.value = ''
  }

  if (subiendo) {
    return (
      <div className="border border-borde bg-white p-4">
        <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-2">
          <span className="truncate max-w-[200px]">
            {archivoSeleccionado?.name ?? 'Subiendo...'}
          </span>
          <span className="tabular-nums font-medium text-texto ml-2 shrink-0">
            {progreso}%
          </span>
        </div>
        <div className="h-1.5 bg-[#E0E0E0] w-full">
          <div
            className="h-1.5 bg-primario transition-all duration-300"
            style={{ width: `${progreso}%` }}
            role="progressbar"
            aria-valuenow={progreso}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {archivoSeleccionado && (
          <p className="text-[10px] text-[#9B9B9B] mt-1.5">
            {formatearTamañoArchivo(archivoSeleccionado.size)}
          </p>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-[#8B1A1A]/30 bg-[#FDECEA] p-4">
        <div className="flex items-start gap-2">
          <span className="text-[#8B1A1A] text-sm leading-none shrink-0 mt-px">✕</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#8B1A1A]">{error}</p>
          </div>
        </div>
        <button
          onClick={() => {
            limpiarError()
            setArchivoSeleccionado(null)
          }}
          className="mt-3 text-xs text-[#8B1A1A] underline hover:no-underline"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }

  if ((estado === 'cargado' || estado === 'aprobado') && nombreArchivoActual) {
    return (
      <div className="border border-borde bg-white px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="leading-none shrink-0"
            style={{ color: estado === 'aprobado' ? '#1A5C2A' : '#1B4D35' }}
          >
            {estado === 'aprobado' ? <Check size={16} /> : <Circle size={12} fill="currentColor" />}
          </span>
          {urlDrive ? (
            <a
              href={urlDrive}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primario underline hover:no-underline truncate"
            >
              {nombreArchivoActual}
            </a>
          ) : (
            <span className="text-sm text-texto truncate">{nombreArchivoActual}</span>
          )}
        </div>

        {estado === 'cargado' && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={MIME_ACEPTADOS}
              className="sr-only"
              onChange={alSeleccionarArchivo}
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs text-[#6B6B6B] underline hover:text-texto shrink-0"
            >
              Reemplazar
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={MIME_ACEPTADOS}
        className="sr-only"
        onChange={alSeleccionarArchivo}
      />

      <div
        role="button"
        tabIndex={0}
        onDragOver={alArrastrarSobre}
        onDragLeave={alSalirArrastre}
        onDrop={alSoltar}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        className={[
          'border-2 border-dashed px-5 py-6 text-center cursor-pointer select-none',
          'transition-colors duration-100',
          arrastrandoSobre
            ? 'border-primario bg-[#E8F2ED]'
            : 'border-borde bg-white hover:border-[#AAAAAA] hover:bg-superficie',
        ].join(' ')}
      >
        <p className="text-sm font-medium text-texto mb-1">
          {arrastrandoSobre ? 'Suelta el archivo aquí' : 'Arrastra el archivo aquí'}
        </p>
        <p className="text-xs text-[#6B6B6B]">
          o{' '}
          <span className="text-primario underline">selecciona desde tu equipo</span>
        </p>
        <p className="text-[10px] text-[#9B9B9B] mt-3 uppercase tracking-wide">
          {TIPOS_LEGIBLES} · máx. {PESO_MAXIMO}
        </p>
      </div>
    </div>
  )
}
