import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/candidate/login',
  '/candidate/register',
];

const HR_PATHS = ['/dashboard', '/upload-resume', '/job-description', '/results', '/reports', '/messages', '/profile', '/admin', '/jobs', '/home'];
const CANDIDATE_PATHS = ['/candidate/dashboard', '/candidate/jobs', '/candidate/applications', '/candidate/resume', '/candidate/messages', '/candidate/profile'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    const isCandidate = pathname.startsWith('/candidate');
    const loginUrl = new URL(isCandidate ? '/candidate/login' : '/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
