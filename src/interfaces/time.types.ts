// src/interfaces/time.types.ts
export interface ITimeProvider {
    /**
     * Gets the current time as a Unix timestamp (milliseconds since epoch).
     * @returns The current time in milliseconds.
     */
    now(): number;
}
