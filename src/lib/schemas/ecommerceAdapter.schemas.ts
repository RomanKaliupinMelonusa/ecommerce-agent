import { z } from 'zod';

// Zod schema for the summary data expected from the searchProducts tool/API client
export const jewelrySummarySchema = z.object({
    id: z.string(),
    name: z.string(),
    imageUrl: z.string().url().optional(), // Ensure it's a URL if present
    price: z.number().optional(),
    currency: z.string().length(3).optional(), // e.g., 'USD'
    metalType: z.string().optional()
    // Add other essential summary fields returned by your adapter's searchProducts
});

// Zod schema for the detailed data expected from the getProductDetails tool/API client
export const jewelryDetailsSchema = jewelrySummarySchema.extend({
    description: z.string().optional(), // Make optional if sometimes missing
    stock: z.number().int().nonnegative().optional(), // Make optional if not always available
    stoneType: z.string().optional(),
    caratWeight: z.number().positive().optional(), // Assuming numeric carat weight from adapter
    specifications: z.record(z.string()).optional() // Allow optional specifications
    // Add other detailed fields returned by your adapter's getProductDetails
}).nullable(); // Allow the entire details object to be null (e.g., product not found)
