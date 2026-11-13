import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite acesso irrestrito à tela de login do gestor
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return NextResponse.next();
  }

  // Verifica se a rota pertence ao escopo administrativo (/admin, /admin/map, etc.)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const sessionToken = request.cookies.get('ecocidadao_admin_session')?.value;

    // Se o cookie de sessão não existir ou não for válido, redireciona para o login
    if (!sessionToken || sessionToken !== 'authenticated') {
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configuração do Matcher para interceptar estritamente as rotas administrativas
export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
