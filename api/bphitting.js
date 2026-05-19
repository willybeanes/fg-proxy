export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const season = url.searchParams.get('season') || new Date().getFullYear();

  const bpUrl = `https://www.baseballprospectus.com/leaderboards/api/v1/hitting/?season=${season}&level=1&include=incl_player%2Cincl_season&plate_appearances=1%2C9999&limit=99999`;

  try {
    const r = await fetch(bpUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.baseballprospectus.com/leaderboards/hitting/',
      }
    });
    if (!r.ok) return res.status(r.status).json({ error: `BP Hitting API returned ${r.status}` });
    const json = await r.json();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
