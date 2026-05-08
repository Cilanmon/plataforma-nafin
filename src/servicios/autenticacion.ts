import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth, proveedorGoogle } from './firebase'

export interface SesionFirebase {
  uid: string
  correo: string
  nombre: string
}

export async function iniciarSesionConGoogle(): Promise<SesionFirebase> {
  const resultado = await signInWithPopup(auth, proveedorGoogle)
  const { uid, email, displayName } = resultado.user

  return {
    uid,
    correo: email ?? '',
    nombre: displayName ?? email ?? uid,
  }
}

export async function cerrarSesion(): Promise<void> {
  await signOut(auth)
}

export function escucharSesion(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback)
}
