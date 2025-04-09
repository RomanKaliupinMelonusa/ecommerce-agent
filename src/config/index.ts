import { SfccAuthConfig } from "@/interfaces/auth.types";
import { ShopifyApiClient } from "@/lib/api/providers/shopify/client";

/**
 * Retrieves the current ecommerce provider from the environment variable `ECOMMERCE_PROVIDER`.
 * Defaults to 'sfcc' if not set.
 *
 * @returns {string} The lowercase provider string.
 */
export function getCurrentProvider(): string {
    const provider = process.env.ECOMMERCE_PROVIDER?.toLowerCase() || 'sfcc'; // Default to sfcc
    return provider;
}

export function getSfccAuthConfig(): SfccAuthConfig {
    return {
        domain: process.env.SFCC_DOMAIN || '',
        siteId: process.env.SFCC_SITE_ID || '',
        ocapiVersion: process.env.SFCC_OCAPI_VERSION || 'v22_3',
        clientId: process.env.SFCC_CLIENT_ID || '',
        // Make the assumed lifetime explicitly configurable, default if not provided
        assumedTokenLifetimeSeconds: 1800 // Assume 30 minutes (1800s) as API doesn't return it
    };
}
