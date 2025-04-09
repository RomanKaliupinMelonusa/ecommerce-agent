import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// --- Import the API Client Factory ---
import { getApiClient } from '@/lib/api/client'; // Use path alias if configured

export const maxDuration = 30;

// --- Zod Schemas based on INTERNAL Models (No change from previous step) ---
const jewelrySummarySchema = z.object({
    id: z.string(), name: z.string(), imageUrl: z.string().optional(),
    price: z.number(), currency: z.string().optional(), metalType: z.string().optional(),
});
const jewelryDetailsSchema = jewelrySummarySchema.extend({
    description: z.string(), stock: z.number(), stoneType: z.string().optional(),
    caratWeight: z.number().optional(), specifications: z.record(z.string()),
}).nullable();

// --- POST Handler ---
export async function POST(req: Request) {
    const { messages } = await req.json();

    // --- Get the configured API client instance ---
    const apiClient = getApiClient(); // Factory selects SFCC or Shopify client

    const result = await streamText({
        model: openai('gpt-4o'),
        messages,
        system: `You are a luxury jewelry assistant... (same prompt as before)`,
        tools: {
            // --- Search Tool using the Abstracted API Client ---
            searchProducts: tool({
                description: 'Search for jewelry items based on a user query (e.g., rings, gold necklaces). When showing product details, use the provided "description". If its long, summarize it naturally to about 300 characters or less. If description has markup in there - convert in to plain text.',
                parameters: z.object({
                    query: z.string().describe('The search terms for jewelry')
                }),
                execute: async ({ query }) => {
                    try {
                        console.log(`Tool: Calling apiClient.searchProducts for query: "${query}"`);
                        // Use the provider instance returned by the factory
                        const products = await apiClient.searchProducts(query);
                        const validationResult = jewelrySummarySchema.array().safeParse(products);
                        if (!validationResult.success) {
                            console.error("Tool Error: API client returned invalid search data", validationResult.error);
                            return { error: "Received invalid product data format." };
                        }
                        console.log(`Tool: apiClient.searchProducts returned ${validationResult.data.length} valid items.`);
                        return validationResult.data;
                    } catch (error) {
                        console.error("Error executing searchProducts tool:", error);
                        return { error: `Sorry, I encountered an error while searching: ${error.message}` };
                    }
                }
            }),
            // --- Details Tool using the Abstracted API Client ---
            getProductDetails: tool({
                description: 'Get detailed information about a specific jewelry item using its ID.',
                parameters: z.object({
                    productId: z.string().describe('The unique identifier of the jewelry item')
                }),
                execute: async ({ productId }) => {
                    try {
                        console.log(`Tool: Calling apiClient.getProductDetails for ID: "${productId}"`);
                        // Use the provider instance returned by the factory
                        const details = await apiClient.getProductDetails(productId);
                        const validationResult = jewelryDetailsSchema.safeParse(details);
                        if (!validationResult.success) {
                            console.error("Tool Error: API client returned invalid details data", validationResult.error);
                            return { error: "Received invalid product details format." };
                        }
                        console.log(`Tool: apiClient.getProductDetails returned ${validationResult.data ? 'details' : 'null'}.`);
                        return validationResult.data;
                    } catch (error) {
                        console.error("Error executing getProductDetails tool:", error);
                        return { error: `Sorry, I encountered an error fetching details: ${error.message}` };
                    }
                }
            })
        },
    });

    return result.toDataStreamResponse();
}
