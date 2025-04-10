// src/lib/adapters/sfcc/sfcc.adapter.ts

import type { Response as FetchResponse } from 'undici'; // Or Node fetch equivalent
import type { IEcommerceAdapter, SearchAttributes } from '../../../interfaces/IEcommerceAdapter';
import type { SfccAuthConfig, AuthHeaders } from '../../../interfaces/auth.types'; // Assuming SfccAuthConfig is defined here or imported
import type { IHttpClient, RequestOptions } from '../../../interfaces/httpClient.types';
import type { SfccSearchResponse, SfccDetailsResponse } from './sfcc.types'; // Import SFCC specific types
import { sfccMapper } from './sfcc.mapper'; // Import the mapper object/functions
import type { SfccGuestAuthProvider } from './sfcc.auth'; // Import auth provider TYPE
import type { JewelryDetails } from '../../models/jewelry-details.types'; // Import CANONICAL models
import type { JewelrySummary } from '../../models/jewelry-summary.types'; // Import CANONICAL models

const DEFAULT_SEARCH_COUNT = 5; // Default number of items for search results

// Custom Error for Adapter specific issues
export class SfccAdapterError extends Error {
    constructor(message: string, public details?: unknown) {
        super(message);
        this.name = 'SfccAdapterError';
    }
}

export class SfccAdapter implements IEcommerceAdapter {
    private readonly defaultSearchCount: number;

    constructor(
        // Inject dependencies
        private readonly config: SfccAuthConfig,
        private readonly httpClient: IHttpClient,
        private readonly authProvider: SfccGuestAuthProvider,
        // Injecting the mapper directly for simplicity
        private readonly mapper: typeof sfccMapper,
        defaultSearchCount: number = DEFAULT_SEARCH_COUNT
    ) {
         // Basic validation on injected config could happen here too
         this.defaultSearchCount = defaultSearchCount;
    }

