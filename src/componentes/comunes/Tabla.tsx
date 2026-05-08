'use client'

import React from 'react'

export interface ColumnaTabla<T> {
  clave: string
  cabecera: string
  render: (fila: T, indice: number) => React.ReactNode
  alineacion?: 'izquierda' | 'centro' | 'derecha'
  ancho?: string
}

interface PropiedadesTabla<T> {
  columnas: ColumnaTabla<T>[]
  datos: T[]
  claveFila: (fila: T, indice: number) => string
  cargando?: boolean
  vacio?: React.ReactNode
  onClickFila?: (fila: T) => void
  compact?: boolean
}

const alineaciones = {
  izquierda: 'text-left',
  centro: 'text-center',
  derecha: 'text-right',
}

export function Tabla<T>({
  columnas,
  datos,
  claveFila,
  cargando = false,
  vacio,
  onClickFila,
  compact = false,
}: PropiedadesTabla<T>) {
  const celdaClase = compact ? 'px-4 py-2' : 'px-4 py-3'

  return (
    <div className="w-full overflow-x-auto border border-borde">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#EFEFEF] border-b border-borde">
            {columnas.map((col) => (
              <th
                key={col.clave}
                className={[
                  celdaClase,
                  'font-semibold text-texto uppercase text-xs tracking-wide',
                  alineaciones[col.alineacion ?? 'izquierda'],
                  col.ancho ?? '',
                ].join(' ')}
              >
                {col.cabecera}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <tr>
              <td colSpan={columnas.length} className={`${celdaClase} text-center text-[#6B6B6B]`}>
                <span className="inline-block w-4 h-4 border-2 border-primario border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                Cargando...
              </td>
            </tr>
          ) : datos.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className={`${celdaClase} text-center text-[#6B6B6B]`}>
                {vacio ?? 'Sin registros'}
              </td>
            </tr>
          ) : (
            datos.map((fila, idx) => (
              <tr
                key={claveFila(fila, idx)}
                className={[
                  'border-b border-borde last:border-b-0',
                  onClickFila ? 'cursor-pointer hover:bg-superficie' : '',
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]',
                ].join(' ')}
                onClick={onClickFila ? () => onClickFila(fila) : undefined}
              >
                {columnas.map((col) => (
                  <td
                    key={col.clave}
                    className={[celdaClase, alineaciones[col.alineacion ?? 'izquierda']].join(' ')}
                  >
                    {col.render(fila, idx)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
