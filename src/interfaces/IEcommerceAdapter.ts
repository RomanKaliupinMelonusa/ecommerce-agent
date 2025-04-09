import type { JewelrySummary } from '../lib/models/jewelry-summary.types';
import type { JewelryDetails } from '../lib/models/jewelry-details.types';

export interface SearchAttributes {
    stone?: string;
    stoneColor?: string;
    minCaratTotalWeight?: string; // Keep as string from allowedCaratWeights
    gender?: string;
    metalGroup?: string;
    ringStyle?: string;
    size?: string;
    priceMin?: number;
    priceMax?: number;
    priceTarget?: number;
    priceTier?: string;
}

// Interface defining the contract for any e-commerce API provider
export interface IEcommerceAdapter {
    /**
     * Searches for products based on query, category, and attributes.
     * @param query - General search query string.
     * @param category - Product category filter.
     * @param attributes - Object containing specific attribute filters (price, stone, metal, etc.).
     * @returns A promise resolving to an array of product summaries.
     */
    searchProducts(
        query?: string,
        category?: string,
        attributes?: SearchAttributes
    ): Promise<JewelrySummary[]>;

    /**
     * Retrieves detailed information for a specific product ID.
     * @param productId - The unique identifier of the product.
     * @returns A promise resolving to the product details or null if not found.
     */
    getProductDetails(productId: string): Promise<JewelryDetails | null>;

    // Define other common methods like findOrder, addToCart etc. if needed
}
