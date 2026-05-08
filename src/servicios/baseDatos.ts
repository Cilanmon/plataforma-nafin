import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  addDoc,
  writeBatch,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getCountFromServer,
  Timestamp,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Usuario } from '@/tipos/usuario'
import type { Expediente, EstadoExpediente } from '@/tipos/expediente'
import type { Evidencia, EstadoEvidencia } from '@/tipos/evidencia'
import type { ItemChecklist } from '@/tipos/programa'
import type { Comentario } from '@/tipos/comentario'
import type { Consultor } from '@/tipos/consultor'
import type { Actividad, TipoAccion } from '@/tipos/actividad'

function timestampADate(valor: unknown): Date {
  if (valor instanceof Timestamp) return valor.toDate()
  if (valor instanceof Date) return valor
  return new Date()
}

// Compat con docs viejos: si no traen los 4 campos, los deriva de "nombre"
function docAUsuario(id: string, d: Record<string, unknown>): Usuario {
  const nombre = (d.nombre as string) ?? ''
  const partes = nombre.trim().split(/\s+/)
  const primerNombre = (d.primerNombre as string) ?? partes[0] ?? ''
  const primerApellido = (d.primerApellido as string) ?? partes[partes.length - 1] ?? ''
  const segundoNombre = d.segundoNombre as string | undefined
  const segundoApellido = d.segundoApellido as string | undefined
  const nombreCorto =
    (d.nombreCorto as string) || `${primerNombre} ${primerApellido}`.trim()

  return {
    id,
    nombre,
    nombreCorto,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    correo: d.correo as string,
    telefono: d.telefono as string | undefined,
    rol: d.rol as 'gestor' | 'consultor',
    competencias: (d.competencias as string[] | undefined) ?? [],
    activo: d.activo as boolean,
    fechaAlta: timestampADate(d.fechaAlta),
  }
}

export async function obtenerUsuario(uid: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, 'usuarios', uid))
  if (!snap.exists()) return null
  return docAUsuario(snap.id, snap.data())
}

export async function obtenerUsuarios(): Promise<Usuario[]> {
  const snap = await getDocs(collection(db, 'usuarios'))
  return snap.docs.map((d) => docAUsuario(d.id, d.data()))
}

export async function crearUsuario(usuario: Usuario): Promise<void> {
  await setDoc(doc(db, 'usuarios', usuario.id), {
    nombre: usuario.nombre,
    nombreCorto: usuario.nombreCorto,
    primerNombre: usuario.primerNombre,
    segundoNombre: usuario.segundoNombre ?? '',
    primerApellido: usuario.primerApellido,
    segundoApellido: usuario.segundoApellido ?? '',
    correo: usuario.correo,
    telefono: usuario.telefono ?? '',
    rol: usuario.rol,
    competencias: usuario.competencias ?? [],
    activo: usuario.activo,
    fechaAlta: Timestamp.fromDate(usuario.fechaAlta),
  })
}

type CamposActualizables = 'nombre' | 'nombreCorto' | 'primerNombre' | 'segundoNombre'
  | 'primerApellido' | 'segundoApellido' | 'correo' | 'telefono' | 'rol' | 'competencias' | 'activo'

