import type { JewelrySummary } from './jewelry-summary.types'; // Ensure correct relative path if needed

export interface JewelryDetails extends JewelrySummary {
    description: string;
    stock: number;
    stoneType?: string;
    caratWeight?: number;
    specifications: Record<string, string>;
    // ... other fields needed for the details view
}
