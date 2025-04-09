import { SfccGuestAuthProvider } from './sfcc/sfcc.auth';
import { SfccAdapter } from './sfcc/sfcc.adapter';
// Import Shopify equivalents...

import { getSfccAuthConfig } from '../../config'; // Assume these load/validate config
import { sfccMapper } from './sfcc/sfcc.mapper'; // Import the mapper dependency
import { UndiciHttpClient } from '../httpClient/undiciClient.service'; // Your HttpClient impl
import { MemoryCacheService } from '../cache/memoryCache.service';    // Your Cache impl
import { SystemTimeProvider } from '../time/systemTime.provider';      // Your Time impl
import type { IEcommerceAdapter } from '../../interfaces/IEcommerceAdapter'; // Your Adapter Interface

// --- Instantiate SHARED dependencies ONCE ---
const httpClient = new UndiciHttpClient();
const cacheService = new MemoryCacheService(); // Or RedisCacheService for production
const timeProvider = new SystemTimeProvider();

// --- Instantiate Auth Providers ONCE ---
const sfccAuthConfig = getSfccAuthConfig(); // Might throw if config missing
const sfccAuthProvider = new SfccGuestAuthProvider(
    sfccAuthConfig,
    httpClient,
    cacheService,
    timeProvider
);

// const shopifyAuthConfig = getShopifyConfig();
// const shopifyAuthProvider = new ShopifyAuthProvider(/* dependencies */); // Instantiate Shopify auth

// --- Instantiate Adapters, Injecting Dependencies ---
const sfccAdapter = new SfccAdapter(sfccAuthConfig, httpClient, sfccAuthProvider, sfccMapper);
// const shopifyAdapter = new ShopifyAdapter(/* dependencies */);

// --- Factory Function ---
// This factory now returns the pre-built adapter instance based on runtime needs
export function getEcommerceAdapter(providerName: 'sfcc' | 'shopify'): IEcommerceAdapter {
    switch (providerName) {
        case 'sfcc':
            return sfccAdapter;
        // case 'shopify':
        //     return shopifyAdapter;
        default:
            throw new Error(`Unsupported ecommerce provider: ${providerName}`);
    }
}

// --- Export Auth Provider Instance (if needed by AuthService) ---
// This allows AuthService to get the same instance without re-creating it
export function getAuthProviderInstance(providerName: 'sfcc' | 'shopify') {
     switch (providerName) {
         case 'sfcc':
             return sfccAuthProvider;
         // case 'shopify':
         //     return shopifyAuthProvider;
         default:
            throw new Error(`Unsupported auth provider: ${providerName}`);
     }
}