// solo actualiza si el documento existe — evita "No document to update"
export async function actualizarUsuario(
  id: string,
  datos: Partial<Pick<Usuario, CamposActualizables>>
): Promise<boolean> {
  const ref = doc(db, 'usuarios', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return false
  await updateDoc(ref, datos)
  return true
}

export interface UsuarioPendiente {
  correo: string
  nombre: string
  nombreCorto: string
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  telefono?: string
  rol: 'gestor' | 'consultor'
  competencias?: string[]
  fechaAlta: Date
}

function correoComoId(correo: string): string {
  return correo.trim().toLowerCase()
}

function dataAUsuarioPendiente(d: Record<string, unknown>): UsuarioPendiente {
  const nombre = (d.nombre as string) ?? ''
  const partes = nombre.trim().split(/\s+/)
  const primerNombre = (d.primerNombre as string) ?? partes[0] ?? ''
  const primerApellido = (d.primerApellido as string) ?? partes[partes.length - 1] ?? ''
  const segundoNombre = d.segundoNombre as string | undefined
  const segundoApellido = d.segundoApellido as string | undefined
  const nombreCorto =
    (d.nombreCorto as string) || `${primerNombre} ${primerApellido}`.trim()

  return {
    correo: d.correo as string,
    nombre,
    nombreCorto,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    telefono: d.telefono as string | undefined,
    rol: d.rol as 'gestor' | 'consultor',
    competencias: (d.competencias as string[] | undefined) ?? [],
    fechaAlta: timestampADate(d.fechaAlta),
  }
}

export async function crearUsuarioPendiente(usuario: UsuarioPendiente): Promise<void> {
  const id = correoComoId(usuario.correo)
  await setDoc(doc(db, 'usuariosPendientes', id), {
    correo: id,
    nombre: usuario.nombre,
    nombreCorto: usuario.nombreCorto,
    primerNombre: usuario.primerNombre,
    segundoNombre: usuario.segundoNombre ?? '',
    primerApellido: usuario.primerApellido,
    segundoApellido: usuario.segundoApellido ?? '',
    telefono: usuario.telefono ?? '',
    rol: usuario.rol,
    competencias: usuario.competencias ?? [],
    fechaAlta: Timestamp.fromDate(usuario.fechaAlta),
  })
}

export async function obtenerUsuarioPendientePorCorreo(
  correo: string
): Promise<UsuarioPendiente | null> {
  const snap = await getDoc(doc(db, 'usuariosPendientes', correoComoId(correo)))
  if (!snap.exists()) return null
  return dataAUsuarioPendiente(snap.data())
}

export async function eliminarUsuarioPendiente(correo: string): Promise<void> {
  await deleteDoc(doc(db, 'usuariosPendientes', correoComoId(correo)))
}

export async function obtenerUsuariosPendientes(): Promise<UsuarioPendiente[]> {
  const snap = await getDocs(collection(db, 'usuariosPendientes'))
  return snap.docs.map((d) => dataAUsuarioPendiente(d.data()))
}

interface FiltrosExpedientes {
  consultorId?: string
  estado?: EstadoExpediente
}

export async function obtenerExpedientes(
  filtros?: FiltrosExpedientes
): Promise<Expediente[]> {
  const restricciones: QueryConstraint[] = []

  if (filtros?.consultorId) {
    restricciones.push(where('consultorId', '==', filtros.consultorId))
  }
  if (filtros?.estado) {
    restricciones.push(where('estado', '==', filtros.estado))
  }

  const q = query(collection(db, 'expedientes'), ...restricciones)
  const snap = await getDocs(q)

  return snap.docs.map((d) => docAExpediente(d.id, d.data()))
}

function docAExpediente(id: string, data: Record<string, unknown>): Expediente {
  return {
    id,
    idEmpresa: data.idEmpresa as string,
    nombreEmpresa: data.nombreEmpresa as string,
    institucion: data.institucion as 'NF' | 'BX',
    programaId: data.programaId as string,
    consultorId: data.consultorId as string,
    estado: data.estado as EstadoExpediente,
    carpetaDriveId: data.carpetaDriveId as string,
    nombreCarpeta: data.nombreCarpeta as string,
    fechaCreacion: timestampADate(data.fechaCreacion),
    fechaEnvio: data.fechaEnvio ? timestampADate(data.fechaEnvio) : undefined,
    fechaAprobacion: data.fechaAprobacion ? timestampADate(data.fechaAprobacion) : undefined,
    fechaCierre: data.fechaCierre ? timestampADate(data.fechaCierre) : undefined,
    creadoPor: data.creadoPor as string,
  }
}

export async function obtenerExpediente(id: string): Promise<Expediente | null> {
  const snap = await getDoc(doc(db, 'expedientes', id))
  if (!snap.exists()) return null
  return docAExpediente(snap.id, snap.data() as Record<string, unknown>)
}

export async function crearExpediente(
  data: Omit<Expediente, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'expedientes'), {
    ...data,
    fechaCreacion: Timestamp.fromDate(data.fechaCreacion),
    fechaCierre: data.fechaCierre ? Timestamp.fromDate(data.fechaCierre) : null,
  })
  return ref.id
}

export async function actualizarEstadoExpediente(
  id: string,
  estado: EstadoExpediente
): Promise<void> {
  const payload: Record<string, unknown> = { estado }

  // guarda fecha de transición según el estado destino
  if (estado === 'enviado_institucion') {
    payload.fechaEnvio = Timestamp.now()
  } else if (estado === 'aprobado_institucion') {
    payload.fechaAprobacion = Timestamp.now()
  }

  await updateDoc(doc(db, 'expedientes', id), payload)
}

