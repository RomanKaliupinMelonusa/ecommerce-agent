// src/lib/api/providers/sfcc/client.ts

import { fetch } from 'undici';
import type { JewelryApiProvider } from '../types';
import type { JewelrySummary } from '../../../models/jewelry-summary.types';
import type { JewelryDetails } from '../../../models/jewelry-details.types';
import { getSfccApiToken } from '../../api/auth';

// --- Configuration (Use Environment Variables) ---
const SFCC_DOMAIN = process.env.SFCC_DOMAIN;
const SFCC_SITE_ID = process.env.SFCC_SITE_ID;
const SFCC_OCAPI_VERSION = process.env.SFCC_OCAPI_VERSION;
const DEFAULT_SEARCH_COUNT = 3;

// --- SFCC API Response Interfaces ---

// Interface for SFCC Search Response
interface SfccSearchResponse {
    hits: SfccProductHit[]; // Array of product hits
    total: number; // Total number of results
    count: number; // Number of results in this response
    start: number; // Starting index of results
    // Add other fields if needed based on the API response
}

// Interface for Image data (assuming structure based on expand=images)
interface SfccImage {
    alt?: string;
    link: string; // URL of the image
    title?: string;
}

// Interface for Price data (assuming structure based on expand=prices)
interface SfccPriceInfo {
    currency_mnemonic?: string; // e.g., 'USD'
    // Prices might be nested, e.g., under 'list' or 'sale' pricebook IDs
    list?: number;
    sale?: number;
    // Or a single value might be present
    price?: number;
}

// Interface for Availability data (assuming structure based on expand=availability)
interface SfccAvailability {
    messages?: string[];
    orderable: boolean;
    // ATS (Available To Sell) value is often used for stock
    ats?: number;
    stock_level?: number; // Alternative stock field sometimes used
}

// Interface for Product Search Hits (from previous step)
interface SfccProductHit {
    currency?: string;
    link?: string;
    price?: number;
    price_max?: number;
    prices?: Record<string, number>;
    price_per_unit?: number;
    product_id: string;
    product_name?: string;
    product_type?: { master?: boolean; variant?: boolean; /* etc. */ };
    represented_product?: SfccProductHit;
    image?: SfccImage; // e.g., { default: [...], large: [...] }
}

// --- Interface for Product Details Response ---
// Based on provided example + assumptions for expanded data
interface SfccDetailsResponse {
    inventory: any;
    currency: string;
    price: number;
    image_groups: any;
    _type: "product";
    _v?: string;
    id: string; // Product ID
    name?: string; // Product Name
    brand?: string;
    primary_category_id?: string;
    page_title?: string;
    page_description?: string;
    page_keywords?: string;
    short_description?: string;
    long_description?: string; // Often used for detailed description
    min_order_quantity?: number;
    step_quantity?: number;
    type?: { item?: boolean; master?: boolean; variant?: boolean; /* etc. */ };
    // Custom attributes (dynamic keys starting with c_)
    [key: `c_${string}`]: any;
    // Expanded data (Needs matching 'expand' parameter in request)
    images?: Record<string, SfccImage[]>; // Same structure as in search hits
    price_info?: SfccPriceInfo; // If using OCAPI price_info expansion
    prices?: Record<string, number>; // Alternative price expansion
    availability?: SfccAvailability;
    // Other potential expansions: variations, options, bundled_products etc.
}


