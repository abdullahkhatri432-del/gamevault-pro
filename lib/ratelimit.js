const buckets = new Map();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((timestamp) => timestamp > now - windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }

  hits.push(now);
  buckets.set(key, hits);

  if (buckets.size > 1000) {
    for (const [bucketKey, timestamps] of buckets) {
      if (timestamps[timestamps.length - 1] < now - windowMs) {
        buckets.delete(bucketKey);
      }
    }
  }

  return true;
}

export function clientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
