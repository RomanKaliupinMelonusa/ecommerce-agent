// src/interfaces/httpClient.types.ts
import type { RequestInit, Response } from 'undici'; // Or use Node fetch types if preferred

// Define a basic RequestOptions type if needed, often RequestInit suffices
export type RequestOptions = RequestInit;

export interface IHttpClient {
    /**
     * Performs an HTTP request.
     * @param url The URL to request.
     * @param options Request options (method, headers, body, etc.).
     * @returns A promise resolving to the Response object.
     * @throws Error on network issues or non-ok status codes (implementation dependent).
     */
    request(url: string | URL, options?: RequestOptions): Promise<Response>;
}
