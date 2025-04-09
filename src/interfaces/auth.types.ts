/**
 * Represents a generic structure for HTTP Authentication headers.
 * Example: { 'Authorization': 'Bearer xyz', 'Another-Header': 'abc' }
 */
export type AuthHeaders = Record<string, string>;

// Define the configuration structure expected by the SFCC Auth Provider
export interface SfccAuthConfig {
    domain: string;
    siteId: string;
    ocapiVersion: string;
    clientId: string;
    // Make the assumed lifetime explicitly configurable, default if not provided
    assumedTokenLifetimeSeconds?: number;
}
