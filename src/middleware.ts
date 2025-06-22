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
  const accessToken = cookieStore.get('accessToken')?.value;

  // 3) 토큰 없으면 로그인으로
  if (!accessToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 4) 통과하는 경우, 브라우저로 쿠키를 그대로 전달
  const response = NextResponse.next({
    // 여기 cookieStore.toString() 은 "name=val; name2=val2" 형태로 자동 변환됩니다
    headers: {
      'set-cookie': cookieStore.toString(),
    },
  });

  return response;
}

export const config = {
  matcher: '/((?!api/|_next/|.*\\..*).*)',
};
