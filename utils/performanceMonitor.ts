/**
 * Performance Monitoring
 * Track CPU, memory, network usage patterns
 * Log metrics untuk debugging dan optimization
 */

export interface PerformanceMetrics {
  timestamp: number;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    percentage: number; // 0-100
  };
  timing?: {
    domContentLoaded: number;
    loadComplete: number;
    navigationTime: number;
  };
  network?: {
    requestCount: number;
    totalBytes: number;
    averageLatency: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private requestCount = 0;
  private totalBytes = 0;
  private latencies: number[] = [];
  private maxEntries = 100;

  /**
   * Start monitoring
   */
  start(): void {
    if (typeof window === 'undefined') return;

    // Monitor memory usage
    setInterval(() => {
      this.recordMemory();
    }, 5000); // Every 5 seconds

    // Monitor navigation timing
    window.addEventListener('load', () => {
      this.recordTiming();
    });
  }

  /**
   * Record memory metrics
   */
  private recordMemory(): void {
    if (!(performance as any).memory) {
      return; // Not available in all browsers
    }

    const memory = (performance as any).memory;
    const percentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    this.addMetric({
      memory: {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        percentage,
      },
    });

    if (import.meta.env.DEV) {
      console.log(`[Perf] Memory: ${percentage.toFixed(1)}% (${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB)`);
    }
  }

  /**
   * Record timing metrics
   */
  private recordTiming(): void {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (!perfData) return;

    const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
    const loadComplete = perfData.loadEventEnd - perfData.loadEventStart;
    const navigationTime = perfData.loadEventEnd - perfData.fetchStart;

    this.addMetric({
      timing: {
        domContentLoaded,
        loadComplete,
        navigationTime,
      },
    });

    if (import.meta.env.DEV) {
      console.log(`[Perf] Navigation: ${navigationTime.toFixed(0)}ms`);
    }
  }

  /**
   * Track network request
   */
  trackRequest(bytes: number, latency: number): void {
    this.requestCount++;
    this.totalBytes += bytes;
    this.latencies.push(latency);

    // Keep only last 100 latencies
    if (this.latencies.length > 100) {
      this.latencies.shift();
    }
  }

  /**
   * Get average latency
   */
  getAverageLatency(): number {
    if (this.latencies.length === 0) return 0;
    return this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
  }

  /**
   * Add metric
   */
  private addMetric(metric: Partial<PerformanceMetrics>): void {
    this.metrics.push({
      timestamp: Date.now(),
      ...metric,
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxEntries) {
      this.metrics.shift();
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    memorySamples: number;
    averageMemoryPercent: number;
    requestCount: number;
    totalBytes: number;
    averageLatency: number;
  } {
    const memoryMetrics = this.metrics.filter(m => m.memory);
    const averageMemory =
      memoryMetrics.length > 0
        ? memoryMetrics.reduce((sum, m) => sum + (m.memory?.percentage || 0), 0) / memoryMetrics.length
        : 0;

    return {
      memorySamples: memoryMetrics.length,
      averageMemoryPercent: averageMemory,
      requestCount: this.requestCount,
      totalBytes: this.totalBytes,
      averageLatency: this.getAverageLatency(),
    };
  }

  /**
   * Log summary
   */
  logSummary(): void {
    const summary = this.getSummary();
    console.log('[Performance Summary]', {
      memory: `${summary.averageMemoryPercent.toFixed(1)}% (${summary.memorySamples} samples)`,
      network: `${summary.requestCount} requests, ${(summary.totalBytes / 1024 / 1024).toFixed(1)}MB total`,
      latency: `${summary.averageLatency.toFixed(0)}ms average`,
    });
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = [];
    this.requestCount = 0;
    this.totalBytes = 0;
    this.latencies = [];
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-start in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  performanceMonitor.start();
}

export default performanceMonitor;
