// src/lib/adapters/sfcc/sfcc.auth.ts

import type { Response } from 'undici'; // Or Node fetch equivalent
import type { AuthHeaders, SfccAuthConfig } from '../../../interfaces/auth.types';
import type { ICacheService } from '../../../interfaces/cache.types';
import type { IHttpClient, RequestOptions } from '../../../interfaces/httpClient.types';
import type { ITimeProvider } from '../../../interfaces/time.types';

const CACHE_KEY = 'sfcc:guest-auth-token';
// Default assumption if not provided in config, but configurable is better
const DEFAULT_ASSUMED_LIFETIME_SECONDS = 1800;
// Refresh token this many milliseconds before it's assumed to expire
const TOKEN_LIFETIME_MARGIN_MS = 5 * 60 * 1000;

// Custom Error for specific auth issues
export class SfccAuthError extends Error {
    public readonly details?: unknown;
    constructor(message: string, details?: unknown) {
        super(message);
        this.name = 'SfccAuthError';
        this.details = details; // Attach extra context if needed
    }
}

interface CachedToken {
    value: string;
    expiry: number; // Expiry timestamp in milliseconds
}

export class SfccGuestAuthProvider {
    private readonly assumedTokenLifetimeSeconds: number;
    private readonly config: SfccAuthConfig; // Store config if needed elsewhere

    constructor(
        config: SfccAuthConfig, // Renamed for clarity in constructor
        private readonly httpClient: IHttpClient,
        private readonly cache: ICacheService,
        private readonly time: ITimeProvider
    ) {
        // Validate essential configuration on instantiation
        const requiredKeys: (keyof SfccAuthConfig)[] = ['domain', 'siteId', 'ocapiVersion', 'clientId'];
        const missingKeys = requiredKeys.filter(key => !config[key]);
        if (missingKeys.length > 0) {
            throw new SfccAuthError("SFCC Authentication configuration incomplete.", { missing: missingKeys });
        }
        this.config = { ...config }; // Store a copy

        this.assumedTokenLifetimeSeconds = config.assumedTokenLifetimeSeconds ?? DEFAULT_ASSUMED_LIFETIME_SECONDS;
        // Log only once during instantiation
        console.warn(`SFCC Guest Auth Provider: Initialized with assumed token lifetime of ${this.assumedTokenLifetimeSeconds} seconds. Please verify this setting.`);
    }

    /**
     * Constructs the full URL for the SFCC customers/auth endpoint.
     */
    private getAuthEndpoint(): URL {
        const cleanDomain = this.config.domain.replace(/^https?:\/\//, '');
        const siteId = this.config.siteId;
        const ocapiVersion = this.config.ocapiVersion;
        const clientId = this.config.clientId;
        const url = new URL(`https://${cleanDomain}/s/${siteId}/dw/shop/${ocapiVersion}/customers/auth`);
        url.searchParams.append('client_id', clientId);

        return url;
    }

    /**
     * Fetches a new guest token from the SFCC API.
     */
    private async fetchNewToken(): Promise<string> {
        console.log("SFCC Guest Auth Provider: Fetching new API token...");
        const authEndpoint = this.getAuthEndpoint();
        const requestOptions: RequestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ type: 'guest' }),
        };

        let response: Response;
        try {
            response = await this.httpClient.request(authEndpoint, requestOptions);
        } catch (error: unknown) {
            await this.cache.delete(CACHE_KEY); // Invalidate cache on network/request error
            if (error instanceof Error) {
                throw new SfccAuthError(`Network or HTTP client error during SFCC auth request: ${error.message}`, error);
            }
            throw new SfccAuthError(`Unknown error during SFCC auth request.`, error);
        }

        if (!response.ok) {
            await this.cache.delete(CACHE_KEY); // Invalidate cache on API error
            let errorBody = 'No error body available.';
            try {
                // Check content-type before parsing if possible, otherwise just try text
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                     errorBody = JSON.stringify(await response.json());
                } else {
                     errorBody = await response.text();
                }
            } catch {
                errorBody = `Failed to parse error body (Status: ${response.status}).`;
            }
            throw new SfccAuthError(`SFCC Auth API request failed: ${response.status} ${response.statusText}.`, { statusCode: response.status, body: errorBody });
        }

        // Extract Bearer token from the 'Authorization' response header
        const authHeader = response.headers.get('Authorization');
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            await this.cache.delete(CACHE_KEY); // Invalidate cache on unexpected response
        let responseBodyForDebug: unknown = {};
            try { responseBodyForDebug = await response.json() as unknown; } catch {} // Try to get body for debug context
            throw new SfccAuthError('Bearer token not found or invalid in SFCC auth response header.', { responseBody: responseBodyForDebug });
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix
        const now = this.time.now();
        const expiry = now + (this.assumedTokenLifetimeSeconds * 1000);

        // Cache the new token with calculated expiry
        try {
            await this.cache.set<CachedToken>(CACHE_KEY, { value: token, expiry: expiry }, this.assumedTokenLifetimeSeconds);
        } catch (cacheError: unknown) {
            if (cacheError instanceof Error) {
                console.error(`SFCC Guest Auth Provider: Failed to cache token: ${cacheError.message}`, cacheError);
            } else {
                console.error(`SFCC Guest Auth Provider: Failed to cache token.`, cacheError);
            }
        }

        console.log("SFCC Guest Auth Provider: Successfully fetched and cached new API token.");
        return token;
    }

    /**
     * Retrieves a valid SFCC guest API token, using cache if possible.
     * @returns {Promise<string>} The bearer token string.
     * @throws {SfccAuthError} If unable to retrieve or fetch a valid token.
     */
    async getToken(): Promise<string> {
        const now = this.time.now();
        let cached: CachedToken | null = null;

        try {
             cached = await this.cache.get<CachedToken>(CACHE_KEY);
        } catch (cacheError: unknown) {
             if (cacheError instanceof Error) {
                 console.error(`SFCC Guest Auth Provider: Failed to retrieve token from cache: ${cacheError.message}`, cacheError);
             } else {
                 console.error(`SFCC Guest Auth Provider: Failed to retrieve token from cache.`, cacheError);
             }
             // Proceed to fetch new token if cache read fails
        }

        if (cached && now < cached.expiry - TOKEN_LIFETIME_MARGIN_MS) {
            console.log("SFCC Guest Auth Provider: Using cached API token.");
            return cached.value;
        } else if (cached) {
             console.log("SFCC Guest Auth Provider: Cached token expired or nearing expiry.");
             // Don't return expired token, proceed to fetch new one
        } else {
             console.log("SFCC Guest Auth Provider: No valid token in cache.");
        }

        // If cache miss or token expired/invalid, fetch a new one
        return await this.fetchNewToken();
    }

    /**
     * Generates the Authorization header object for SFCC API calls using the guest token.
     * @returns {Promise<AuthHeaders>} Header object: { Authorization: 'Bearer <token>' }.
     * @throws {SfccAuthError} If unable to retrieve a valid token.
     */
    async getAuthHeaders(): Promise<AuthHeaders> {
        const token = await this.getToken();
        return { Authorization: `Bearer ${token}` };
    }
}