    /**
     * Constructs the base URL for SFCC Shop API requests.
     */
    private getApiBaseUrl(): string {
        // Assuming config validation happened in auth provider or here
        const cleanDomain = this.config.domain.replace(/^https?:\/\//, '');
        return `https://${cleanDomain}/s/${this.config.siteId}/dw/shop/${this.config.ocapiVersion}`;
    }

    /**
     * Helper method to make authenticated requests to the SFCC API.
     */
    private async makeRequest(endpointPath: string, options: RequestOptions = {}): Promise<FetchResponse> {
        const baseUrl = this.getApiBaseUrl();
        const url = `${baseUrl}${endpointPath}`; // Construct full URL

        console.log(`SFCC Adapter: Requesting ${options.method || 'GET'} ${url}`);

        let authHeaders: AuthHeaders = {};
        try {
            authHeaders = await this.authProvider.getAuthHeaders();
        } catch (authError: unknown) {
            if (authError instanceof Error) {
                console.error("SFCC Adapter: Authentication failed.", authError);
                throw new SfccAdapterError(`Authentication failed: ${authError.message}`, authError);
            }
            console.error("SFCC Adapter: Unknown authentication error.", authError);
            throw new SfccAdapterError("Authentication failed due to an unknown error.", authError);
        }

        const defaultHeaders: Record<string, string> = {
            ...authHeaders,
            'Accept': 'application/json', // Default accept header
        };
        // Merge headers, allowing options to override defaults (except potentially auth)
        const mergedOptions: RequestOptions = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {}),
                ...authHeaders, // Ensure auth header isn't overridden
            },
        };

        try {
             // Use the injected httpClient
            const response = await this.httpClient.request(url, mergedOptions);
            console.log(`SFCC Adapter: Response status for ${url}: ${response.status}`);
            return response;
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(`SFCC Adapter: HTTP request failed for ${url}:`, error);
                throw new SfccAdapterError(`HTTP request failed: ${error.message}`, error);
            }
            console.error(`SFCC Adapter: Unknown HTTP error for ${url}:`, error);
            throw new SfccAdapterError("HTTP request failed due to an unknown error.", error);
        }
    }

    /**
     * Builds search parameters for the SFCC Product Search API.
     */
    private buildSearchParams(query?: string, category?: string, attributes?: SearchAttributes): URLSearchParams {
        const searchParams = new URLSearchParams({
            count: String(this.defaultSearchCount),
            start: '0',
            expand: 'images,prices', // Essential expansions for summary
        });

        // Add query term if provided
        if (query) {
            searchParams.set('q', query);
        }

        // Add refinements based on category and attributes
        let refineIndex = 1; // SFCC uses refine_1, refine_2, ...

        // Category refinement
        // if (category) {
        //     // Map canonical category to SFCC cgid if necessary, or use directly
        //     const sfccCategoryId = category; // Simple direct mapping assumption
        //     searchParams.set(`refine_${refineIndex++}`, `cgid=${sfccCategoryId}`);
        // }

        // Price refinement (handle range or target)
        if (attributes?.priceTarget || attributes?.priceMin || attributes?.priceMax) {
            let priceRange = '';
            if (attributes.priceTarget) {
                // Example: +/- 500 around target, floor at 0
                const buffer = 500;
                const min = Math.max(0, attributes.priceTarget - buffer);
                const max = attributes.priceTarget + buffer;
                priceRange = `${min}..${max}`;
            } else if (attributes?.priceMin && attributes?.priceMax) {
                // Use min/max directly
                priceRange = `${attributes.priceMin}..${attributes.priceMax}`;
            } else if (attributes?.priceMin) {
                // Use min/max directly
                priceRange = `${attributes.priceMin}..`;
            } else if (attributes?.priceMax) {
                // Use min/max directly
                priceRange = `0..${attributes.priceMax}`;
            }
            searchParams.set(`refine_${refineIndex++}`, `price=(${priceRange})`);
        } else if (attributes?.priceTier) {
             // Handle qualitative tiers if needed (e.g., map 'cheap' to 'price=(0..100)')
             // console.warn("Price tier refinement not yet implemented in SFCC adapter.");
        }


        // Add other attribute refinements (examples)
        // These require knowing the actual SFCC refinement attribute IDs (e.g., c_metalGroup, c_stoneType)
        // if (attributes?.metalGroup) {
        //     searchParams.set(`refine_${refineIndex++}`, `c_metalGroup=${encodeURIComponent(attributes.metalGroup)}`);
        // }
        // if (attributes?.stone) {
        //     searchParams.set(`refine_${refineIndex++}`, `c_stoneType=${encodeURIComponent(attributes.stone)}`);
        // }
        // if (attributes?.gender) {
        //      searchParams.set(`refine_${refineIndex++}`, `c_gender=${encodeURIComponent(attributes.gender)}`);
        // }
        // Add more refinements for color, carat, style, size as needed, using correct SFCC attribute IDs

        return searchParams;
    }

    /**
     * Implementation of product search.
     */
    async searchProducts(query?: string, category?: string, attributes?: SearchAttributes): Promise<JewelrySummary[]> {
        const searchParams = this.buildSearchParams(query, category, attributes);
        const endpointPath = `/product_search?${searchParams.toString()}`;

        console.log('\n\n', endpointPath, '\n\n')

        const response = await this.makeRequest(endpointPath, { method: 'GET' });

        if (!response.ok) {
            let errorBody = '';
            try { errorBody = await response.text(); } catch { }
            throw new SfccAdapterError(`SFCC search request failed: ${response.status} ${response.statusText}`, { statusCode: response.status, responseBody: errorBody });
        }

        const apiData = await response.json() as SfccSearchResponse;

        if (!apiData || !Array.isArray(apiData.hits)) {
            console.warn("SFCC Adapter: Search response missing 'hits' array.");
            return [];
        }

        console.log(`SFCC Adapter: Mapping ${apiData.hits.length} search hits.`);

        // Use the injected mapper
        return apiData.hits
            .map(hit => this.mapper.mapSearchHitToSummary(hit))
            // Optional: Filter out any results that might be invalid after mapping
            .filter(summary => summary && summary.id);;
    }

    /**
     * Implementation of product details fetch.
     */
    async getProductDetails(productId: string): Promise<JewelryDetails | null> {
        if (!productId) {
            throw new SfccAdapterError("Product ID is required to get details.");
        }

        // Define necessary expansions for details
        const searchParams = new URLSearchParams({
            expand: 'images,prices,availability', // Add variations, options, etc. if needed by mapper
            // Add other necessary parameters like 'inventory_ids' if applicable
        });
        const endpointPath = `/products/${encodeURIComponent(productId)}?${searchParams.toString()}`;

        const response = await this.makeRequest(endpointPath, { method: 'GET' });

        if (response.status === 404) {
            console.log(`SFCC Adapter: Product details not found for ID: ${productId}`);
            return null; // Standard behavior for not found
        }

        if (!response.ok) {
            let errorBody = '';
            try { errorBody = await response.text(); } catch { }
            throw new SfccAdapterError(`SFCC details request failed: ${response.status} ${response.statusText}`, { productId, statusCode: response.status, responseBody: errorBody });
        }

        const apiData = await response.json() as SfccDetailsResponse;

        console.log(`SFCC Adapter: Mapping details response for ID: ${productId}`);
        // Use the injected mapper
        return this.mapper.mapDetailsResponseToDetails(apiData);
    }

    // Implement other IEcommerceAdapter methods if defined...
}
