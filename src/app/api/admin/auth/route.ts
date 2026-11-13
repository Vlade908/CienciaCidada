import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const VALID_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY || 'admin123';
const COOKIE_NAME = 'ecocidadao_admin_session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessKey = body?.accessKey ? String(body.accessKey).trim() : '';

    if (!accessKey) {
      return NextResponse.json(
        { success: false, message: 'Por favor, informe a chave de acesso.' },
        { status: 400 }
      );
    }

    if (accessKey !== VALID_ACCESS_KEY) {
      return NextResponse.json(
        { success: false, message: 'Chave de acesso incorreta. Tente novamente.' },
        { status: 401 }
      );
    }

    // Cria a resposta de sucesso e grava o cookie HTTP-Only seguro
    const response = NextResponse.json({
      success: true,
      message: 'Acesso institucional autorizado.',
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: 'authenticated',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias de persistência
    });

    return response;
  } catch (err) {
    console.error('[API Auth] Falha ao processar login:', err);
    return NextResponse.json(
      { success: false, message: 'Erro interno ao validar credenciais.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Sessão administrativa finalizada.',
    });

    // Remove o cookie expirando-o imediatamente
    response.cookies.set({
      name: COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error('[API Auth] Falha ao efetuar logout:', err);
    return NextResponse.json(
      { success: false, message: 'Erro ao encerrar sessão.' },
      { status: 500 }
    );
  }
}
