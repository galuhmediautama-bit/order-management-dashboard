/**
 * Database Connection Pooling Utilities
 * Optimize Supabase connection pooling untuk reduce overhead di production
 */

interface PoolConfig {
    maxConnections?: number;
    minConnections?: number;
    idleTimeout?: number; // milliseconds
    acquireTimeout?: number; // milliseconds
    connectionString?: string;
}

interface PooledConnection {
    id: string;
    createdAt: number;
    lastUsed: number;
    inUse: boolean;
}

/**
 * Connection Pool Manager
 * Manages Supabase connections efficiently
 */
export class ConnectionPoolManager {
    private static instance: ConnectionPoolManager;
    private connections: Map<string, PooledConnection> = new Map();
    private config: Required<PoolConfig>;
    private acquireQueue: Array<{
        resolve: (conn: string) => void;
        reject: (err: Error) => void;
    }> = [];
    private cleanupIntervalId: NodeJS.Timer | null = null;

    private constructor(config: PoolConfig = {}) {
        this.config = {
            maxConnections: config.maxConnections ?? 10,
            minConnections: config.minConnections ?? 2,
            idleTimeout: config.idleTimeout ?? 30 * 60 * 1000, // 30 minutes
            acquireTimeout: config.acquireTimeout ?? 10 * 1000, // 10 seconds
            connectionString: config.connectionString ?? '',
        };

        // Initialize minimum connections
        this.initializePool();
    }

    /**
     * Get singleton instance
     */
    static getInstance(config?: PoolConfig): ConnectionPoolManager {
        if (!ConnectionPoolManager.instance) {
            ConnectionPoolManager.instance = new ConnectionPoolManager(config);
        }
        return ConnectionPoolManager.instance;
    }

    /**
     * Initialize minimum connections
     */
    private initializePool(): void {
        for (let i = 0; i < this.config.minConnections; i++) {
            this.createConnection();
        }

        // Start cleanup interval - only if not already running
        if (this.cleanupIntervalId === null) {
            this.cleanupIntervalId = setInterval(() => this.cleanupIdleConnections(), 60 * 1000); // Every minute

            // CRITICAL: Cleanup on page unload to prevent lingering intervals
            if (typeof window !== 'undefined') {
                window.addEventListener('beforeunload', () => {
                    this.destroy();
                });
            }
        }
    }

    /**
     * Create new connection
     */
    private createConnection(): string {
        if (this.connections.size >= this.config.maxConnections) {
            throw new Error('Connection pool exhausted');
        }

        const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.connections.set(id, {
            id,
            createdAt: Date.now(),
            lastUsed: Date.now(),
            inUse: false,
        });

        if (import.meta.env.DEV) {
            console.log(`[Pool] Connection created: ${id} (${this.connections.size}/${this.config.maxConnections})`);
        }

        return id;
    }