// --- Helper to construct API URLs ---
function getApiBaseUrl(): string {
    if (!SFCC_DOMAIN || !SFCC_SITE_ID || !SFCC_OCAPI_VERSION) {
        throw new Error("SFCC configuration missing in environment variables.");
    }
    const cleanDomain = SFCC_DOMAIN.replace(/^https?:\/\//, '');
    return `https://${cleanDomain}/s/${SFCC_SITE_ID}/dw/shop/${SFCC_OCAPI_VERSION}`;
}

// --- SFCC API Client Implementation ---
export class SfccApiClient implements JewelryApiProvider {
    private async getToken(): Promise<string> {
        return getSfccApiToken();
    }

    // --- searchProducts Method (from previous step, slightly refined mapping) ---
    async searchProducts(query: string, category: string, attributes: object): Promise<JewelrySummary[]> {
        const token = await this.getToken();
        const baseEndpoint = `${getApiBaseUrl()}/product_search`;

        console.log('\n\n', query, attributes, category, '\n\n');

        const searchParams = new URLSearchParams({
            count: String(DEFAULT_SEARCH_COUNT),
            start: '0',
            expand: 'images,prices',
        });

        // Clarify search query
        let indx = 1;
        if (attributes?.priceTarget || (attributes?.priceMin && attributes?.priceMax)) {
            let priceRange = '';

            if (attributes.priceTarget) {
                priceRange = attributes.priceTarget - 500 < 0 ? `0..${attributes.priceTarget * 2}` : `${attributes.priceTarget - 500}..${attributes.priceTarget + 500}`;
            } else {
                priceRange = `${attributes.priceMin}..${attributes.priceMax}`;
            }

            searchParams.append(`refine_${indx}`, `price=(${priceRange})`);
            indx += 1;
        }
        // if (category) {
        //     searchParams.append(`refine_${indx}`, `cgid=${category}`);
        //     indx += 1;
        // }
        // Add more refinements as needed

        const q = encodeURIComponent(`${attributes?.metalGroup || ''} ${query} ${attributes?.stone || ''} ${attributes?.minCaratTotalWeight || ''}`);
        const fullUrl = `${baseEndpoint}?q=${q}&${searchParams.toString()}`;

        console.log(`Calling SFCC Search API: ${fullUrl}`);

        try {
            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Added Authorization header
                    'Accept': 'application/json',
                }
            }); // Fetch logic as before
            if (!response.ok) { /* ... error handling ... */ throw new Error(`SFCC Search API failed: ${response.status}`); }
            const apiData = await response.json() as SfccSearchResponse;

            if (!apiData || !Array.isArray(apiData.hits)) { return []; }

            console.log(`Mapping ${apiData.hits.length} SFCC search hits...`);
            return apiData.hits.map((hit): JewelrySummary => {
                const productData = hit;
                const image = productData.image;
                let imageUrl: string | undefined = undefined;

                // Refined image extraction
                if (image) {
                    imageUrl = image.link;
                }

                const price = productData.price ?? productData.prices?.list ?? productData.prices?.sale ?? 0;
                const currency = productData.currency ?? 'USD';

                return {
                    id: productData.product_id,
                    name: productData.product_name || 'Unknown Item',
                    imageUrl: imageUrl,
                    price: price,
                    currency: currency,
                    metalType: undefined, // Placeholder
                };
            }).filter(item => item.id);

        } catch (error) { /* ... error handling ... */ throw error; } // Re-throw for route handler
    }


    // --- getProductDetails Method (New Implementation) ---
    async getProductDetails(productId: string): Promise<JewelryDetails | null> {
        const token = await this.getToken();
        const baseEndpoint = `${getApiBaseUrl()}/products/${productId}`;

        // Define necessary expansions for details
        const searchParams = new URLSearchParams({
            expand: 'images,prices,availability', // Add other expansions like variations if needed
            // all_images: 'true', // Optional: if you need all images, not just default views
        });
        const fullUrl = `${baseEndpoint}?${searchParams.toString()}`;

        console.log(`Calling SFCC Details API: ${fullUrl}`);

        try {
            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            if (response.status === 404) {
                console.log(`SFCC Product Details not found for ID: ${productId}`);
                return null; // Item not found
            }

            if (!response.ok) {
                let errorBody = 'No details provided.';
                try { errorBody = await response.text(); } catch (_) { }
                throw new Error(`SFCC Details API failed: ${response.status} ${response.statusText}. Body: ${errorBody}`);
            }

            const apiData = await response.json() as SfccDetailsResponse;

            // --- Map SfccDetailsResponse -> JewelryDetails ---
            console.log(`Mapping SFCC details response for ID: ${productId}`);

            // Image mapping (similar to search)
            const images = apiData.image_groups[0]?.images;
            let imageUrl: string | undefined = undefined;
            if (images) {
                imageUrl = images[0]?.link; // Assuming first image is the main one
            }

            // Price mapping (adapt based on actual 'prices' or 'price_info' structure)
            const price = apiData.price || 0;
            const currency = apiData.currency ?? 'USD'; // Prefer price_info currency if available

            // Description mapping (prioritize long description)
            const description = apiData.long_description || apiData.short_description || apiData.page_description || '';

            // Stock mapping (use ATS or stock_level if available)
            const stock = apiData.inventory?.ats ?? apiData.inventory?.stock_level ?? (apiData.inventory?.orderable ? 1 : 0); // Example logic: 1 if orderable but no count

            // Specifications mapping (extract custom attributes 'c_*')
            const specifications: Record<string, string> = {};
            for (const key in apiData) {
                if (key.startsWith('c_') && typeof ((apiData as unknown) as Record<string, unknown>)[key] === 'string') {
                    // Simple mapping: remove 'c_' prefix and format key
                    const specKey = key.substring(2).replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()); // e.g., c_metalType -> Metal Type
                    specifications[specKey] = ((apiData as unknown) as Record<string, unknown>)[key] as string;
                }
                // Add more complex mapping for non-string custom attributes if needed
            }
            // Optionally map known standard fields to specifications too
            if (apiData.brand) specifications['Brand'] = apiData.brand;


            // Extract jewelry specific fields from custom attributes if possible
            const metalType = apiData.c_metalType as string || undefined; // Example: assumes c_metalType exists
            const stoneType = apiData.c_stoneType as string || undefined; // Example: assumes c_stoneType exists
            const caratWeight = typeof apiData.c_caratWeight === 'number' ? apiData.c_caratWeight : undefined; // Example

            // Construct the internal model
            const details: JewelryDetails = {
                id: apiData.id,
                name: apiData.name || 'Unknown Item',
                imageUrl: imageUrl,
                price: price,
                currency: currency,
                metalType: metalType, // Mapped from custom attribute
                description: description,
                stock: stock,
                stoneType: stoneType, // Mapped from custom attribute
                caratWeight: caratWeight, // Mapped from custom attribute
                specifications: specifications,
            };

            return details;

        } catch (error) {
            console.error(`SFCC Details API Client Error for ID ${productId}:`, error);
            if (error instanceof Error) {
                throw new Error(`Failed to get SFCC product details: ${error.message}`);
            } else {
                throw new Error(`An unknown error occurred while fetching SFCC product details.`);
            }
        }
    }
}
