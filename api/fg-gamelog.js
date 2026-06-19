// Proxy for Fangraphs player info + game log endpoints (needs auth cookie).
// GET /api/fg-gamelog?path=/api/players/player&playerid=sa676440
// GET /api/fg-gamelog?path=/api/players/game-log&playerid=19716&position=P&type=52&season=2026

const ALLOWED_PATHS = [
  '/api/players/player',
  '/api/players/game-log',
  '/api/players/playerSearch',
  '/api/leaders/leaders',
  '/api/leaders/splits-leaders',
  '/api/search/player',
]

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const url    = new URL(req.url, `http://${req.headers.host}`)
  const path   = url.searchParams.get('path')
  if (!path || !ALLOWED_PATHS.includes(path)) {
    return res.status(400).json({ error: 'Invalid path' })
  }

  const params = new URLSearchParams(url.searchParams)
  params.delete('path')

  const fgUrl = `https://www.fangraphs.com${path}?${params.toString()}`

  const COOKIE      = process.env.FANGRAPHS_COOKIE
  const SCRAPER_KEY = process.env.SCRAPER_API_KEY

  async function fetchDirect() {
    return fetch(fgUrl, {
      headers: {
        'Accept': 'application/json, */*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.fangraphs.com/',
        ...(COOKIE ? { Cookie: COOKIE } : {}),
      },
    })
  }

  async function fetchViaScraperAPI() {
    if (!SCRAPER_KEY) throw new Error('No SCRAPER_API_KEY configured')
    return fetch(`https://api.scraperapi.com/?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(fgUrl)}`)
  }

  try {
    let r
    if (COOKIE) {
      r = await fetchDirect()
      if (r.status === 403 && SCRAPER_KEY) {
        r = await fetchViaScraperAPI()
      }
    } else if (SCRAPER_KEY) {
      r = await fetchViaScraperAPI()
    } else {
      return res.status(500).json({ error: 'No FANGRAPHS_COOKIE or SCRAPER_API_KEY configured' })
    }

    if (!r.ok) {
      const text = await r.text()
      return res.status(r.status).json({ error: `FanGraphs returned ${r.status}`, detail: text.slice(0, 300) })
    }

    const data = await r.json()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 's-maxage=3600')
    return res.status(200).json(data)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
