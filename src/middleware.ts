import { NextRequest, NextResponse } from 'next/server';

// Credentials from environment variables
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;

export function middleware(req: NextRequest) {
    // 1. Only run in production environment
    if (process.env.NODE_ENV !== 'production') {
        return NextResponse.next(); // Allow request in non-production envs
    }

    // 2. Check if Basic Auth credentials are set in environment
    if (!BASIC_AUTH_USER || !BASIC_AUTH_PASSWORD) {
        console.error(
            'ERROR: Basic Auth credentials (BASIC_AUTH_USER, BASIC_AUTH_PASSWORD) are not set in the environment.'
        );
        // Optionally return a specific error page or just deny access
        // Denying access is safer if auth is misconfigured in production
         return new Response('Authentication Required', {
             status: 401,
             headers: {
                 'WWW-Authenticate': 'Basic realm="Restricted Area"',
             },
         });
    }

    // 3. Check for Authorization header
    const authHeader = req.headers.get('authorization');

    if (authHeader) {
        const authValue = authHeader.split(' ')[1]; // Get value after "Basic "
        // Decode Base64
        const decodedValue = atob(authValue); // atob is available in Edge Runtime
        const [user, pwd] = decodedValue.split(':');

        // 4. Compare credentials (Simple comparison - consider timing attacks for highly sensitive data)
        const isUserValid = user === BASIC_AUTH_USER;
        const isPasswordValid = pwd === BASIC_AUTH_PASSWORD;

        if (isUserValid && isPasswordValid) {
            // Valid credentials, allow request
            return NextResponse.next();
        }
    }

    // 5. If no header or invalid credentials, request authentication
    return new Response('Authentication Required', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Restricted Area"', // Browser shows this realm
        },
    });
}

// Configuration for the middleware
export const config = {
    /*
     * Match all request paths except for assets, Next.js internals,
     * and potentially API routes if you don't want them protected.
     * Adjust the matcher based on your needs. This example protects
     * essentially all navigable pages and potentially API routes.
     */
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
     // To protect EVERYTHING including API routes, you might use a simpler matcher
     // or remove it entirely (though excluding static assets is usually desired)
     // matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] // Protects pages + api
     // No matcher: protects literally everything including static assets (usually not ideal)
};