    /**
     * Acquire connection from pool
     */
    async acquireConnection(): Promise<string> {
        // Try to find available connection
        for (const [id, conn] of this.connections) {
            if (!conn.inUse) {
                conn.inUse = true;
                conn.lastUsed = Date.now();

                if (import.meta.env.DEV) {
                    console.log(`[Pool] Connection acquired: ${id}`);
                }

                return id;
            }
        }

        // Create new connection if available
        if (this.connections.size < this.config.maxConnections) {
            const id = this.createConnection();
            const conn = this.connections.get(id)!;
            conn.inUse = true;
            conn.lastUsed = Date.now();
            return id;
        }

        // Wait for connection to become available
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Failed to acquire connection within timeout'));
            }, this.config.acquireTimeout);

            this.acquireQueue.push({
                resolve: (id: string) => {
                    clearTimeout(timeout);
                    resolve(id);
                },
                reject: (err: Error) => {
                    clearTimeout(timeout);
                    reject(err);
                },
            });
        });
    }

    /**
     * Release connection back to pool
     */
    releaseConnection(id: string): void {
        const conn = this.connections.get(id);
        if (!conn) {
            console.warn(`[Pool] Connection not found: ${id}`);
            return;
        }

        conn.inUse = false;
        conn.lastUsed = Date.now();

        // Check if anyone is waiting for a connection
        const waiter = this.acquireQueue.shift();
        if (waiter) {
            conn.inUse = true;
            conn.lastUsed = Date.now();
            waiter.resolve(id);
        }

        if (import.meta.env.DEV) {
            console.log(`[Pool] Connection released: ${id}`);
        }
    }

    /**
     * Clean up idle connections
     */
    private cleanupIdleConnections(): void {
        const now = Date.now();
        const toDelete: string[] = [];

        for (const [id, conn] of this.connections) {
            if (
                !conn.inUse &&
                this.connections.size > this.config.minConnections &&
                now - conn.lastUsed > this.config.idleTimeout
            ) {
                toDelete.push(id);
            }
        }

        for (const id of toDelete) {
            this.connections.delete(id);
            if (import.meta.env.DEV) {
                console.log(`[Pool] Connection cleaned up: ${id}`);
            }
        }
    }

    /**
     * Destroy the connection pool and stop cleanup interval
     * Call this on app shutdown or page unload
     */
    destroy(): void {
        if (this.cleanupIntervalId !== null) {
            clearInterval(this.cleanupIntervalId);
            this.cleanupIntervalId = null;
            if (import.meta.env.DEV) {
                console.log('[Pool] Connection pool destroyed and cleanup interval stopped');
            }
        }
        this.connections.clear();
        ConnectionPoolManager.instance = null as any;
    }

    /**
     * Get pool statistics
     */
    getStats(): {
        total: number;
        active: number;
        idle: number;
        queue: number;
    } {
        let active = 0;
        for (const conn of this.connections.values()) {
            if (conn.inUse) active++;
        }

        return {
            total: this.connections.size,
            active,
            idle: this.connections.size - active,
            queue: this.acquireQueue.length,
        };
    }

    /**
     * Close all connections
     */
    close(): void {
        this.connections.clear();
        this.acquireQueue = [];
        console.log('[Pool] All connections closed');
    }

    /**
     * Get pool status for monitoring
     */
    getStatus(): string {
        const stats = this.getStats();
        return `[Pool] Total: ${stats.total}, Active: ${stats.active}, Idle: ${stats.idle}, Queue: ${stats.queue}`;
    }
}

/**
 * Supabase Connection Pool Wrapper
 * Wraps Supabase client with connection pooling
 */
export class SupabaseConnectionPool {
    private pool: ConnectionPoolManager;
    private supabaseClient: any;
    private activeConnections: Map<string, any> = new Map();

    constructor(supabaseClient: any, poolConfig?: PoolConfig) {
        this.supabaseClient = supabaseClient;
        this.pool = ConnectionPoolManager.getInstance(poolConfig);
    }

    /**
     * Execute query with connection pooling
     */
    async executeWithPool<T>(
        queryFn: (conn: string) => Promise<T>,
        timeout?: number
    ): Promise<T> {
        let connId: string | null = null;

        try {
            connId = await this.pool.acquireConnection();
            this.activeConnections.set(connId, Date.now());

            // Add timeout for query execution
            if (timeout) {
                return await Promise.race([
                    queryFn(connId),
                    new Promise<T>((_, reject) =>
                        setTimeout(() => reject(new Error('Query timeout')), timeout)
                    ),
                ]);
            }

            return await queryFn(connId);
        } finally {
            if (connId) {
                this.pool.releaseConnection(connId);
                this.activeConnections.delete(connId);
            }
        }
    }

    /**
     * Get pool statistics
     */
    getPoolStats() {
        return this.pool.getStats();
    }

    /**
     * Get pool status string
     */
    getPoolStatus(): string {
        return this.pool.getStatus();
    }

    /**
     * Close pool
     */
    close(): void {
        this.pool.close();
        this.activeConnections.clear();
    }
}

/**
 * Global pool configuration for production
 */
export const getProductionPoolConfig = (): PoolConfig => {
    return {
        maxConnections: 20, // For production with multiple requests
        minConnections: 5, // Maintain 5 warm connections
        idleTimeout: 30 * 60 * 1000, // 30 minutes
        acquireTimeout: 10 * 1000, // 10 seconds
    };
};

/**
 * Global pool configuration for development
 */
export const getDevelopmentPoolConfig = (): PoolConfig => {
    return {
        maxConnections: 5,
        minConnections: 1,
        idleTimeout: 10 * 60 * 1000, // 10 minutes
        acquireTimeout: 5 * 1000, // 5 seconds
    };
};

/**
 * Get appropriate pool config based on environment
 */
export const getPoolConfig = (): PoolConfig => {
    return import.meta.env.PROD
        ? getProductionPoolConfig()
        : getDevelopmentPoolConfig();
};

export default {
    ConnectionPoolManager,
    SupabaseConnectionPool,
    getProductionPoolConfig,
    getDevelopmentPoolConfig,
    getPoolConfig,
};
