import { AuthHeaders } from '@/interfaces/auth.types';

export function getShopifyAuthHeaders(): AuthHeaders {
    return { 'X-Shopify-Access-Token': 'SHOPIFY_ADMIN_ACCESS_TOKEN' };
}
