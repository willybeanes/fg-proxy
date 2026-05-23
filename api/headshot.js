export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');

  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Missing or invalid id parameter (must be numeric)' });
  }

  const imageUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;

  try {
    const r = await fetch(imageUrl, {
      headers: {
        'Referer': 'https://www.mlb.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    const contentType = r.headers.get('content-type') || 'image/png';
    const buffer = await r.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(Buffer.from(buffer));
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
