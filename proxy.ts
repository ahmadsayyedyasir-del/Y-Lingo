// frontend/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy is intentionally simplified.
 * 
 * Authentication is now handled by:
 * - AuthContext (client-side)
 * - Protected routes via page-level checks
 * 
 * Proxy does NOT enforce authentication to avoid
 * localStorage vs cookie mismatch issues.
 * 
 * Only redirects to login for truly public routes
 * that should not be accessible to logged-in users.
 */
export function proxy(request: NextRequest): NextResponse {
  const path: string = request.nextUrl.pathname;

  // Public routes that should redirect to dashboard if user is already logged in
  // Note: We can't reliably check auth here since token is in localStorage
  // So we skip auth checks entirely in proxy
  
  // Allow all routes to pass through
  // Auth is handled client-side by AuthContext and protected route checks
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};