export async function actualizarConsultorExpediente(
  expedienteId: string,
  consultorId: string
): Promise<void> {
  await updateDoc(doc(db, 'expedientes', expedienteId), { consultorId })
}

export async function contarExpedientes(): Promise<number> {
  const snap = await getCountFromServer(collection(db, 'expedientes'))
  return snap.data().count
}

export async function obtenerEvidencias(expedienteId: string): Promise<Evidencia[]> {
  const q = query(
    collection(db, 'evidencias'),
    where('expedienteId', '==', expedienteId)
  )
  const snap = await getDocs(q)

  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      expedienteId: data.expedienteId,
      nombre: data.nombre,
      slug: data.slug,
      sesion: data.sesion,
      nombreArchivo: data.nombreArchivo,
      estado: data.estado,
      fileId: data.fileId,
      urlDrive: data.urlDrive,
      comentarioRechazo: data.comentarioRechazo,
      fechaCarga: data.fechaCarga ? timestampADate(data.fechaCarga) : undefined,
      cargadoPor: data.cargadoPor,
      fechaValidacion: data.fechaValidacion
        ? timestampADate(data.fechaValidacion)
        : undefined,
      validadoPor: data.validadoPor,
    } satisfies Evidencia
  })
}

export async function actualizarEvidencia(
  id: string,
  datos: Partial<Evidencia>
): Promise<void> {
  const payload: Record<string, unknown> = { ...datos }

  if (datos.fechaCarga instanceof Date) {
    payload.fechaCarga = Timestamp.fromDate(datos.fechaCarga)
  }
  if (datos.fechaValidacion instanceof Date) {
    payload.fechaValidacion = Timestamp.fromDate(datos.fechaValidacion)
  }

  await updateDoc(doc(db, 'evidencias', id), payload)
}

export async function actualizarEstadoEvidencia(
  id: string,
  estado: EstadoEvidencia,
  comentario?: string,
  validadoPor?: string
): Promise<void> {
  const payload: Record<string, unknown> = {
    estado,
    fechaValidacion: Timestamp.now(),
  }
  if (comentario) payload.comentarioRechazo = comentario
  if (validadoPor) payload.validadoPor = validadoPor

  await updateDoc(doc(db, 'evidencias', id), payload)
}

export async function obtenerConsultores(): Promise<Consultor[]> {
  const snap = await getDocs(collection(db, 'consultores'))

  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
      activo: data.activo,
      fechaAlta: timestampADate(data.fechaAlta),
    } satisfies Consultor
  })
}

export async function crearConsultor(data: Omit<Consultor, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'consultores'), {
    nombre: data.nombre,
    correo: data.correo,
    telefono: data.telefono ?? '',
    activo: data.activo,
    fechaAlta: Timestamp.fromDate(data.fechaAlta),
  })
  return ref.id
}

export async function actualizarConsultor(
  id: string,
  datos: Partial<Consultor>
): Promise<void> {
  await updateDoc(doc(db, 'consultores', id), datos)
}

// actualiza nombre/correo/teléfono en consultores Y en usuarios al mismo tiempo
export async function actualizarConsultorYUsuario(
  consultorId: string,
  usuarioId: string,
  datos: { nombre?: string; correo?: string; telefono?: string }
): Promise<void> {
  await Promise.all([
    updateDoc(doc(db, 'consultores', consultorId), datos),
    updateDoc(doc(db, 'usuarios', usuarioId), datos),
  ])
}

export async function obtenerExpedientesRecientes(cantidad = 5): Promise<Expediente[]> {
  const q = query(
    collection(db, 'expedientes'),
    orderBy('fechaCreacion', 'desc'),
    limit(cantidad)
  )
  const snap = await getDocs(q)

  return snap.docs.map((d) => docAExpediente(d.id, d.data() as Record<string, unknown>))
}

export async function eliminarEvidenciasExpediente(expedienteId: string): Promise<void> {
  const q = query(collection(db, 'evidencias'), where('expedienteId', '==', expedienteId))
  const snap = await getDocs(q)
  const lote = writeBatch(db)
  snap.docs.forEach((d) => lote.delete(d.ref))
  await lote.commit()
}

