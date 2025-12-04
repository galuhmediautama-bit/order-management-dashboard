# Query Optimization Guide - React Application Changes

## Overview
The performance analysis shows the database is working hard on queries that could be optimized at the application level. This guide details recommended changes to reduce unnecessary database calls.

---

## Priority 1: Realtime Subscriptions (34k calls, 149s total)

### Current Problem
The `realtime.list_changes` function is called 34,485 times, consuming **71.5% of total database time**. This happens because the Realtime plugin subscribes to table changes and must check on each operation.

### Recommended Changes

#### 1.1: Debounce Realtime Subscriptions
In components that subscribe to multiple tables, add debouncing:

```typescript
// Example: Instead of subscribing immediately, debounce subscription
import { useEffect, useRef } from 'react';

export function useOptimizedRealtimeSubscription(channel, filter) {
  const debounceTimer = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      // Subscribe only after user stops interacting
      const subscription = channel.on('*', filter, callback).subscribe();
      return () => subscription.unsubscribe();
    }, 500);
    
    return () => clearTimeout(debounceTimer.current);
  }, [channel, filter]);
}
```

#### 1.2: Unsubscribe from Unused Tables
Review all pages for unnecessary Realtime subscriptions:

```typescript
// BAD: Subscribes to all orders in real-time
const subscription = supabase
  .channel('public:orders')
  .on('*', (payload) => { /* ... */ })
  .subscribe();

// GOOD: Only subscribe when viewing the page, unsubscribe when leaving
useEffect(() => {
  if (!isVisible) {
    subscription?.unsubscribe();
    return;
  }
  const sub = supabase.channel('public:orders:cs:' + userId)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders', filter: `assignedCsId=eq.${userId}` },
      (payload) => { /* ... */ }
    )
    .subscribe();
  
  return () => sub.unsubscribe();
}, [isVisible, userId]);
```

#### 1.3: Use Polling Instead of Realtime for Low-Priority Data
For data that doesn't need instant updates, use polling:

```typescript
// Instead of Realtime for abandoned carts (rarely changes during session)
const [abandonedCarts, setAbandonedCarts] = useState([]);

useEffect(() => {
  // Fetch immediately
  fetchAbandonedCarts();
  
  // Poll every 5 minutes instead of real-time
  const pollInterval = setInterval(fetchAbandonedCarts, 5 * 60 * 1000);
  
  return () => clearInterval(pollInterval);
}, []);
```

---

## Priority 2: Timezone Queries (620ms average, 33 calls)

### Current Problem
The `SELECT name FROM pg_timezone_names` query runs on every session initialization, taking 620ms average.

### Recommended Changes

#### 2.1: Cache Timezones Client-Side
Move timezone data to be loaded once and cached:

```typescript
// Create a new context or add to SettingsContext
import { createContext, useContext, useEffect, useState } from 'react';

interface TimezoneContextType {
  timezones: string[];
  isLoading: boolean;
}

const TimezoneContext = createContext<TimezoneContextType | null>(null);

export function TimezoneProvider({ children }) {
  const [timezones, setTimezones] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage first
    const cached = localStorage.getItem('app_timezones');
    if (cached) {
      setTimezones(JSON.parse(cached));
      setIsLoading(false);
      return;
    }

    // Fetch from Supabase (cached_timezones view)
    supabase
      .from('cached_timezones')
      .select('name')
      .then(({ data }) => {
        const tzs = data?.map(d => d.name) || [];
        setTimezones(tzs);
        localStorage.setItem('app_timezones', JSON.stringify(tzs));
        setIsLoading(false);
      });
  }, []);

  return (
    <TimezoneContext.Provider value={{ timezones, isLoading }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezones() {
  const context = useContext(TimezoneContext);
  if (!context) throw new Error('useTimezones must be used within TimezoneProvider');
  return context;
}
```

#### 2.2: Add Timezones to SettingsContext
Include timezones in the settings object fetched once on app load:

```typescript
// In SettingsContext.tsx - modify fetchSettings
async function fetchSettings() {
  const { data } = await supabase
    .from('settings')
    .select('*')
    .is('userId', null);
  
  // Include common timezones in settings
  return {
    ...settings,
    timezones: ['Asia/Jakarta', 'Asia/Singapore', 'UTC', /* ... */]
  };
}
```

---

## Priority 3: Schema Introspection (pg_get_tabledef, 1.3-1.5s each)

### Current Problem
The `pg_get_tabledef` query is called to inspect database schema. This is slow and happens during dashboard initialization.

### Recommended Changes

#### 3.1: Cache Schema Inspection
Don't re-fetch schema information on every session:

```typescript
// In a utility file or hook
const SCHEMA_CACHE_KEY = 'app_db_schema_cache';
const SCHEMA_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedSchema() {
  const cached = localStorage.getItem(SCHEMA_CACHE_KEY);
  if (cached) {
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp < SCHEMA_CACHE_DURATION) {
      return data;
    }
  }

  // Fetch schema only if cache expired
  const schema = await fetchDatabaseSchema();
  localStorage.setItem(SCHEMA_CACHE_KEY, JSON.stringify({
    timestamp: Date.now(),
    data: schema
  }));
  
  return schema;
}
```

