import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) 로그인, 회원가입 등 공개 경로는 통과
  if (pathname === "/login" || pathname === "/signup") {
    return NextResponse.next();
  }

  const token = req.cookies.get('accessToken')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // 토큰 검증 실패 시 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: "/((?!.*\\.|api\\/).*)",
};

