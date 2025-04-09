import type { JewelrySummary } from '../../models/jewelry-summary.types';
import type { JewelryDetails } from '../../models/jewelry-details.types';

// Interface defining the contract for any e-commerce API provider
export interface JewelryApiProvider {
    searchProducts(query: string, category: string, attributes: object): Promise<JewelrySummary[]>;
    getProductDetails(productId: string): Promise<JewelryDetails | null>;
}
