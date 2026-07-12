declare const process: { env: Record<string, string | undefined> }

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ errors: [{ message: 'Method not allowed' }] }, 405)
  }

  const token = process.env.DUFFEL_TOKEN
  if (!token) {
    return json({ errors: [{ message: 'Server misconfigured: missing DUFFEL_TOKEN' }] }, 500)
  }

  const { search } = new URL(req.url)

  const upstream = await fetch(`https://api.duffel.com/air/offer_requests${search}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Duffel-Version': 'v2',
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip',
    },
    body: await req.text(),
  })

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
