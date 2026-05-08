import { redirect } from 'next/navigation'

// La raíz redirige al inicio de sesión
export default function PaginaRaiz() {
  redirect('/iniciar-sesion')
}
