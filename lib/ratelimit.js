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
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp && /^[\d.:a-fA-F]+$/.test(firstIp)) {
      return firstIp;
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp && /^[\d.:a-fA-F]+$/.test(realIp)) {
    return realIp;
  }

  return 'unknown';
}
