import { getAuthProviderInstance } from '../adapters/adapter.factory'; // Use the exported getter

export class AuthService {
    // No constructor injection shown here, but could use it with a DI container

    async checkProviderAuthentication(provider: 'sfcc' | 'shopify'): Promise<boolean> {
        try {
            const authProvider = getAuthProviderInstance(provider); // Get shared instance
            if (!authProvider) return false;

            // Attempt to get/validate token implicitly checks auth status
            await authProvider.getToken();
            return true;
        } catch (error) {
            console.error(`Auth check failed for ${provider}:`, error);
            return false;
        }
    }
}
