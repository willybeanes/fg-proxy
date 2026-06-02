const BASE      = 'https://www.fangraphs.com/api/leaders/major-league/data';
const CACHE_TTL = 12 * 3600; // 12 hours

// ── Vercel KV helpers (REST API, no npm deps) ────────────────────────────────
async function kvGet(key) {
  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { result } = await r.json();
    return result != null ? JSON.parse(result) : null;
  } catch { return null; }
}

async function kvSet(key, value, ttl) {
  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', key, JSON.stringify(value), 'EX', ttl]),
    });
  } catch { /* non-fatal */ }
}
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const qs    = new URL(req.url, `http://${req.headers.host}`).search;
  const fgUrl = BASE + qs;

  // Normalise cache key: sort params so different orderings share the same entry
  const params = new URLSearchParams(qs);
  const sorted = new URLSearchParams([...params.entries()].sort());
  const cacheKey = `fg:${sorted.toString()}`;

  // 1. Try cache
  const cached = await kvGet(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cached);
  }

  // 2. Fetch via Scrape.do (handles Cloudflare bypass)
  const SCRAPE_KEY = process.env.SCRAPE_DO_KEY;
  if (!SCRAPE_KEY) return res.status(500).json({ error: 'SCRAPE_DO_KEY not configured' });
  const proxyUrl = `https://api.scrape.do?token=${SCRAPE_KEY}&url=${encodeURIComponent(fgUrl)}`;

  try {
    const r = await fetch(proxyUrl);
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: `FanGraphs returned ${r.status}`, detail: text.slice(0, 200) });
    }
    const data = await r.json();

    // 3. Store in cache (fire and forget)
    kvSet(cacheKey, data, CACHE_TTL);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
