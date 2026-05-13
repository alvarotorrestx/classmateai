/**
 * Lightweight request cache with TTL and in-flight deduplication.
 *
 * Problems solved:
 *  1. Rapid page navigation re-fires the same endpoints on every mount.
 *  2. React StrictMode double-invocation sends each request twice.
 *  3. Multiple components on the same page independently fetching identical data.
 *
 * How it works:
 *  - First call for a key fires the request and stores the in-flight promise.
 *  - Any concurrent call for the same key returns that same promise (dedup).
 *  - Once resolved, the result is cached with a timestamp.
 *  - Subsequent calls within the TTL return the cached value instantly.
 *  - Mutations call invalidate() so the next read always fetches fresh data.
 */

const _cache = new Map();
// key → { promise: Promise|null, data: any, timestamp: number }

/**
 * Fetch with caching. Safe to call from multiple components simultaneously.
 *
 * @param {string}   key      Unique cache key (e.g. "notes", "study-sets", "gamification")
 * @param {Function} fetchFn  () => Promise<data>  — the actual API call
 * @param {number}   ttl      Milliseconds before cached data is considered stale (default 60s)
 */
export function cachedFetch(key, fetchFn, ttl = 60_000) {
  const now = Date.now();
  const entry = _cache.get(key);

  // An identical request is already in-flight — return the same promise.
  if (entry?.promise) return entry.promise;

  // Fresh cached data — return immediately without hitting the network.
  if (entry?.data !== undefined && now - entry.timestamp < ttl) {
    return Promise.resolve(entry.data);
  }

  // Fire a new request.
  const promise = fetchFn()
    .then((data) => {
      _cache.set(key, { promise: null, data, timestamp: Date.now() });
      return data;
    })
    .catch((err) => {
      // Don't cache errors — let the next call retry.
      _cache.delete(key);
      throw err;
    });

  // Store the promise so concurrent callers get the same one.
  _cache.set(key, {
    promise,
    data: entry?.data,       // keep stale data around during the refetch
    timestamp: entry?.timestamp ?? 0,
  });

  return promise;
}

/**
 * Remove specific keys from the cache.
 * Call this after any mutation that changes the underlying data.
 */
export function invalidate(...keys) {
  for (const key of keys) _cache.delete(key);
}

/**
 * Remove all keys that start with a given prefix.
 * Useful for invalidating a family of keys (e.g. "study-sets" + "study-sets:uuid").
 */
export function invalidateByPrefix(prefix) {
  for (const key of _cache.keys()) {
    if (key.startsWith(prefix)) _cache.delete(key);
  }
}

/**
 * Wipe the entire cache.
 * Call this on logout so a subsequent login never sees another user's data.
 */
export function clearCache() {
  _cache.clear();
}
