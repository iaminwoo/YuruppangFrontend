// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) 공개 경로는 무조건 통과
  if (pathname === '/login' || pathname === '/login/sign-up') {
    return NextResponse.next();
  }

  // 2) 쿠키스토어에서 accessToken 꺼내기
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  // 3) 토큰 없으면 로그인으로
  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4) refreshToken이 있으면 그냥 통과
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api/|_next/|.*\\..*).*)',
};
