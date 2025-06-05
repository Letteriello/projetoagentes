import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the paths that require authentication
const protectedPaths = ['/profile', '/chat', '/api-key-vault', '/agent-builder', '/agent-monitor', '/firebase-test'];
// Define paths that are public and should not trigger auth checks or redirects to login if already on them
const publicPaths = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authTokenCookie = request.cookies.get('fb-auth-token'); // Conceptual token

  console.log(`Middleware: Intercepting path: ${pathname}`);

  // Avoid redirect loops for public paths and Next.js internals
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') || // Assuming API routes might have their own auth or are public
    pathname.includes('.') // Generally, exclude file requests (e.g., favicon.ico, images)
  ) {
    console.log(`Middleware: Allowing public or internal path: ${pathname}`);
    return NextResponse.next();
  }

  // Check if the current path is protected
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    console.log(`Middleware: Path ${pathname} is protected.`);
    if (!authTokenCookie) {
      console.log(`Middleware: No auth token found. Redirecting ${pathname} to /login.`);
      const loginUrl = new URL('/login', request.url);
      // Preserve search params if any, e.g., for redirecting back after login
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
    console.log(`Middleware: Auth token found. Allowing access to ${pathname}.`);
  }

  return NextResponse.next();
}

// Configure the matcher to specify which paths the middleware should run on.
// This helps to avoid running the middleware on every single request.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - Handled above, but good to be explicit if some API routes are truly public
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Adjust this matcher to be as specific as possible for your protected routes.
     * Or, use a more general matcher if many routes are protected.
     */
    // Example: Match all paths if you have many protected routes and few public ones.
    // '/((?!api|_next/static|_next/image|favicon.ico).*)'
    // For this case, let's match specific top-level protected routes and common needs.
    '/profile/:path*',
    '/chat/:path*',
    '/api-key-vault/:path*',
    '/agent-builder/:path*',
    '/agent-monitor/:path*',
    '/firebase-test/:path*',
    // Add other paths that need protection or specific handling by the middleware
    // The middleware logic itself will further refine if a redirect is needed.
  ],
};
