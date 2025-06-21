// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// → 고성능 토큰 만료 체크 함수 (서명 검증 생략)
function isTokenExpired(token: string) {
  try {
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    return Date.now() > payload.exp * 1000;
  } catch {
    return true;
  }
}

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

  // 4) 토큰 만료 여부만 빠르게 체크
  if (isTokenExpired(accessToken)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 6) 통과하는 경우, 브라우저로 쿠키를 그대로 전달
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