export async function eliminarExpedienteDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'expedientes', id))
}

export async function resetearEvidencia(id: string): Promise<void> {
  await updateDoc(doc(db, 'evidencias', id), {
    estado: 'pendiente',
    fileId: null,
    urlDrive: null,
    nombreArchivo: null,
    fechaCarga: null,
    cargadoPor: null,
    fechaValidacion: null,
    validadoPor: null,
    comentarioRechazo: null,
  })
}

interface EvidenciaBase {
  expedienteId: string
  nombre: string
  slug: string
  sesion: number | null
  nombreArchivo: string
}

export async function crearEvidenciasExpediente(
  evidencias: EvidenciaBase[]
): Promise<void> {
  // Firestore limita 500 escrituras por batch
  const LOTE = 500
  for (let i = 0; i < evidencias.length; i += LOTE) {
    const lote = writeBatch(db)
    evidencias.slice(i, i + LOTE).forEach((ev) => {
      const ref = doc(collection(db, 'evidencias'))
      lote.set(ref, {
        expedienteId: ev.expedienteId,
        nombre: ev.nombre,
        slug: ev.slug,
        sesion: ev.sesion,
        nombreArchivo: ev.nombreArchivo,
        estado: 'pendiente',
        fileId: null,
        urlDrive: null,
        comentarioRechazo: null,
        fechaCarga: null,
        cargadoPor: null,
        fechaValidacion: null,
        validadoPor: null,
      })
    })
    await lote.commit()
  }
}

export async function contarEvidenciasAprobadas(
  expedienteId: string
): Promise<{ total: number; aprobadas: number }> {
  const [totalSnap, aprobadasSnap] = await Promise.all([
    getCountFromServer(
      query(collection(db, 'evidencias'), where('expedienteId', '==', expedienteId))
    ),
    getCountFromServer(
      query(
        collection(db, 'evidencias'),
        where('expedienteId', '==', expedienteId),
        where('estado', '==', 'aprobado')
      )
    ),
  ])

  return {
    total: totalSnap.data().count,
    aprobadas: aprobadasSnap.data().count,
  }
}

export async function obtenerConsultorActivos(): Promise<Consultor[]> {
  const q = query(
    collection(db, 'consultores'),
    where('activo', '==', true)
  )
  const snap = await getDocs(q)

  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
      activo: data.activo,
      fechaAlta: timestampADate(data.fechaAlta),
    } satisfies Consultor
  })
}

export async function obtenerConsultoresRegistrados(): Promise<Usuario[]> {
  const q = query(
    collection(db, 'usuarios'),
    where('rol', '==', 'consultor'),
    where('activo', '==', true)
  )
  let snap
  try {
    snap = await getDocs(q)
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    console.error('permissions error en: usuarios |', e.code, e.message)
    throw err
  }

  return snap.docs.map((d) => docAUsuario(d.id, d.data()))
}

export async function eliminarComentariosExpediente(expedienteId: string): Promise<void> {
  const q = query(collection(db, 'comentarios'), where('expedienteId', '==', expedienteId))
  const snap = await getDocs(q)
  const lote = writeBatch(db)
  snap.docs.forEach((d) => lote.delete(d.ref))
  await lote.commit()
}

export async function actualizarExpediente(
  id: string,
  datos: Partial<Pick<Expediente, 'nombreEmpresa' | 'consultorId' | 'programaId' | 'institucion' | 'nombreCarpeta'>>
): Promise<void> {
  await updateDoc(doc(db, 'expedientes', id), datos)
}

export async function obtenerTodasEvidencias(): Promise<Evidencia[]> {
  const snap = await getDocs(collection(db, 'evidencias'))
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      expedienteId: data.expedienteId,
      nombre: data.nombre,
      slug: data.slug,
      sesion: data.sesion,
      nombreArchivo: data.nombreArchivo,
      estado: data.estado,
      fileId: data.fileId,
      urlDrive: data.urlDrive,
      comentarioRechazo: data.comentarioRechazo,
      fechaCarga: data.fechaCarga ? timestampADate(data.fechaCarga) : undefined,
      cargadoPor: data.cargadoPor,
      fechaValidacion: data.fechaValidacion ? timestampADate(data.fechaValidacion) : undefined,
      validadoPor: data.validadoPor,
    } satisfies Evidencia
  })
}

