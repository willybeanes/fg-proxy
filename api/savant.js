export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.searchParams.get('path');

  const ALLOWED = ['/leaderboard/statcast', '/leaderboard/expected_statistics'];
  if (!path || !ALLOWED.includes(path)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const params = new URLSearchParams(url.searchParams);
  params.delete('path');

  const savantUrl = `https://baseballsavant.mlb.com${path}?${params.toString()}`;

  try {
    const r = await fetch(savantUrl, {
      headers: {
        'Accept': 'text/csv,text/plain,*/*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://baseballsavant.mlb.com/',
      }
    });
    const text = await r.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600'); // cache 1 hour at CDN
    return res.status(200).send(text);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
