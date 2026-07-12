declare const process: { env: Record<string, string | undefined> }

export const config = { runtime: 'edge' }

const DUFFEL_API_URL = process.env.DUFFEL_API_URL ?? 'https://api.duffel.com'
const DUFFEL_TOKEN = process.env.DUFFEL_TOKEN

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return json({ errors: [{ message: 'Method not allowed' }] }, 405)
  }

  if (!DUFFEL_TOKEN) {
    return json({ errors: [{ message: 'Server misconfigured: missing DUFFEL_TOKEN' }] }, 500)
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query')

  if (!query || query.length < 2) {
    return json({ data: [] }, 200)
  }

  const upstream = await fetch(
    `${DUFFEL_API_URL}/places/suggestions?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${DUFFEL_TOKEN}`,
        'Duffel-Version': 'v2',
        'Accept-Encoding': 'gzip',
      },
    },
  )

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
