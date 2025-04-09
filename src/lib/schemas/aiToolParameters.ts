import { z } from 'zod';
import {
    allowedStones, allowedStoneColors, allowedCaratWeights, allowedGenders,
    allowedMetalGroups, allowedRingStyles, allowedCategories, allowedPriceTiers
} from '@/config/jewelryAttributes'; // Use path alias

// Zod schema for the parameters of the searchProducts tool
export const searchProductsParametersSchema = z.object({
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
            * *Example Input:* "Do you have simple bands?" -> *Selected Value:* 'wedding bands' // Adjust mapping as needed
    `),
    attributes: z.object({
        stone: z.enum(allowedStones).optional().describe(`
            **Description**: The type of gemstone the user is interested in. **Select the *closest match* from the allowed values based on the user's input.** If the user doesn't want a stone or mentions a simple band, consider selecting 'none'.
                * **Allowed Values**: (Extensive list including Diamond, Blue Sapphire, Ruby, Emerald, Pearl, Onyx, Morganite, Moissanite, Turquoise, etc.)
                * *Example Input:* "I want a diamond ring" -> *Selected Value:* 'Diamond'
                * *Example Input:* "Show me sapphire necklaces" -> *Selected Value:* 'Blue Sapphire' (Assuming default Sapphire is Blue unless specified otherwise)
                * *Example Input:* "A simple band, no stones" -> *Selected Value:* 'none'
                * *Example Input:* "Anything with Morganite?" -> *Selected Value:* 'Morganite'
        `),
        stoneColor: z.enum(allowedStoneColors).optional().describe(`
            **Description**: The color of the gemstone the user specifies. **Select the *closest match* from the allowed values based on the user's input.** This is often used to clarify the type of stone (e.g., 'Blue' for Sapphire or Topaz).
                * **Allowed Values**: ${allowedStoneColors.join(', ')}
                * *Example Input:* "A ring with a blue stone" -> *Selected Value:* 'Blue'
                * *Example Input:* "Looking for pink diamonds" -> *Selected Value:* 'Pink' // Or 'Fancy Pink'
                * *Example Input:* "White gems" -> *Selected Value:* 'White'
        `),
        minCaratTotalWeight: z.enum(allowedCaratWeights).optional().describe(`
            **Description**: The minimum total carat weight specified by the user. **Select the *closest match* from the allowed string values.** Note the fractional format.
                * **Allowed Values**: (List includes fractions like 1/4 ctw, 1/2 ctw, 1 ctw, <1/10 ctw, and whole numbers like 2 ctw, 3 ctw, etc.)
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
                * **Allowed Values**: ${allowedPriceTiers.join(', ')}
                * *Example Input:* "Something affordable" -> *Selected Value:* 'cheap'
                * *Example Input:* "Show me your most luxurious pieces" -> *Selected Value:* 'expensive'
                * *Example Input:* "Under $500" -> *Selected Value:* null (Use priceMax instead)
        `)
    }).optional().describe("Specific attributes to filter the search. Extract as many relevant details as possible from the user query into these fields.")
});

// Zod schema for the parameters of the getProductDetails tool
export const getProductDetailsParametersSchema = z.object({
    productId: z.string().describe('The unique identifier of the jewelry item')
});
