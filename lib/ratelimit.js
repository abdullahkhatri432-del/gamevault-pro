import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const RATE_FILE = path.join(DATA_DIR, 'ratelimit.json');

let buckets = {};
let lastWrite = 0;

function loadBuckets() {
  try {
    if (fs.existsSync(RATE_FILE)) {
      const raw = fs.readFileSync(RATE_FILE, 'utf8');
      buckets = JSON.parse(raw);
    }
  } catch {
    buckets = {};
  }
}

function saveBuckets(force = false) {
  const now = Date.now();
  if (!force && now - lastWrite < 5000) return;
  lastWrite = now;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(RATE_FILE, JSON.stringify(buckets), 'utf8');
  } catch {
    // best effort — in-memory still works
  }
}

export function rateLimit(key, limit, windowMs) {
  if (!Object.keys(buckets).length) {
    loadBuckets();
  }

  const now = Date.now();
  const hits = (buckets[key] || []).filter((timestamp) => timestamp > now - windowMs);

  if (hits.length >= limit) {
    buckets[key] = hits;
    saveBuckets();
    return false;
  }

  hits.push(now);
  buckets[key] = hits;

  // cleanup old keys
  if (Object.keys(buckets).length > 1000) {
    for (const [bucketKey, timestamps] of Object.entries(buckets)) {
      if (timestamps[timestamps.length - 1] < now - windowMs) {
        delete buckets[bucketKey];
      }
    }
  }

  saveBuckets();
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
