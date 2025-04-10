import type { SfccProductHit, SfccDetailsResponse, SfccImage, SfccPriceInfo, SfccAvailability } from './sfcc.types';
// Ensure these are the canonical models!
import type { JewelryDetails } from '../../models/jewelry-details.types';
import type { JewelrySummary } from '../../models/jewelry-summary.types';

// Helper to safely extract the primary image URL
function extractImageUrl(image?: SfccImage, image_groups?: { images: SfccImage[] }[]): string | undefined {
    if (image?.link) return image.link;
    if (image_groups?.[0]?.images?.[0]?.link) return image_groups[0].images[0].link; // Example: First image of first group
    return undefined;
}

// Helper to determine the most relevant price
function extractPrice(price?: number, prices?: Record<string, number>, price_info?: SfccPriceInfo): number {
    // Prioritize specific price fields if available, e.g., sale price
    if (prices?.sale) return prices.sale;
    if (prices?.list) return prices.list;
    if (price_info?.sale) return price_info.sale;
    if (price_info?.list) return price_info.list;
    if (price) return price;
    if (price_info?.price) return price_info.price;
    return 0; // Default if no price found
}

// Helper to determine currency
function extractCurrency(currency?: string, price_info?: SfccPriceInfo): string {
    return price_info?.currency_mnemonic || currency || 'USD'; // Default to USD
}

// Helper to determine stock level
function extractStock(availability?: SfccAvailability, inventory?: SfccAvailability): number {
    const av = availability || inventory; // Use whichever is present
    if (typeof av?.ats === 'number' && av.ats >= 0) return av.ats;
    if (typeof av?.stock_level === 'number' && av.stock_level >= 0) return av.stock_level;
    // Fallback: If orderable assume at least 1, otherwise 0
    return av?.orderable ? 1 : 0;
}

interface SfccProductHitWithCustom extends SfccProductHit {
    c_metalType?: string;
}

// Maps an SFCC search hit to the canonical JewelrySummary model
export function mapSfccSearchHitToJewelrySummary(hit: SfccProductHit): JewelrySummary {
    const productData = hit as SfccProductHitWithCustom; // Use represented product if available

    return {
        id: productData.product_id,
        name: productData.product_name || 'Unknown Item',
        imageUrl: extractImageUrl(productData.image),
        price: extractPrice(productData.price, productData.prices),
        currency: extractCurrency(productData.currency),
        // Add other summary fields if available directly in hit (e.g., metal type if customized)
        metalType: productData.c_metalType || undefined, // Example if custom attr is in search hit
    };
}

// Maps an SFCC product details response to the canonical JewelryDetails model
export function mapSfccDetailsResponseToJewelryDetails(details: SfccDetailsResponse): JewelryDetails {
    const specifications: Record<string, string> = {};
    let mappedMetalType: string | undefined = undefined;
    let mappedStoneType: string | undefined = undefined;
    let mappedCaratWeight: number | undefined = undefined;

    // Map custom attributes (c_*) to specifications and potentially known fields
    for (const key in details) {
        if (key.startsWith('c_')) {
            const value = (details as unknown as Record<string, unknown>)[key];
            const specKey = key.substring(2) // Remove 'c_'
                             .replace(/_/g, ' ') // Replace underscores with spaces
                             .replace(/([A-Z])/g, ' $1') // Add space before capitals
                             .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter

            // Simple string mapping for specifications record
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                specifications[specKey] = String(value);
            }
            // Add more complex handling for objects/arrays if needed

            // Specific mapping for known custom attributes to canonical fields
            if (key === 'c_metalType' && typeof value === 'string') mappedMetalType = value;
            if (key === 'c_stoneType' && typeof value === 'string') mappedStoneType = value;
            if (key === 'c_caratWeight' && typeof value === 'number') mappedCaratWeight = value;
            // Handle string carat weight if needed: else if (key === 'c_caratWeight' && typeof value === 'string') mappedCaratWeight = parseFloat(value) || undefined;
        }
    }
     // Add standard fields to specifications if desired
     if (details.brand) specifications['Brand'] = details.brand;
     // ... add others like primary_category_id etc.

    return {
        id: details.id,
        name: details.name || 'Unknown Item',
        imageUrl: extractImageUrl(undefined, details.image_groups), // Use image_groups for details
        price: extractPrice(details.price, details.prices, details.price_info),
        currency: extractCurrency(details.currency, details.price_info),
        metalType: mappedMetalType, // From custom attribute mapping
        description: details.long_description || details.short_description || details.page_description || '',
        stock: extractStock(details.availability, details.inventory),
        stoneType: mappedStoneType, // From custom attribute mapping
        caratWeight: mappedCaratWeight, // From custom attribute mapping
        specifications: specifications,
    };
}

// Export the mapper functions, potentially as an object/service
export const sfccMapper = {
    mapSearchHitToSummary: mapSfccSearchHitToJewelrySummary,
    mapDetailsResponseToDetails: mapSfccDetailsResponseToJewelryDetails,
};
