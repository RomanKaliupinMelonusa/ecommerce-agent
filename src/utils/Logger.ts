export class Logger {
    static log(message: string, data ? : unknown): void {
        console.log(`[INFO] ${message}`, data);
    }

    static error(message: string, error: Error): void {
        console.error(`[ERROR] ${message}`, error);
    }
}
