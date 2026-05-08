'use client'

import React, { useEffect, useState } from 'react'
import { Tabla, type ColumnaTabla } from '@/componentes/comunes/Tabla'
import { Boton } from '@/componentes/comunes/Boton'
import { Modal } from '@/componentes/comunes/Modal'
import {
  obtenerUsuarios,
  obtenerUsuariosPendientes,
  crearUsuarioPendiente,
  actualizarUsuario,
  type UsuarioPendiente,
} from '@/servicios/baseDatos'
import type { Usuario } from '@/tipos/usuario'
import { PROGRAMAS } from '@/constantes/programas'
import { validarCorreo } from '@/utilidades/validaciones'

type RolForm = 'gestor' | 'consultor'

interface FormState {
  primerNombre: string
  segundoNombre: string
  primerApellido: string
  segundoApellido: string
  correo: string
  telefono: string
  rol: RolForm
  competencias: string[]
}

type Errores = Partial<Record<keyof FormState, string>>

interface UsuarioListado {
  id: string
  nombre: string
  nombreCorto: string
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  correo: string
  telefono?: string
  rol: 'gestor' | 'consultor'
  competencias: string[]
  activo: boolean
  pendiente: boolean
}

const FORM_VACIO: FormState = {
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  correo: '',
  telefono: '',
  rol: 'consultor',
  competencias: [],
}

// arma nombreCompleto y nombreCorto a partir de los 4 campos
function armarNombres(f: FormState) {
  const nombre = [f.primerNombre, f.segundoNombre, f.primerApellido, f.segundoApellido]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ')
  const nombreCorto = `${f.primerNombre.trim()} ${f.primerApellido.trim()}`.trim()
  return { nombre, nombreCorto }
}

