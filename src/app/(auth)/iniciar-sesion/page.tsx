'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAutenticacion } from '@/hooks/useAutenticacion'

export default function PaginaIniciarSesion() {
  const router = useRouter()
  const { iniciarSesion, cargando, error, limpiarError, usuario } = useAutenticacion()

  // redirige según rol — SOLO en la página de login, no en el hook global
  useEffect(() => {
    if (!usuario) return
    router.replace(usuario.rol === 'gestor' ? '/inicio' : '/mis-servicios')
  }, [usuario, router])

  return (
    <div className="min-h-screen bg-superficie flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#6B6B6B] uppercase mb-3">
            NAFIN · BANCOMEXT
          </p>
          <h1 className="text-2xl font-bold text-primario leading-tight">
            Control de Servicios
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1.5">
            Gestión de evidencias — Asistencia Técnica
          </p>
        </div>

        <div className="bg-white border border-borde">

          <div className="px-6 py-5 border-b border-borde">
            <p className="text-sm font-semibold text-texto">Acceso al sistema</p>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Usa tu cuenta institucional de Google
            </p>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="flex items-start gap-3 bg-[#FDECEA] border border-[#8B1A1A]/25 px-4 py-3 mb-5">
                <span className="text-[#8B1A1A] text-sm leading-none mt-px shrink-0">✕</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#8B1A1A]">{error}</p>
                </div>
                <button
                  onClick={limpiarError}
                  className="text-[#8B1A1A]/60 hover:text-[#8B1A1A] text-xs shrink-0 leading-none mt-px"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              onClick={iniciarSesion}
              disabled={cargando}
              className={[
                'w-full flex items-center justify-center gap-3',
                'border border-borde bg-white px-4 py-3',
                'text-sm font-medium text-texto',
                'transition-colors duration-100',
                'hover:bg-superficie active:bg-[#E8E8E8]',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-primario focus:ring-offset-1',
              ].join(' ')}
            >
              {cargando ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#D0D0D0] border-t-primario rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                      fill="#34A853"
                    />
                    <path
                      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-[#9B9B9B] mt-5">
              Solo cuentas autorizadas por NAFIN / BANCOMEXT
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#BBBBBB] mt-6 uppercase tracking-wide">
          Sistema interno — acceso restringido
        </p>
      </div>
    </div>
  )
}
