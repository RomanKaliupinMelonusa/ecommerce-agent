export interface JewelrySummary {
    id: string;
    name: string;
    imageUrl?: string;
    price: number;
    currency?: string;
    metalType?: string;
    // ... other fields needed for the summary card
}
