import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// --- Import the API Client Factory ---
import { getApiClient } from '@/lib/api/client'; // Use path alias if configured

export const maxDuration = 30;

// Define predefined value lists based on your provided JSON data
const allowedStones = [
    "Blue Sapphire", "Diamond", "Topaz", "Ruby", "Color Diamond", "Aquamarine",
    "Peridot", "Citrine", "Garnet", "Amethyst", "Emerald", "White Sapphire",
    "Pearl", "Sapphire - Other", "Tanzanite", "Onyx", "Jade", "Opal",
    "Multi Stone (Personalized)", "Morganite", "Crystal (Swarovski)", "Alexandrite",
    "Rhodolite", "Zircon", "Cubic Zirconia", "Tourmaline", "Crystal", "Moissanite",
    "Lapis", "Tiger eye", "Hematite", "Sodalite", "Howlite", "Quartz", "Pink Sapphire",
    "Cats Eye", "Malachite", "Mother of Pearl", "Turquoise", "Jasper", "Gold Sand",
    "Spinel", "London Blue Topaz", "Green Amethyst", "Moonstone", "Amazonite",
    "Labradorite", "Rutilated Quartz", "Other", "Ametrine", "Agate", "Iolite",
    "Oregon Sunstone", "Umba Sapphire", "Apatite", "Blue Topaz", "garnet", "Blue Diamond",
    "none" // Added 'none' for cases where no stone is desired
] as const;

const allowedStoneColors = [
    "White", "Blue", "Red", "Black", "Yellow", "Purple", "Green", "Pink",
    "London Blue", "Champagne", "Brown", "Multi-Color", "OP", "Near-colorless",
    "Gray", "Orange", "Diamond", "Peach", "Cream", "Color-changing", "L",
    "Fancy Pink", "Fancy Blue", "Colorless", "D", "FG"
] as const;

const allowedCaratWeights = [
    "1/4 ctw", "1/2 ctw", "1 ctw", "<1/10 ctw", "1/3 ctw", "1/10 ctw", "1/5 ctw",
    "1/8 ctw", "3/4 ctw", "1/7 ctw", "3 ctw", "2 ctw", "1 1/2 ctw", "3/8 ctw",
    "1 1/4 ctw", "1 1/3 ctw", "5/8 ctw", "7/8 ctw", "5 ctw", "1 3/8 ctw", "1 7/8 ctw",
    "Over 6 ctw", "1 5/8 ctw", "2 1/8 ctw", "1 1/8 ctw", "4 ctw", "3 1/2 ctw",
    "1 3/4 ctw", "2 1/2 ctw", "2 1/4 ctw", "6 ctw", "8 ctw", "1 1/5 ctw", "1 1/7 ctw",
    "3 3/4 ctw", "2 3/8 ctw", "2 1/5 ctw", "7 ctw", "3 1/7 ctw", "2 5/8 ctw",
    "2 1/7 ctw", "2 1/3 ctw", "3 1/3 ctw", "Over 10 ctw", "2 3/4 ctw", "2 7/8 ctw",
    "3 1/4 ctw", "9 ctw", "3 7/8 ctw", "10 ctw", "3 5/8 ctw", "3 3/8 ctw", "3 1/5 ctw",
    "10 1/7 ctw (10.14 -10.1799)", "8 7/8 ctw (8.80 - 8.9499)", "8 1/2 ctw (8.45 - 8.5899)",
    "7 7/8 ctw (7.80 - 7.9499)", "7 1/2 ctw (7.45 - 7.5899)", "9 3/4 ctw (9.70 - 9.7999)",
    "10 3/8 ctw (10.37 -10.4499)", "ctw"
] as const;

const allowedGenders = ["Women", "Unisex", "Men", "Child"] as const;

const allowedMetalGroups = [
    "Yellow Gold", "Gold", "White Gold", "Sterling Silver", "Stainless Steel",
    "Rose Gold", "Base metal", "Base Metal", "Platinum", "Titanium", "Tungsten",
    "Elysium", "Zirconium", "Meteorite", "Damascus Steel", "Cobalt", "Tantalum",
    "Gray Gold", "Wood", "Pink Gold", "Vermeil", "Two-tone W/Y Gold", "Black Gold"
] as const;

