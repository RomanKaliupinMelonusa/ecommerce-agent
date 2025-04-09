import { fetch, RequestInit, Response } from 'undici';
import type { IHttpClient, RequestOptions } from '../../interfaces/httpClient.types';

export class UndiciHttpClient implements IHttpClient {
    async request(url: string | URL, options?: RequestOptions): Promise<Response> {
        try {
            const response = await fetch(url, options as RequestInit);
            // Optional: Check for non-OK status and throw standardized error
            // if (!response.ok) {
            //     throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            // }
            return response;
        } catch (error) {
            // Add standardized error handling/logging
            console.error(`HTTP request failed for ${url}:`, error);
            throw error; // Re-throw or wrap in a custom HttpClientError
        }
    }
}
