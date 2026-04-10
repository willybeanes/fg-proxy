export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const BASE = 'https://www.fangraphs.com/api/leaders/major-league/data';
  const qs = new URL(req.url, `http://${req.headers.host}`).search;
  try {
    const r = await fetch(BASE + qs, {
      headers: { 'Accept': 'application/json' }
    });
    const data = await r.json();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
