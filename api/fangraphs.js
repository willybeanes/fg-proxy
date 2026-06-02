export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const BASE = 'https://www.fangraphs.com/api/leaders/major-league/data';
  const qs = new URL(req.url, `http://${req.headers.host}`).search;
  try {
    const r = await fetch(BASE + qs, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.fangraphs.com/',
        'Origin': 'https://www.fangraphs.com',
      }
    });
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
