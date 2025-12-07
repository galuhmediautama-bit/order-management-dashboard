/**
 * Query Optimizer with Connection Pooling
 * Automatically uses connection pool for production queries
 */

import { supabase, getSupabasePool } from '../firebase';
import { withRetry } from './errorHandling';

/**
 * Optimized query executor
 * Uses connection pool in production, direct query in development
 */
export async function optimizedQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    options?: {
        retries?: number;
        timeout?: number;
        usePool?: boolean;
    }
): Promise<{ data: T | null; error: any }> {
    const { retries = 3, timeout = 30000, usePool = true } = options || {};

    try {
        // In production with pool enabled
        if (usePool && import.meta.env.PROD) {
            const pool = getSupabasePool();
            if (pool) {
                return await pool.executeWithPool(
                    async (connId) => {
                        try {
                            const result = await withRetry(() => queryFn(), {
                                maxRetries: retries,
                                initialDelayMs: 1000,
                            });
                            return result;
                        } catch (error) {
                            return { data: null, error };
                        }
                    },
                    timeout
                );
            }
        }

        // In development or without pool
        return await withRetry(() => queryFn(), {
            maxRetries: retries,
            initialDelayMs: 1000,
        });
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Batch query executor with connection pooling
 * Execute multiple queries efficiently
 */
export async function batchOptimizedQueries<T>(
    queries: Array<() => Promise<{ data: T | null; error: any }>>,
    options?: {
        parallel?: number;
        retries?: number;
        timeout?: number;
    }
): Promise<Array<{ data: T | null; error: any }>> {
    const { parallel = 5, retries = 3, timeout = 30000 } = options || {};

    const results: Array<{ data: T | null; error: any }> = [];
    const pool = getSupabasePool();

    if (!pool || !import.meta.env.PROD) {
        // Development: execute all in parallel
        return Promise.all(
            queries.map((query) => optimizedQuery(query, { retries, timeout, usePool: false }))
        );
    }

    // Production: use pool with concurrency control
    for (let i = 0; i < queries.length; i += parallel) {
        const batch = queries.slice(i, i + parallel);
        const batchResults = await Promise.all(
            batch.map((query) => optimizedQuery(query, { retries, timeout, usePool: true }))
        );
        results.push(...batchResults);
    }

    return results;
}

/**
 * Query with automatic column optimization
 * Reduces bandwidth by selecting only needed columns
 */
export function createOptimizedQuery<T extends Record<string, any>>(
    table: string,
    columns: (keyof T)[]
): () => Promise<{ data: T[] | null; error: any }> {
    return async () => {
        const columnString = columns.join(', ');
        const query = supabase
            .from(table)
            .select(columnString)
            .limit(500);

        return query as any;
    };
}

/**
 * Query builder with pooling support
 */
export class OptimizedQueryBuilder {
    private table: string;
    private selectColumns: string[] = ['*'];
    private filters: Array<{
        column: string;
        operator: string;
        value: any;
    }> = [];
    private orderByColumn?: string;
    private orderByDir: 'asc' | 'desc' = 'asc';
    private limitValue?: number;
    private offsetValue?: number;

    constructor(table: string) {
        this.table = table;
    }

    /**
     * Select specific columns
     */
    select(...columns: string[]): this {
        this.selectColumns = columns;
        return this;
    }

    /**
     * Add filter condition
     */
    filter(column: string, operator: string, value: any): this {
        this.filters.push({ column, operator, value });
        return this;
    }

    /**
     * Equal filter (shorthand)
     */
    eq(column: string, value: any): this {
        return this.filter(column, 'eq', value);
    }

    /**
     * Not equal filter
     */
    neq(column: string, value: any): this {
        return this.filter(column, 'neq', value);
    }

    /**
     * Greater than filter
     */
    gt(column: string, value: any): this {
        return this.filter(column, 'gt', value);
    }

    /**
     * Order by
     */
    orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
        this.orderByColumn = column;
        this.orderByDir = direction;
        return this;
    }

    /**
     * Limit results
     */
    limit(count: number): this {
        this.limitValue = count;
        return this;
    }

    /**
     * Offset results
     */
    offset(count: number): this {
        this.offsetValue = count;
        return this;
    }

    /**
     * Build and execute query
     */
    async execute<T>(): Promise<{ data: T[] | null; error: any }> {
        return optimizedQuery(
            async () => {
                let query = supabase.from(this.table).select(this.selectColumns.join(', '));

                // Apply filters
                for (const filter of this.filters) {
                    query = query.filter(filter.column, filter.operator, filter.value);
                }

                // Apply order
                if (this.orderByColumn) {
                    query = query.order(this.orderByColumn, { ascending: this.orderByDir === 'asc' });
                }

                // Apply limit
                if (this.limitValue) {
                    query = query.limit(this.limitValue);
                }

                // Apply offset
                if (this.offsetValue) {
                    query = query.range(this.offsetValue, this.offsetValue + (this.limitValue || 500));
                }

                const result = await query;
                return result;
            },
            { usePool: true }
        );
    }
}

/**
 * Create optimized query builder
 */
export function createQueryBuilder(table: string): OptimizedQueryBuilder {
    return new OptimizedQueryBuilder(table);
}

export default {
    optimizedQuery,
    batchOptimizedQueries,
    createOptimizedQuery,
    createQueryBuilder,
};
