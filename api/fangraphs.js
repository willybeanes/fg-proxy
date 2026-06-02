export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const BASE = 'https://www.fangraphs.com/api/leaders/major-league/data';
  const qs = new URL(req.url, `http://${req.headers.host}`).search;
  const fgUrl = BASE + qs;

  const SCRAPER_KEY = process.env.SCRAPER_API_KEY || '9d3aa897d4f7331a8c8bb45a1102c00d';
  const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(fgUrl)}`;

  try {
    const r = await fetch(scraperUrl);
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: `FanGraphs returned ${r.status}`, detail: text.slice(0, 200) });
    }
    const data = await r.json();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