export async function crearComentario(
  comentario: Omit<Comentario, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'comentarios'), {
    expedienteId: comentario.expedienteId,
    evidenciaId: comentario.evidenciaId,
    nombreEvidencia: comentario.nombreEvidencia,
    texto: comentario.texto,
    creadoPor: comentario.creadoPor,
    nombreAutor: comentario.nombreAutor,
    rol: comentario.rol,
    fechaCreacion: Timestamp.fromDate(comentario.fechaCreacion),
  })
  return ref.id
}

export function suscribirComentarios(
  expedienteId: string,
  callback: (comentarios: Comentario[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'comentarios'),
    where('expedienteId', '==', expedienteId),
    orderBy('fechaCreacion', 'asc')
  )

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            expedienteId: data.expedienteId,
            evidenciaId: data.evidenciaId,
            nombreEvidencia: data.nombreEvidencia,
            texto: data.texto,
            creadoPor: data.creadoPor,
            nombreAutor: data.nombreAutor,
            rol: data.rol,
            fechaCreacion: timestampADate(data.fechaCreacion),
          } satisfies Comentario
        })
      )
    },
    (err) => {
      console.error('permissions error en: comentarios |', err.code, err.message)
      if (onError) onError(err)
    }
  )
}

export async function eliminarComentario(id: string): Promise<void> {
  await deleteDoc(doc(db, 'comentarios', id))
}

export async function registrarActividad(
  data: Omit<Actividad, 'id'>
): Promise<void> {
  await addDoc(collection(db, 'actividad'), {
    ...data,
    fechaCreacion: Timestamp.fromDate(data.fechaCreacion),
  })
}

export function suscribirActividadReciente(
  cantidad: number,
  callback: (items: Actividad[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'actividad'),
    orderBy('fechaCreacion', 'desc'),
    limit(cantidad)
  )

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            expedienteId: data.expedienteId,
            nombreExpediente: data.nombreExpediente,
            tipoAccion: data.tipoAccion as TipoAccion,
            nombreEvidencia: data.nombreEvidencia,
            nombreUsuario: data.nombreUsuario,
            usuarioId: data.usuarioId,
            fechaCreacion: timestampADate(data.fechaCreacion),
          }
        })
      )
    },
    (err) => {
      console.error('permissions error en: actividad |', err.code, err.message)
      if (onError) onError(err)
    }
  )
}

export interface EvidenciaCargada {
  id: string
  expedienteId: string
  nombre: string
  fechaCarga?: Date
}

export function suscribirCargadasPendientes(
  callback: (cantidad: number, items: EvidenciaCargada[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'evidencias'), where('estado', '==', 'cargado'))
  return onSnapshot(
    q,
    (snap) => {
      const items: EvidenciaCargada[] = snap.docs
        .map((d) => ({
          id: d.id,
          expedienteId: d.data().expedienteId as string,
          nombre: d.data().nombre as string,
          fechaCarga: d.data().fechaCarga ? timestampADate(d.data().fechaCarga) : undefined,
        }))
        .sort((a, b) =>
          (b.fechaCarga?.getTime() ?? 0) - (a.fechaCarga?.getTime() ?? 0)
        )
        .slice(0, 5)
      callback(snap.size, items)
    },
    (err) => {
      console.error('permissions error en: evidencias |', err.code, err.message)
      if (onError) onError(err)
    }
  )
}

export async function limpiarActividadAntigua(): Promise<void> {
  const hace24h = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))
  const q = query(collection(db, 'actividad'), where('fechaCreacion', '<', hace24h))
  const snap = await getDocs(q)
  if (snap.empty) return
  // Firestore limita 500 escrituras por batch
  const LOTE = 500
  for (let i = 0; i < snap.docs.length; i += LOTE) {
    const lote = writeBatch(db)
    snap.docs.slice(i, i + LOTE).forEach((d) => lote.delete(d.ref))
    await lote.commit()
  }
}

export async function limpiarTodaActividad(): Promise<void> {
  const snap = await getDocs(collection(db, 'actividad'))
  if (snap.empty) return
  const LOTE = 500
  for (let i = 0; i < snap.docs.length; i += LOTE) {
    const lote = writeBatch(db)
    snap.docs.slice(i, i + LOTE).forEach((d) => lote.delete(d.ref))
    await lote.commit()
  }
}