#### 3.2: Lazy Load Schema Inspection
Only run schema introspection when the dashboard admin page is opened:

```typescript
// In SettingsPage.tsx or similar
useEffect(() => {
  if (!isSettingsPageVisible) return;
  
  // Only fetch schema when page is visible
  loadSchemaInformation();
}, [isSettingsPageVisible]);
```

---

## Priority 4: Global Settings Query

### Current Problem
`SELECT * FROM settings` is called frequently with moderate performance impact.

### Recommended Changes

#### 4.1: Use Settings Context Efficiently
Ensure `SettingsContext` fetches settings once and caches:

```typescript
// In SettingsContext.tsx
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    // Fetch once on app startup
    fetchSettings().then(setSettings);
  }, []); // Empty dependency array - fetch once

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
```

#### 4.2: Invalidate Cache on Settings Update
When settings are updated, refresh only that specific setting:

```typescript
async function updateSetting(key: string, value: any) {
  await supabase
    .from('settings')
    .update({ value })
    .eq('key', key);
  
  // Update only this setting in cache, don't refetch all
  setSettings(prev => ({
    ...prev,
    [key]: value
  }));
}
```

---

## Priority 5: Forms Query Optimization

### Current Problem
Forms are queried frequently for form listing and public form access.

### Recommended Changes

#### 5.1: Implement Forms Caching
Cache user's forms for the session:

```typescript
// Custom hook for forms caching
export function useUserForms() {
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[] | null>(null);

  useEffect(() => {
    const cacheKey = `user_forms_${user?.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      setForms(JSON.parse(cached));
      return;
    }

    supabase
      .from('forms')
      .select('*')
      .eq('userId', user?.id)
      .then(({ data }) => {
        setForms(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      });
  }, [user?.id]);

  return forms;
}
```

#### 5.2: Invalidate Forms Cache on Create/Update
```typescript
async function createForm(formData) {
  const result = await supabase.from('forms').insert([formData]);
  
  // Invalidate cache
  const cacheKey = `user_forms_${user?.id}`;
  sessionStorage.removeItem(cacheKey);
  
  // Re-fetch only this user's forms
  refetchUserForms();
  
  return result;
}
```

---

## Priority 6: Orders Query Optimization

### Current Problem
Orders table has high volume of queries with various filters.

### Recommended Changes

#### 6.1: Paginate Orders Fetching
Never fetch all orders at once:

```typescript
// In OrdersPage.tsx
const PAGE_SIZE = 50;
const [page, setPage] = useState(0);

useEffect(() => {
  supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('assignedCsId', userId)
    .eq('status', selectedStatus)
    .order('createdAt', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    .then(({ data, count }) => {
      setOrders(data);
      setTotalCount(count);
    });
}, [page, selectedStatus, userId]);
```

#### 6.2: Use Real-time Only for New Orders
For orders list, use polling for updates instead of real-time:

```typescript
// Poll for new orders every 30 seconds instead of Realtime
useEffect(() => {
  const interval = setInterval(() => {
    // Fetch only the latest orders to see if anything changed
    supabase
      .from('orders')
      .select('id, status')
      .eq('assignedCsId', userId)
      .order('createdAt', { ascending: false })
      .limit(5)
      .then(({ data: latestOrders }) => {
        // Check if any new order IDs
        const newIds = latestOrders.map(o => o.id);
        const currentIds = orders.map(o => o.id);
        if (!newIds.every(id => currentIds.includes(id))) {
          // Refetch orders to get complete data
          refetchOrders();
        }
      });
  }, 30000);

  return () => clearInterval(interval);
}, [userId, orders]);
```

---

## Implementation Roadmap

### Week 1: Database Optimizations
1. Run `supabase_performance_optimization.sql` - Add indexes ✅
2. Run `supabase_optimize_realtime.sql` - Optimize Realtime

### Week 2: Context & Caching
1. Enhance `SettingsContext` to cache globally
2. Add `TimezoneContext` for timezone caching
3. Move schema introspection to lazy loading

### Week 3: Component Optimization
1. Optimize `OrdersPage` with pagination
2. Optimize `FormsPage` with caching
3. Debounce Realtime subscriptions

### Week 4: Monitoring
1. Run `SELECT * FROM public.slow_queries` to verify improvements
2. Monitor query execution times
3. Fine-tune based on new metrics

---

## Expected Performance Improvements

| Optimization | Expected Impact | Priority |
|---|---|---|
| Debounce/optimize Realtime | -30-40% on realtime calls | 🔴 High |
| Cache timezones client-side | -85% on timezone queries | 🟡 Medium |
| Lazy load schema | -60% on pg_get_tabledef calls | 🟡 Medium |
| Paginate orders | -50% on orders table scans | 🔴 High |
| Settings context caching | -40% on settings queries | 🟡 Medium |
| Forms session cache | -30% on forms queries | 🟢 Low |

**Total expected improvement: 30-50% reduction in database query time**

---

## Testing Recommendations

1. **Before**: Run `SELECT query, calls, mean_time, total_time FROM pg_stat_statements ORDER BY calls DESC;` and save results
2. **After**: Run the same query after implementing changes
3. **Compare**: Calculate percentage improvements for each query type
4. **Monitor**: Check every few days for regression
