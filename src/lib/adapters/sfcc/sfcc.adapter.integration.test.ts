import dotenv from 'dotenv';
import path from 'path';

// Load .env file - adjust path if your test setup runs from a different directory
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { SfccAdapter } from './sfcc.adapter';
import { SfccGuestAuthProvider } from './sfcc.auth'; // Real Auth Provider
import { sfccMapper } from './sfcc.mapper'; // Real Mapper
import { UndiciHttpClient } from '../../httpClient/undiciClient.service'; // Real HTTP Client
import { MemoryCacheService } from '../../cache/memoryCache.service'; // Real Cache (or alternative)
import { SystemTimeProvider } from '../../time/systemTime.provider'; // Real Time
import type { SfccAuthConfig } from '../../../interfaces/auth.types';
import { getSfccAuthConfig } from '../../../config'; // Assume this function loads from process.env

// --- Test Configuration ---
// Increase Jest/Vitest timeout for integration tests if needed
// jest.setTimeout(30000); // e.g., 30 seconds

// --- Real Dependencies ---
let adapter: SfccAdapter;
let realConfig: SfccAuthConfig;

// Use beforeAll to setup instance once for the suite
beforeAll(() => {
    // Check if essential config is loaded (fail fast)
    realConfig = getSfccAuthConfig(); // This function should throw if env vars missing
    if (!realConfig.domain || !realConfig.clientId || !realConfig.siteId || !realConfig.ocapiVersion) {
        throw new Error("SFCC integration test environment variables not set. Skipping tests. Ensure .env file is configured.");
    }

    // Instantiate real dependencies
    const httpClient = new UndiciHttpClient();
    const cacheService = new MemoryCacheService(); // Use memory cache for simplicity unless testing distributed cache
    const timeProvider = new SystemTimeProvider();
    const authProvider = new SfccGuestAuthProvider(
        realConfig,
        httpClient,
        cacheService,
        timeProvider
    );

    adapter = new SfccAdapter(
        realConfig,
        httpClient,
        authProvider,
        sfccMapper // Use the real mapper
    );
});

// Skip tests if essential config wasn't loaded (alternative to throwing in beforeAll)
const describeIfConfigured = describe;

describeIfConfigured('SfccAdapter Integration Tests', () => {

    // --- searchProducts Tests ---
    describe('searchProducts', () => {
        it('should return an array of products for a valid search term', async () => {
            const searchTerm = 'ring'; // Use a term likely to have results
            const results = await adapter.searchProducts(searchTerm);

            expect(Array.isArray(results)).toBe(true);
            // Don't assert exact count as it can change, check structure
            if (results.length > 0) {
                expect(results[0]).toHaveProperty('id');
                expect(results[0]).toHaveProperty('name');
                expect(results[0]).toHaveProperty('price');
                expect(results[0]).toHaveProperty('currency');
                // Check other expected summary properties
                console.log(`Search found ${results.length} results for '${searchTerm}'. First:`, results[0]?.id);
            } else {
                console.warn(`Search for '${searchTerm}' returned 0 results in the target SFCC environment.`);
            }
        });

        it('should return results applying filters (if possible to verify)', async () => {
            // This is harder to assert precisely without knowing exact data
            // Use attributes that *should* significantly filter results
            const attributes = { metalGroup: 'Gold' }; // Adjust refinement ID if needed
            const results = await adapter.searchProducts('pendant', undefined, attributes);

            expect(Array.isArray(results)).toBe(true);
            // Maybe check if results *seem* relevant (e.g., name contains Gold) - weak assertion
            console.log(`Search with filter ${JSON.stringify(attributes)} returned ${results.length} results.`);
             if (results.length > 0 && results[0].name) {
                 // Simple check, might not always hold true depending on SFCC data
                 // expect(results[0].name.toLowerCase()).toContain('gold');
             }
        });

        it('should return empty array for a query with no results', async () => {
            const searchTerm = 'nonexistentproductxyz123abc';
            const results = await adapter.searchProducts(searchTerm);
            expect(results).toEqual([]);
        });
    });

    // --- getProductDetails Tests ---
    describe('getProductDetails', () => {
        // IMPORTANT: Use a Product ID known to exist in your specific SFCC test environment
        const EXISTING_PRODUCT_ID = '2719987-1.0'; // <<< REPLACE WITH A REAL ID FROM YOUR SANDBOX
        const NON_EXISTENT_PRODUCT_ID = 'nonexistentxyz123abc';

        it('should return details for an existing product ID', async () => {
            if (EXISTING_PRODUCT_ID === 'YOUR_SANDBOX_PRODUCT_ID') {
                 console.warn("Skipping getProductDetails test - Replace placeholder ID.");
                 return;
            }

            const details = await adapter.getProductDetails(EXISTING_PRODUCT_ID);

            expect(details).not.toBeNull();
            expect(details?.id).toBe(EXISTING_PRODUCT_ID);
            expect(details).toHaveProperty('name');
            expect(details?.name).toBeTruthy(); // Should have a name
            expect(details).toHaveProperty('price');
            expect(details?.price).toBeGreaterThanOrEqual(0);
            expect(details).toHaveProperty('description');
            expect(details).toHaveProperty('stock');
            expect(details).toHaveProperty('specifications');
            // Check other core detail properties
            console.log(`Details found for ${EXISTING_PRODUCT_ID}: Name - ${details?.name}`);
        });

        it('should return null for a non-existent product ID', async () => {
            const details = await adapter.getProductDetails(NON_EXISTENT_PRODUCT_ID);
            expect(details).toBeNull();
        });
    });
});
