export const config = { runtime: 'edge' }

const ALLOWED = ['air/offer_requests']

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/api\/duffel\//, '')

  if (!ALLOWED.some((p) => path.startsWith(p))) {
    return new Response(JSON.stringify({ errors: [{ message: 'Route not allowed' }] }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!process.env.DUFFEL_TOKEN) {
    return new Response(
      JSON.stringify({ errors: [{ message: 'Server misconfigured: missing DUFFEL_TOKEN' }] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const duffelApiUrl = process.env.DUFFEL_API_URL
  const duffelToken = process.env.DUFFEL_TOKEN

  if (!duffelApiUrl || !duffelToken) {
    return new Response(
      JSON.stringify({
        errors: [{ message: 'Server misconfigured: missing DUFFEL_API_URL or DUFFEL_TOKEN' }],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const upstream = await fetch(`${duffelApiUrl}/${path}${url.search}`, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${duffelToken}`,
      'Duffel-Version': 'v2',
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip',
    },
    body: req.method === 'GET' ? undefined : await req.text(),
  })

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
