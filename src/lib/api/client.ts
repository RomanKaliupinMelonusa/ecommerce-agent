import type { JewelryApiProvider } from './providers/types';
import { SfccApiClient } from './providers/sfcc/client';
import { ShopifyApiClient } from './providers/shopify/client';

let apiClientInstance: JewelryApiProvider | null = null;

// Factory function to get the configured provider client (singleton pattern)
export function getApiClient(): JewelryApiProvider {
    // Return cached instance if already created
    if (apiClientInstance) {
        return apiClientInstance;
    }

    const provider = process.env.ECOMMERCE_PROVIDER?.toLowerCase() || 'sfcc'; // Default to sfcc
    console.log(`Initializing API Client for provider: ${provider}`);

    switch (provider) {
        case 'sfcc':
            apiClientInstance = new SfccApiClient();
            break;
        case 'shopify':
            apiClientInstance = new ShopifyApiClient(); // Instantiate when implemented
            break;
        default:
            console.error(`Unsupported ECOMMERCE_PROVIDER "${provider}". Falling back to SFCC.`);
            apiClientInstance = new SfccApiClient();
            // Or: throw new Error(`Unsupported ECOMMERCE_PROVIDER: ${provider}`);
    }
    return apiClientInstance;
}
