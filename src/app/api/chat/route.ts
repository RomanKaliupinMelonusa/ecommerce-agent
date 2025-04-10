import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';

// --- Import Schemas ---
import {
    searchProductsParametersSchema,
    getProductDetailsParametersSchema
} from '@/lib/schemas/aiToolParameters'; // Path alias assumed
import {
    jewelrySummarySchema,
    jewelryDetailsSchema
} from '@/lib/schemas/ecommerceAdapter.schemas'; // Path alias assumed

// --- Import the API Client Factory ---
// CRITICAL: Ensure getecommerceAdapter returns a shared/singleton instance!
import { getEcommerceAdapter } from '@/lib/adapters/adapter.factory'; // Path alias assumed

// --- Configuration ---
export const maxDuration = 30; // Adjust as needed

// Consider moving system prompt to a constant or separate file if it grows
const SYSTEM_PROMPT = `You are a luxury jewelry assistant...`; // Keep or externalize


// --- POST Handler ---
export async function POST(req: Request) {
    const { messages } = await req.json();

    // --- Get the configured API client instance ---
    // This factory call should efficiently return a pre-configured singleton instance
    // TODO: Requires dynamic provider name resolution based on request/user session context
    const providerName = (process.env.ECOMMERCE_PROVIDER || 'sfcc') as 'sfcc' | 'shopify'; // Default to 'sfcc' if not set
    const ecommerceAdapter = getEcommerceAdapter(providerName);

    const result = await streamText({
        model: openai('gpt-4o'),
        messages,
        system: SYSTEM_PROMPT,
        tools: {
            // --- Search Tool using the Abstracted API Client ---
            searchProducts: tool({
                description: `
                    **Tool Name:** ProductSearchTool
                    **Purpose:** To search the luxury jewelry product catalog and find relevant jewelry items based on user queries.

                    **When to Use This Tool:**
                    * User explicitly asks to find or search for products (e.g., "show me gold necklaces", "find diamond rings", "do you have any platinum bracelets?").
                    * User describes a type of jewelry they are looking for (e.g., "I need something for an anniversary", "looking for minimalist earrings").
                    * User mentions specific attributes like metal type, gemstone, price range, style, or occasion (e.g., "engagement rings under $5000", "vintage style pendants", "birthstone jewelry for May").
                    * User asks to browse a category (e.g., "what kinds of watches do you have?").

                    **Guardrails (What NOT to do):**
                    * Do not use this tool to get detailed specifications of a *single*, already identified product (use ProductDetailsTool for that).
                    * Do not use this tool to check order status (use OrderSearchTool).
                    * Do not answer general store policy questions (use FAQHelperTool).
                    * Do not provide subjective opinions on style or make personal recommendations unless directly referencing product attributes or popular items.
                    * Do not invent products that are not in the catalog. If no results are found, state that clearly.
                    * Do not process payments or add items to the cart directly via this tool.

                    **Input:** User's search query (keywords, description, category, attributes).
                    **Output:** Past exact return of the tool. When showing product details, use the provided "description".
                    If its long, summarize it naturally to about 300 characters or less.
                    If description has markup in there - convert in to plain text.
                `,
                parameters: searchProductsParametersSchema,
                execute: async (params) => {
                    const { searchQuery = '', category, attributes } = params;

                    try {
                        console.log(`Tool: Calling ecommerceAdapter.searchProducts with query: "${searchQuery}", category: ${category}, attributes: ${JSON.stringify(attributes)}`);

                        const products = await ecommerceAdapter.searchProducts(searchQuery, category, attributes);
                        const validationResult = jewelrySummarySchema.array().safeParse(products);

                        if (!validationResult.success) {
                            console.error("Tool Error: API client returned invalid search data", validationResult.error.format());
                            // Return specific validation error details if helpful for debugging, but keep user message simple
                            return { error: "Received invalid product data format from backend." };
                        }

                        console.log(`Tool: ecommerceAdapter.searchProducts returned ${validationResult.data.length} valid items.`);
                        return validationResult.data;
                    } catch (error: unknown) {
                        if (error instanceof Error) {
                            console.error("Error executing searchProducts tool:", error);
                            return { error: `Sorry, I encountered an error while searching: ${error.message}` };
                        }
                        console.error("Unknown error executing searchProducts tool:", error);
                        return { error: "Sorry, an unknown error occurred while searching." };
                    }
                }
            }),
            // --- Details Tool ---
            getProductDetails: tool({
                description: 'Get detailed information about a specific jewelry item using its ID.',
                parameters: getProductDetailsParametersSchema, // Use imported schema
                execute: async ({ productId }) => { // Parameter typed by schema
                    try {
                        console.log(`Tool: Calling ecommerceAdapter.getProductDetails for ID: "${productId}"`);
                        const details = await ecommerceAdapter.getProductDetails(productId);
                        const validationResult = jewelryDetailsSchema.safeParse(details);

                        if (!validationResult.success) {
                            console.error("Tool Error: API client returned invalid details data", validationResult.error.format());
                            return { error: "Received invalid product details format from backend." };
                        }

                        console.log(`Tool: ecommerceAdapter.getProductDetails returned ${validationResult.data ? 'details' : 'null'}.`);
                        return validationResult.data;
                    } catch (error: unknown) {
                        if (error instanceof Error) {
                            console.error("Error executing getProductDetails tool:", error);
                            return { error: `Sorry, I encountered an error fetching details: ${error.message}` };
                        }
                        console.error("Unknown error executing getProductDetails tool:", error);
                        return { error: "Sorry, an unknown error occurred while fetching product details." };
                    }
                }
            })
        },
        toolChoice: 'required'
    });

    return result.toDataStreamResponse();
}
