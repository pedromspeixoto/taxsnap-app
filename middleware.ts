import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtService } from './lib/utils/jwt';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/register'];

// Define public API routes - everything else is private by default
const publicApiRoutes = [
  'GET /api/health',
  'POST /api/auth/login',
  'POST /api/auth/refresh',
  'POST /api/users',
  'POST /api/users/verify',
];

// Helper function to check if a route matches the request
function isRouteMatch(route: string, method: string, pathname: string): boolean {
  // If route includes method (e.g., "POST /api/users"), check both method and path
  if (route.includes(' ')) {
    const [routeMethod, routePath] = route.split(' ', 2);
    if (method !== routeMethod) return false;
    return matchesPath(routePath, pathname);
  }
  // If route doesn't include method, it applies to all methods for that path
  return matchesPath(route, pathname);
}

// Helper function to match paths with dynamic parameters
function matchesPath(routePath: string, pathname: string): boolean {
  // If no dynamic parameters, use exact match for security
  if (!routePath.includes(':')) {
    return pathname === routePath;
  }
  
  // Convert route pattern to regex for exact matching with parameters
  // Replace :param with ([^/]+) to match any characters except forward slash
  const regexPattern = routePath
    .replace(/:[^/]+/g, '([^/]+)')  // Replace :param with capture group
    .replace(/\//g, '\\/');         // Escape forward slashes
  
  const regex = new RegExp(`^${regexPattern}$`); // Exact match only
  return regex.test(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Check if it's an API route
  const isApiRoute = pathname.startsWith('/api');
  const isPublicApiRoute = publicApiRoutes.some(route => isRouteMatch(route, method, pathname));
  
  // Get the JWT token from the request
  const token = request.cookies.get('taxsnap_access_token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');

  // Handle API routes
  if (isApiRoute) {
    // Allow public API routes
    if (isPublicApiRoute) {
      return NextResponse.next();
    }
    
    // All other API routes are protected by default
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    try {
      const payload = await jwtService.verifyAccessToken(token);
      
      // Add user info to headers for API routes to use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-email', payload.email);
      requestHeaders.set('x-user-verified', payload.verified.toString());
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  }

  // Handle page routes
  // If accessing protected route without token, redirect to home
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If accessing protected route with token, verify it
  if (isProtectedRoute && token) {
    try {
      const payload = await jwtService.verifyAccessToken(token);
      
      // Check if user is verified for certain routes
      if (pathname.startsWith('/dashboard') && !payload.verified) {
        return NextResponse.redirect(new URL('/verify-account', request.url));
      }
      
      // Token is valid, proceed
      return NextResponse.next();
    } catch {
      // Invalid token, redirect to home
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('taxsnap_access_token');
      response.cookies.delete('taxsnap_refresh_token');
      return response;
    }
  }

  // If accessing auth routes while authenticated, redirect to dashboard
  if (isAuthRoute && token) {
    try {
      const payload = await jwtService.verifyAccessToken(token);
      if (payload.verified) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Invalid token, let them access auth routes
    }
  }

  // If accessing home page with invalid token, clear cookies to prevent client-side confusion
  if (pathname === '/' && token) {
    try {
      await jwtService.verifyAccessToken(token);
      // Token is valid, proceed normally
      return NextResponse.next();
    } catch {
      // Invalid token, clear cookies and proceed to home page
      const response = NextResponse.next();
      response.cookies.delete('taxsnap_access_token');
      response.cookies.delete('taxsnap_refresh_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',  // Add home page to allow middleware to clean up invalid tokens
    '/dashboard/:path*', 
    '/login', 
    '/register',
    '/api/:path*',  // Protect all API routes (public routes are handled in middleware logic)
  ]
}; 