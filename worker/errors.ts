import { Context } from 'hono';
import { log } from './logger';

export class AppError extends Error {
    constructor(
        public code: string,
        public message: string,
        public statusCode: number = 400
    ) { super(message); }
}

export const errorHandler = (err: Error, c: Context) => {
    if (err instanceof AppError) {
        return c.json({
            success: false,
            error: { code: err.code, message: err.message }
        }, err.statusCode as any);
    }

    log.error('Unhandled error', { error: err.message, stack: err.stack });
    return c.json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' }
    }, 500);
};
