import type { ITimeProvider } from '../../interfaces/time.types';

export class SystemTimeProvider implements ITimeProvider {
    now(): number {
        return Date.now();
    }
}
