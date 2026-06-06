import type { VercelRequest, VercelResponse } from '@vercel/node'

function getAppUrl(): string {
  return (
    process.env.VITE_APP_URL ??
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://thehub-6426.vercel.app')
  ).replace(/\/$/, '')
}

function getProjectRef(supabaseUrl: string): string | null {
  try {
    const hostname = new URL(supabaseUrl).hostname
    const ref = hostname.split('.')[0]
    return ref && ref.length >= 20 ? ref : null
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.MIGRATION_SECRET
  if (!secret) {
    return res.status(503).json({ error: 'MIGRATION_SECRET is not configured.' })
  }

  const provided =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ??
    (typeof req.headers['x-migration-secret'] === 'string'
      ? req.headers['x-migration-secret']
      : null)

  if (provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  const appUrl = getAppUrl()
  const redirectUrls = [
    `${appUrl}/auth/callback`,
    `${appUrl}/auth/callback/**`,
    `${appUrl}/accept-invite`,
    `${appUrl}/accept-invite/**`,
    `${appUrl}`,
  ].join(',')

  const projectRef = supabaseUrl ? getProjectRef(supabaseUrl) : null

  if (accessToken && projectRef) {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        site_url: appUrl,
        uri_allow_list: redirectUrls,
      }),
    })

    const payload = await response.json().catch(() => ({}))
    if (response.ok) {
      return res.status(200).json({
        ok: true,
        method: 'management_api',
        site_url: appUrl,
        uri_allow_list: redirectUrls,
      })
    }
  }

  if (supabaseUrl && serviceRoleKey) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/config`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        site_url: appUrl,
        uri_allow_list: redirectUrls,
      }),
    })

    if (response.ok) {
      return res.status(200).json({
        ok: true,
        method: 'gotrue_admin',
        site_url: appUrl,
        uri_allow_list: redirectUrls,
      })
    }

    const payload = await response.text().catch(() => '')
    return res.status(502).json({
      error:
        'Could not update Supabase auth config automatically. Set Site URL manually in Supabase Dashboard → Authentication → URL Configuration.',
      site_url: appUrl,
      uri_allow_list: redirectUrls,
      details: payload.slice(0, 500),
      hint: 'Add SUPABASE_ACCESS_TOKEN (personal access token from supabase.com/dashboard/account/tokens) to Vercel env vars, redeploy, and call this endpoint again.',
    })
  }

  return res.status(503).json({
    error: 'Supabase credentials are not available.',
    site_url: appUrl,
    uri_allow_list: redirectUrls,
  })
}
