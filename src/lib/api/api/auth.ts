import { fetch } from 'undici'; // Using undici for fetch in Node.js environment

// --- Configuration (Use Environment Variables) ---
const SFCC_DOMAIN = process.env.SFCC_DOMAIN; // e.g., 'domain.com'
const SFCC_SITE_ID = process.env.SFCC_SITE_ID;
const SFCC_OCAPI_VERSION = process.env.SFCC_OCAPI_VERSION; // e.g., 'v21_6'
const SFCC_CLIENT_ID = process.env.SFCC_CLIENT_ID;
const SFCC_TOKEN_LIFETIME_SECONDS = 1800; // Assume 30 minutes (1800s) as API doesn't return it

// --- Token Cache ---
let cachedToken: { value: string; expiry: number } | null = null;
const TOKEN_LIFETIME_MARGIN_MS = 5 * 60 * 1000; // Refresh 5 mins before assumed expiry

// --- Helper to construct API URLs ---
function getAuthEndpoint(): string {
    if (!SFCC_DOMAIN || !SFCC_SITE_ID || !SFCC_OCAPI_VERSION || !SFCC_CLIENT_ID) {
        throw new Error("SFCC Authentication configuration missing in environment variables.");
    }
    // Ensure domain doesn't have protocol for URL constructor flexibility later if needed
    const cleanDomain = SFCC_DOMAIN.replace(/^https?:\/\//, '');
    return `https://${cleanDomain}/s/${SFCC_SITE_ID}/dw/shop/${SFCC_OCAPI_VERSION}/customers/auth?client_id=${SFCC_CLIENT_ID}`;
}

export async function getSfccApiToken(): Promise<string> {
    const now = Date.now();

    if (cachedToken && now < cachedToken.expiry - TOKEN_LIFETIME_MARGIN_MS) {
        console.log("Using cached SFCC API token.");
        return cachedToken.value;
    }

    console.log("Fetching new SFCC API token...");
    const authEndpoint = getAuthEndpoint();

    try {
        const response = await fetch(authEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // Good practice to accept JSON
            },
            body: JSON.stringify({ type: 'guest' }), // Guest auth request body
        });

        if (!response.ok) {
            // Attempt to read error body for more details
            let errorBody = 'No details provided.';
            try {
                errorBody = await response.text();
            } catch (_) { /* Ignore if reading body fails */ }
            throw new Error(`SFCC Auth failed: ${response.status} ${response.statusText}. Body: ${errorBody}`);
        }

        // Extract Bearer token from the 'Authorization' response header
        const authHeader = response.headers.get('Authorization');
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            // Attempt to parse body for debugging info, although token should be in header
             let responseBody = {};
             try { responseBody = await response.json() as Record<string, unknown>; } catch(_) {}
             console.error("SFCC Auth response body (for debugging):", responseBody);
            throw new Error('Bearer token not found in SFCC auth response header.');
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        cachedToken = {
            value: token,
            expiry: now + (SFCC_TOKEN_LIFETIME_SECONDS * 1000),
        };
        console.log("Successfully fetched and cached new SFCC API token.");
        return cachedToken.value;

    } catch (error) {
        console.error('SFCC API Authentication Error:', error);
        cachedToken = null; // Clear cache on error
        // Re-throw a more specific error or handle as needed
        if (error instanceof Error) {
             throw new Error(`Failed to authenticate with SFCC API: ${error.message}`);
        } else {
             throw new Error(`An unknown error occurred during SFCC authentication.`);
        }
    }
}