export default function PaginaUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [editando, setEditando] = useState<UsuarioListado | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [exito, setExito] = useState<{ correo: string; url: string } | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VACIO)
  const [errores, setErrores] = useState<Errores>({})

  const cargar = async () => {
    setCargando(true)
    const [activos, pendientes] = await Promise.all([
      obtenerUsuarios().catch(() => [] as Usuario[]),
      obtenerUsuariosPendientes().catch(() => [] as UsuarioPendiente[]),
    ])

    const lista: UsuarioListado[] = [
      ...activos.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        nombreCorto: u.nombreCorto,
        primerNombre: u.primerNombre,
        segundoNombre: u.segundoNombre,
        primerApellido: u.primerApellido,
        segundoApellido: u.segundoApellido,
        correo: u.correo,
        telefono: u.telefono,
        rol: u.rol,
        competencias: u.competencias ?? [],
        activo: u.activo,
        pendiente: false,
      })),
      ...pendientes.map((p) => ({
        id: p.correo,
        nombre: p.nombre,
        nombreCorto: p.nombreCorto,
        primerNombre: p.primerNombre,
        segundoNombre: p.segundoNombre,
        primerApellido: p.primerApellido,
        segundoApellido: p.segundoApellido,
        correo: p.correo,
        telefono: p.telefono,
        rol: p.rol,
        competencias: p.competencias ?? [],
        activo: true,
        pendiente: true,
      })),
    ]

    setUsuarios(lista.sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setForm(FORM_VACIO)
    setErrores({})
    setErrorGlobal(null)
    setModalNuevo(true)
  }

  const abrirEditar = (u: UsuarioListado) => {
    setForm({
      primerNombre: u.primerNombre,
      segundoNombre: u.segundoNombre ?? '',
      primerApellido: u.primerApellido,
      segundoApellido: u.segundoApellido ?? '',
      correo: u.correo,
      telefono: u.telefono ?? '',
      rol: u.rol,
      competencias: u.competencias ?? [],
    })
    setErrores({})
    setErrorGlobal(null)
    setEditando(u)
  }

  const cerrarModales = () => {
    setModalNuevo(false)
    setEditando(null)
  }

  const validar = (): boolean => {
    const nuevos: Errores = {}
    if (!form.primerNombre.trim()) nuevos.primerNombre = 'Requerido'
    if (!form.primerApellido.trim()) nuevos.primerApellido = 'Requerido'
    if (!validarCorreo(form.correo)) nuevos.correo = 'Correo electrónico inválido'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  const toggleCompetencia = (id: string) => {
    setForm((p) => ({
      ...p,
      competencias: p.competencias.includes(id)
        ? p.competencias.filter((x) => x !== id)
        : [...p.competencias, id],
    }))
  }

  const guardarNuevo = async () => {
    if (!validar()) return
    setGuardando(true)
    setErrorGlobal(null)

    try {
      const { nombre, nombreCorto } = armarNombres(form)
      const correo = form.correo.trim().toLowerCase()

      await crearUsuarioPendiente({
        correo,
        nombre,
        nombreCorto,
        primerNombre: form.primerNombre.trim(),
        segundoNombre: form.segundoNombre.trim() || undefined,
        primerApellido: form.primerApellido.trim(),
        segundoApellido: form.segundoApellido.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        rol: form.rol,
        competencias: form.rol === 'consultor' ? form.competencias : [],
        fechaAlta: new Date(),
      })

      const url = typeof window !== 'undefined' ? window.location.origin : ''
      setExito({ correo, url })
      setModalNuevo(false)
      await cargar()
    } catch (err: unknown) {
      setErrorGlobal(err instanceof Error ? err.message : 'Error al crear el usuario')
    } finally {
      setGuardando(false)
    }
  }

  const guardarEdicion = async () => {
    if (!editando || !validar()) return
    setGuardando(true)
    setErrorGlobal(null)

    try {
      const { nombre, nombreCorto } = armarNombres(form)
      const datos = {
        nombre,
        nombreCorto,
        primerNombre: form.primerNombre.trim(),
        segundoNombre: form.segundoNombre.trim(),
        primerApellido: form.primerApellido.trim(),
        segundoApellido: form.segundoApellido.trim(),
        correo: form.correo.trim().toLowerCase(),
        telefono: form.telefono.trim(),
        rol: form.rol,
        competencias: form.rol === 'consultor' ? form.competencias : [],
      }

      if (editando.pendiente) {
        // mismo correo = mismo doc
        await crearUsuarioPendiente({ ...datos, fechaAlta: new Date() })
      } else {
        const ok = await actualizarUsuario(editando.id, datos)
        if (!ok) {
          setErrorGlobal('No se encontró el documento del usuario en Firestore. Es posible que aún no haya iniciado sesión.')
          setGuardando(false)
          return
        }
      }

      cerrarModales()
      await cargar()
    } catch (err: unknown) {
      setErrorGlobal(err instanceof Error ? err.message : 'Error al actualizar el usuario')
    } finally {
      setGuardando(false)
    }
  }

  const toggleActivo = async (u: UsuarioListado) => {
    if (u.pendiente) return
    const ok = await actualizarUsuario(u.id, { activo: !u.activo })
    if (ok) {
      setUsuarios((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, activo: !x.activo } : x))
      )
    }
  }

  const nombrePrograma = (id: string) =>
    PROGRAMAS.find((p) => p.id === id)?.nombre ?? id

  const columnas: ColumnaTabla<UsuarioListado>[] = [
    {
      clave: 'nombre',
      cabecera: 'Nombre',
      render: (u) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-texto">{u.nombre}</span>
          {u.pendiente && (
            <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 border border-[#8B6914]/40 text-[#8B6914] bg-[#FFF7E0]">
              Pendiente
            </span>
          )}
        </div>
      ),
    },
    {
      clave: 'correo',
      cabecera: 'Correo',
      render: (u) => <span className="text-sm text-[#6B6B6B]">{u.correo}</span>,
    },
    {
      clave: 'telefono',
      cabecera: 'Teléfono',
      ancho: 'w-32',
      render: (u) => <span className="text-sm text-[#6B6B6B]">{u.telefono || '—'}</span>,
    },
    {
      clave: 'rol',
      cabecera: 'Rol',
      ancho: 'w-24',
      render: (u) => (
        <span className="text-xs font-semibold uppercase text-texto">
          {u.rol === 'gestor' ? 'Gestor' : 'Consultor'}
        </span>
      ),
    },
    {
      clave: 'competencias',
      cabecera: 'Competencias',
      render: (u) => {
        if (u.rol !== 'consultor') return <span className="text-xs text-[#9B9B9B]">—</span>
        if (u.competencias.length === 0) return <span className="text-xs text-[#9B9B9B]">Sin asignar</span>
        return (
          <div className="flex flex-wrap gap-1">
            {u.competencias.slice(0, 3).map((id) => (
              <span
                key={id}
                className="text-[10px] px-1.5 py-0.5 border border-borde bg-superficie text-[#6B6B6B]"
                title={nombrePrograma(id)}
              >
                {nombrePrograma(id)}
              </span>
            ))}
            {u.competencias.length > 3 && (
              <span className="text-[10px] text-[#9B9B9B]">+{u.competencias.length - 3}</span>
            )}
          </div>
        )
      },
    },
    {
      clave: 'activo',
      cabecera: 'Estado',
      ancho: 'w-24',
      alineacion: 'centro',
      render: (u) => (
        <span className={`text-xs font-semibold uppercase ${u.activo ? 'text-primario' : 'text-[#9B9B9B]'}`}>
          {u.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      clave: 'acciones',
      cabecera: '',
      ancho: 'w-44',
      alineacion: 'derecha',
      render: (u) => (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => abrirEditar(u)}
            className="text-xs text-primario underline hover:no-underline"
          >
            Editar
          </button>
          {!u.pendiente && (
            <button
              onClick={() => toggleActivo(u)}
              className="text-xs text-[#6B6B6B] underline hover:text-texto"
            >
              {u.activo ? 'Desactivar' : 'Activar'}
            </button>
          )}
        </div>
      ),
    },
  ]

  const claseInput = (campo: keyof FormState) =>
    `campo-input ${errores[campo] ? 'border-[#8B1A1A]' : ''}`

  const activos = usuarios.filter((u) => u.activo).length

  const formCompartido = (
    <>
      {errorGlobal && (
        <div className="bg-[#FDECEA] border border-[#8B1A1A]/30 px-3 py-2 text-xs text-[#8B1A1A] mb-4">
          {errorGlobal}
        </div>
      )}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="campo-grupo">
            <label className="campo-label">Primer nombre *</label>
            <input
              type="text"
              value={form.primerNombre}
              onChange={(e) => setForm((p) => ({ ...p, primerNombre: e.target.value }))}
              className={claseInput('primerNombre')}
              disabled={guardando}
            />
            {errores.primerNombre && <p className="text-xs text-[#8B1A1A]">{errores.primerNombre}</p>}
          </div>
          <div className="campo-grupo">
            <label className="campo-label">Segundo nombre</label>
            <input
              type="text"
              value={form.segundoNombre}
              onChange={(e) => setForm((p) => ({ ...p, segundoNombre: e.target.value }))}
              className="campo-input"
              disabled={guardando}
            />
          </div>
          <div className="campo-grupo">
            <label className="campo-label">Primer apellido *</label>
            <input
              type="text"
              value={form.primerApellido}
              onChange={(e) => setForm((p) => ({ ...p, primerApellido: e.target.value }))}
              className={claseInput('primerApellido')}
              disabled={guardando}
            />
            {errores.primerApellido && <p className="text-xs text-[#8B1A1A]">{errores.primerApellido}</p>}
          </div>
          <div className="campo-grupo">
            <label className="campo-label">Segundo apellido</label>
            <input
              type="text"
              value={form.segundoApellido}
              onChange={(e) => setForm((p) => ({ ...p, segundoApellido: e.target.value }))}
              className="campo-input"
              disabled={guardando}
            />
          </div>
        </div>

        <div className="campo-grupo">
          <label className="campo-label">Correo Gmail *</label>
          <input
            type="email"
            value={form.correo}
            onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
            className={claseInput('correo')}
            placeholder="usuario@gmail.com"
            disabled={guardando}
          />
          {errores.correo && <p className="text-xs text-[#8B1A1A]">{errores.correo}</p>}
        </div>
        <div className="campo-grupo">
          <label className="campo-label">Teléfono</label>
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
            className="campo-input"
            placeholder="55 1234 5678"
            disabled={guardando}
          />
        </div>
        <div className="campo-grupo">
          <label className="campo-label">Rol *</label>
          <select
            value={form.rol}
            onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value as RolForm }))}
            className="campo-input"
            disabled={guardando}
          >
            <option value="consultor">Consultor</option>
            <option value="gestor">Gestor</option>
          </select>
        </div>

        {form.rol === 'consultor' && (
          <div className="campo-grupo">
            <label className="campo-label">Competencias (programas)</label>
            <div className="border border-borde max-h-44 overflow-y-auto p-2 space-y-1 bg-white">
              {PROGRAMAS.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-superficie"
                >
                  <input
                    type="checkbox"
                    checked={form.competencias.includes(p.id)}
                    onChange={() => toggleCompetencia(p.id)}
                    disabled={guardando}
                  />
                  <span className="text-texto">{p.nombre}</span>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-[#9B9B9B] mt-1">
              {form.competencias.length} programa{form.competencias.length === 1 ? '' : 's'} seleccionado{form.competencias.length === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-texto">Gestión de Usuarios</h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">
            {activos} activos de {usuarios.length} total
          </p>
        </div>
        <Boton variante="primario" icono={<span>+</span>} onClick={abrirNuevo}>
          Agregar usuario
        </Boton>
      </div>

      <Tabla
        columnas={columnas}
        datos={usuarios}
        claveFila={(u) => u.id}
        cargando={cargando}
        vacio="No hay usuarios registrados"
      />

      <Modal
        abierto={modalNuevo}
        titulo="Agregar usuario"
        onCerrar={cerrarModales}
        pie={
          <>
            <Boton variante="secundario" onClick={cerrarModales}>Cancelar</Boton>
            <Boton variante="primario" cargando={guardando} onClick={guardarNuevo}>Guardar</Boton>
          </>
        }
      >
        {formCompartido}
        <p className="text-xs text-[#9B9B9B] mt-3">
          El usuario podrá iniciar sesión con su cuenta de Google. Su acceso se activará al primer login.
        </p>
      </Modal>

      <Modal
        abierto={!!editando}
        titulo={`Editar usuario — ${editando?.nombreCorto || editando?.nombre || ''}`}
        onCerrar={cerrarModales}
        pie={
          <>
            <Boton variante="secundario" onClick={cerrarModales}>Cancelar</Boton>
            <Boton variante="primario" cargando={guardando} onClick={guardarEdicion}>Guardar cambios</Boton>
          </>
        }
      >
        {formCompartido}
      </Modal>

      <Modal
        abierto={!!exito}
        titulo="Usuario creado"
        onCerrar={() => setExito(null)}
        pie={
          <Boton variante="primario" onClick={() => setExito(null)}>Entendido</Boton>
        }
      >
        <p className="text-sm text-texto mb-3">Comparte este acceso:</p>
        <div className="bg-superficie border border-borde p-3 space-y-1.5 text-sm">
          <div>
            <p className="text-[10px] uppercase text-[#6B6B6B] tracking-wide">Plataforma</p>
            <p className="font-mono text-texto break-all">{exito?.url}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[#6B6B6B] tracking-wide">Correo de acceso</p>
            <p className="font-mono text-texto">{exito?.correo}</p>
          </div>
        </div>
        <p className="text-xs text-[#6B6B6B] mt-3">Inicia sesión con tu cuenta Google.</p>
      </Modal>
    </div>
  )
}