const allowedRingStyles = [
    "Side-Stone", "Solitaire", "Halo", "Three-Stone", "Bridal Set",
    "Gemstone Engagement", "Vintage"
] as const;

// Define categories
const allowedCategories = ["engagement rings", "wedding bands", "anniversary rings", "rings", "necklaces", "earrings", "bracelets", "watches", "pendants"] as const;

// Define qualitative price tiers
const allowedPriceTiers = ["cheap", "medium", "expensive"] as const;

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
        system: `You are a luxury jewelry assistant...`,
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
                parameters: z.object({
                    searchQuery: z.string().describe(`
                        **Description**: Extract the core keywords or concepts representing the user's search intent. Remove conversational filler words like 'show me', 'I want', 'find me'. Focus on essential nouns/concepts. Use this parameter *only* if specific attributes cannot be extracted into the 'attributes' object below, or for very general/abstract searches.
                            * *Example Input:* "show me necklaces" -> *Extracted Value:* 'necklaces'
                            * *Example Input:* "something nice for an anniversary" -> *Extracted Value:* 'anniversary'
                            * *Example Input:* "what rings do you have?" -> *Extracted Value:* 'rings
                    `),
                    category: z.enum(allowedCategories).optional().describe(`
                        **Description**: The specific category of jewelry the user is interested in. **Select the *closest match* from the allowed values based on the user's input.** This is often the main subject of the user's request.
                            * **Allowed Values**: ${allowedCategories.join(', ')}
                            * *Example Input:* "what kinds of watches do you have?" -> *Selected Value:* 'watches'
                            * *Example Input:* "show me necklaces" -> *Selected Value:* 'necklaces'
                            * *Example Input:* "I need some earrings" -> *Selected Value:* 'earrings'
                            * *Example Input:* "Looking for engagement rings" -> *Selected Value:* 'engagement rings'
                            * *Example Input:* "Do you have simple bands?" -> *Selected Value:* 'bands'
                    `),
                    attributes: z.object({
                        stone: z.enum(allowedStones).optional().describe(`
                            **Description**: The type of gemstone the user is interested in. **Select the *closest match* from the allowed values based on the user's input.** If the user doesn't want a stone or mentions a simple band, consider selecting 'none'.
                                * **Allowed Values**: (Extensive list including Diamond, Blue Sapphire, Ruby, Emerald, Pearl, Onyx, Morganite, Moissanite, Turquoise, etc. - see full list above)
                                * *Example Input:* "I want a diamond ring" -> *Selected Value:* 'Diamond'
                                * *Example Input:* "Show me sapphire necklaces" -> *Selected Value:* 'Blue Sapphire' (Assuming default Sapphire is Blue unless specified otherwise)
                                * *Example Input:* "A simple band, no stones" -> *Selected Value:* 'none'
                                * *Example Input:* "Anything with Morganite?" -> *Selected Value:* 'Morganite'
                        `),
                        stoneColor: z.enum(allowedStoneColors).optional().describe(`
                            **Description**: The color of the gemstone the user specifies. **Select the *closest match* from the allowed values based on the user's input.** This is often used to clarify the type of stone (e.g., 'Blue' for Sapphire or Topaz).
                                * **Allowed Values**: ${allowedStoneColors.join(', ')}
                                * *Example Input:* "A ring with a blue stone" -> *Selected Value:* 'Blue'
                                * *Example Input:* "Looking for pink diamonds" -> *Selected Value:* 'Pink' (or 'Fancy Pink')
                                * *Example Input:* "White gems" -> *Selected Value:* 'White'
                        `),
                        minCaratTotalWeight: z.enum(allowedCaratWeights).optional().describe(`
                            **Description**: The minimum total carat weight specified by the user. **Select the *closest match* from the allowed string values.** Note the fractional format.
                                * **Allowed Values**: (List includes fractions like 1/4 ctw, 1/2 ctw, 1 ctw, <1/10 ctw, and whole numbers like 2 ctw, 3 ctw, etc. - see full list above)
                                * *Example Input:* "at least 1 carat" -> *Selected Value:* '1 ctw'
                                * *Example Input:* "around half a carat" -> *Selected Value:* '1/2 ctw'
                                * *Example Input:* "a small diamond, maybe 1/4 ctw" -> *Selected Value:* '1/4 ctw'
                        `),
                        gender: z.enum(allowedGenders).optional().describe(`
                            **Description**: The intended gender category for the jewelry item recipient. **Interpret user input like 'man', 'woman', 'husband', 'wife', 'lady', 'guy', 'boy', 'girl', 'unisex', 'partner', 'them', 'for him', 'for her', etc., and select the *single closest match* from the allowed values.** If no gender is specified or clearly implied, omit this attribute.
                                * **Allowed Values**: ${allowedGenders.join(', ')}
                                * *Example Input:* "Show me men's watches" -> *Selected Value:* 'Men'
                                * *Example Input:* "Looking for women's rings" -> *Selected Value:* 'Women'
                                * *Example Input:* "A gift for my husband" -> *Selected Value:* 'Men'
                                * *Example Input:* "Need something for my wife" -> *Selected Value:* 'Women'
                                * *Example Input:* "Maybe a unisex bracelet?" -> *Selected Value:* 'Unisex'
                                * *Example Input:* "A necklace for a little girl" -> *Selected Value:* 'Child'
                                * *Example Input:* "Something for an old lady" -> *Selected Value:* 'Women'
                                * *Example Input:* "A gift for my partner" -> *Selected Value:* 'Unisex' (If gender unknown/unspecified)
                                * *Example Input:* "What do you have for him?" -> *Selected Value:* 'Men'
                                * *Example Input:* "Just show me rings" -> *Selected Value:* null (Omit if not mentioned)
                        `),
                        metalGroup: z.enum(allowedMetalGroups).optional().describe(`
                            **Description**: The type of metal or metal color group the user is interested in. **Select the *closest match* from the allowed values.** Map common terms (like 'gold', 'silver') to the appropriate group.
                                * **Allowed Values**: ${allowedMetalGroups.join(', ')}
                                * *Example Input:* "I want a yellow gold ring" -> *Selected Value:* 'Yellow Gold'
                                * *Example Input:* "Do you have anything in white gold?" -> *Selected Value:* 'White Gold'
                                * *Example Input:* "Looking for silver necklaces" -> *Selected Value:* 'Sterling Silver'
                                * *Example Input:* "Platinum options?" -> *Selected Value:* 'Platinum'
                                * *Example Input:* "Rose gold earrings" -> *Selected Value:* 'Rose Gold'
                        `),
                        ringStyle: z.enum(allowedRingStyles).optional().describe(`
                            **Description**: Applicable *only* if the category is 'rings' or 'engagement rings'. The style or design preference for the ring. **Select the *closest match* from the allowed values.**
                                * **Allowed Values**: ${allowedRingStyles.join(', ')}
                                * *Example Input:* "A vintage engagement ring" -> *Selected Value:* 'Vintage'
                                * *Example Input:* "Looking for a solitaire diamond ring" -> *Selected Value:* 'Solitaire'
                                * *Example Input:* "A halo style ring" -> *Selected Value:* 'Halo'
                                * *Example Input:* "Three stone rings" -> *Selected Value:* 'Three-Stone'
                        `),
                        size: z.string().optional().describe(`
                            **Description**: The size requested by the user (e.g., ring size, necklace length, watch band size). Extract the size information as mentioned by the user.
                                * *Example Input:* "I need a size 7 ring" -> *Extracted Value:* '7'
                                * *Example Input:* "An 18 inch necklace chain" -> *Extracted Value:* '18 inch'
                                * *Example Input:* "Bracelet size medium" -> *Extracted Value:* 'medium'
                        `),
                        priceMin: z.number().optional().describe(`
                            **Description**: Extract the minimum numerical price *only* if the user specifies an explicit range (e.g., '$A-$B', 'between A and B', 'from A to B', 'range A-B') or an explicit lower limit ('over $A', 'at least A', 'minimum A'). Clean symbols/suffixes ($, k, commas). Do NOT use for 'around $A' style inputs.
                                * *Example Input:* "between $1000 and $2000" -> *Extracted Value:* \`1000\`
                                * *Example Input:* "over $500" -> *Extracted Value:* \`500\`
                                * *Example Input:* "at least 1.5k" -> *Extracted Value:* \`1500\`
                                * *Example Input:* "range 3000-5000$" -> *Extracted Value:* \`3000\`
                                * *Example Input:* "from 100 to 200" -> *Extracted Value:* \`100\`
                                * *Example Input:* "under $500" -> *Extracted Value:* \`null\`
                                * *Example Input:* "around $1000" -> *Extracted Value:* \`null\`
                        `),
                        priceMax: z.number().optional().describe(`
                            **Description**: Extract the maximum numerical price *only* if the user specifies an explicit range (e.g., '$A-$B', 'between A and B', 'from A to B', 'range A-B') or an explicit upper limit ('under $A', 'max A', 'less than A'). Clean symbols/suffixes ($, k, commas). Do NOT use for 'around $A' style inputs.
                                * *Example Input:* "between $1000 and $2000" -> *Extracted Value:* \`2000\`
                                * *Example Input:* "under $500" -> *Extracted Value:* \`500\`
                                * *Example Input:* "max 3k" -> *Extracted Value:* \`3000\`
                                * *Example Input:* "range 3000-5000$" -> *Extracted Value:* \`5000\`
                                * *Example Input:* "from 100 to 200" -> *Extracted Value:* \`200\`
                                * *Example Input:* "over $500" -> *Extracted Value:* \`null\`
                                * *Example Input:* "around $1000" -> *Extracted Value:* \`null\`
                        `),
                        priceTarget: z.number().optional().describe(`
                            **Description**: Extract the target numerical price *only* if the user mentions a specific approximate value (e.g., 'around $A', 'about A', '$A exactly', 'for $A'). Clean symbols/suffixes ($, k, commas). Do NOT use for explicit ranges or limits (use priceMin/priceMax for those).
                                * *Example Input:* "around $1000" -> *Extracted Value:* \`1000\`
                                * *Example Input:* "exactly $500" -> *Extracted Value:* \`500\`
                                * *Example Input:* "about 2.5k" -> *Extracted Value:* \`2500\`
                                * *Example Input:* "I want something for 300" -> *Extracted Value:* \`300\`
                                * *Example Input:* "under $500" -> *Extracted Value:* \`null\`
                                * *Example Input:* "between $1000 and $2000" -> *Extracted Value:* \`null\`
                        `),
                        priceTier: z.enum(allowedPriceTiers).optional().describe(`
                             **Description**: Select a qualitative price tier *only if* the user did *not* specify any numerical price information (i.e., if 'priceMin', 'priceMax', and 'priceTarget' are all null). Base the selection on descriptions used (e.g., affordable, expensive, mid-range).
                                * **Allowed Values**: ${allowedPriceTiers.join(', ')}
                                * *Example Input:* "Something affordable" -> *Selected Value:* 'cheap'
                                * *Example Input:* "Show me your most luxurious pieces" -> *Selected Value:* 'expensive'
                                * *Example Input:* "Under $500" -> *Selected Value:* null (Use priceMax instead)
                        `)
                    }).optional()
                }),
                execute: async ({ searchQuery, category, attributes }) => {
                    try {
                        console.log(`Tool: Calling apiClient.searchProducts for query: "${searchQuery}"`);
                        // Use the provider instance returned by the factory
                        const products = await apiClient.searchProducts(searchQuery, category, attributes);
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
        toolChoice: 'required'
    });

    return result.toDataStreamResponse();
}
