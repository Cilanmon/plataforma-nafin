import { NextResponse, type NextRequest } from 'next/server'

// Firebase SDK no corre en Edge Runtime — usamos cookie `nafin-rol`
// escrita por useAutenticacion para decidir redirecciones.

const RUTAS_GESTOR = ['/inicio', '/expedientes', '/administracion']
const RUTAS_CONSULTOR = ['/mis-servicios']
const RUTAS_PUBLICAS = ['/iniciar-sesion']

function rolDesdeUrl(pathname: string): 'gestor' | 'consultor' | null {
  if (RUTAS_GESTOR.some((r) => pathname.startsWith(r))) return 'gestor'
  if (RUTAS_CONSULTOR.some((r) => pathname.startsWith(r))) return 'consultor'
  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rolCookie = request.cookies.get('nafin-rol')?.value as
    | 'gestor'
    | 'consultor'
    | undefined
  const haySesion = !!rolCookie

  // ruta pública con sesión activa → redirige a la home del rol
  if (RUTAS_PUBLICAS.includes(pathname) && haySesion) {
    const destino =
      rolCookie === 'gestor' ? '/inicio' : '/mis-servicios'
    return NextResponse.redirect(new URL(destino, request.url))
  }

  // ruta protegida sin sesión → login
  const rolRequerido = rolDesdeUrl(pathname)
  if (rolRequerido && !haySesion) {
    const url = new URL('/iniciar-sesion', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // ruta protegida con rol incorrecto → home del rol real
  if (rolRequerido && rolCookie && rolCookie !== rolRequerido) {
    const destino =
      rolCookie === 'gestor' ? '/inicio' : '/mis-servicios'
    return NextResponse.redirect(new URL(destino, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // excluye assets estáticos y API routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
