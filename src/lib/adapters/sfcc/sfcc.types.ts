// Represents an image object from SFCC API (e.g., within search hits or details)
export interface SfccImage {
    alt?: string;
    link: string; // URL of the image
    title?: string;
}

// Represents price information (adapt based on actual API usage: prices vs price_info)
export interface SfccPriceInfo {
    currency_mnemonic?: string; // e.g., 'USD'
    list?: number; // Example list price
    sale?: number; // Example sale price
    price?: number; // A single price value if structure is simpler
}

// Represents availability data from SFCC API
export interface SfccAvailability {
    messages?: string[];
    orderable: boolean;
    ats?: number; // Available To Sell quantity
    stock_level?: number; // Alternative stock field
}

// Represents a single product hit in the SFCC product search response
export interface SfccProductHit {
    currency?: string; // Often reflects the request currency
    link?: string; // Link to the product page
    price?: number; // The primary price returned
    price_max?: number; // Max price (for range pricing)
    prices?: Record<string, number>; // Detailed price map (e.g., {'list': 100, 'sale': 80})
    price_per_unit?: number;
    product_id: string;
    product_name?: string;
    product_type?: { master?: boolean; variant?: boolean; /* etc. */ };
    represented_product?: SfccProductHit; // For variant/master relationships
    image?: SfccImage; // Main image associated with the hit
    // Add any other relevant fields returned by the search API
}

// Represents the top-level structure of the SFCC product search response
export interface SfccSearchResponse {
    hits: SfccProductHit[];
    total: number;
    count: number;
    start: number;
    // Include refinement data etc. if needed by the adapter
}

// Represents the structure of the SFCC product details response
export interface SfccDetailsResponse {
    // Standard OCAPI fields
    _type: "product";
    _v?: string;
    id: string;
    name?: string;
    brand?: string;
    currency?: string; // Currency for the prices below
    price?: number; // Primary price
    prices?: Record<string, number>; // Detailed price map
    price_max?: number;
    price_per_unit?: number;
    primary_category_id?: string;
    page_title?: string;
    page_description?: string;
    page_keywords?: string;
    short_description?: string;
    long_description?: string;
    min_order_quantity?: number;
    step_quantity?: number;
    unit?: string;
    type?: { item?: boolean; master?: boolean; variant?: boolean; set?: boolean; bundle?: boolean; /* etc. */ };

    // Custom attributes (dynamic keys starting with c_)
    // Use index signature for flexibility, specific known ones can be added too
    [key: `c_${string}`]: string | number | boolean | undefined;
    c_metalType?: string; // Example specific custom attribute
    c_stoneType?: string; // Example specific custom attribute
    c_caratWeight?: number | string; // Example specific custom attribute

    // Expanded data structures (must match 'expand' query parameter)
    images?: SfccImage[]; // Simplified assumption: array of images
    image_groups?: { view_type: string, images: SfccImage[] }[]; // More complex structure
    price_info?: SfccPriceInfo; // Alternative/detailed pricing
    availability?: SfccAvailability;
    inventory?: SfccAvailability; // Sometimes inventory info is nested here
    variations?: Record<string, unknown>; // Define if needed
    options?: Record<string, unknown>; // Define if needed
    // Add other expanded fields as required
}
