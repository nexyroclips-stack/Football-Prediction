// Serverless proxy for football-data.org
// Deployed on Vercel. The API key lives ONLY here, as an environment variable —
// never in client-side code, never in the browser, never in chat.

export default async function handler(req, res) {
  // Allow requests from any origin (tighten this to your specific domain later if you want)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET requests are supported' });
  }

  const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: 'Server misconfigured — FOOTBALL_DATA_API_KEY is not set in Vercel environment variables'
    });
  }

  // ?competition=PL&status=FINISHED  (query params passed through from the artifact)
  const { competition, status, dateFrom, dateTo } = req.query;

  if (!competition) {
    return res.status(400).json({ error: 'Missing required "competition" query param, e.g. PL, PD, BL1, SA, FL1' });
  }

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);

  const url = `https://api.football-data.org/v4/competitions/${competition}/matches?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'football-data.org request failed'
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach football-data.org', detail: String(err) });
  }
}
