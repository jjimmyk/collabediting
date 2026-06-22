import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { ensureOrganizationMembership } from './org-shared.js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

type CreateOrganizationBody = {
  name?: string
  slug?: string
}

function parseBody(req: VercelRequest): CreateOrganizationBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as CreateOrganizationBody
    } catch {
      return {}
    }
  }
  return (req.body ?? {}) as CreateOrganizationBody
}

function slugifyOrganizationName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.slice(0, 48)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(503).json({ error: 'Supabase server environment is not configured.' })
    }

    const authHeader = req.headers.authorization
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing authorization token.' })
    }

    const body = parseBody(req)
    const name = body.name?.trim()
    const requestedSlug = body.slug?.trim().toLowerCase()

    if (!name) {
      return res.status(400).json({ error: 'name is required.' })
    }

    const slug = requestedSlug && requestedSlug.length > 0 ? requestedSlug : slugifyOrganizationName(name)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return res.status(400).json({ error: 'slug must contain only lowercase letters, numbers, and hyphens.' })
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const creatorEmail = user.email?.trim().toLowerCase()
    if (!creatorEmail) {
      return res.status(400).json({ error: 'Signed-in user must have an email address.' })
    }

    const { data: existingSlug } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingSlug) {
      return res.status(409).json({ error: 'An organization with that slug already exists.' })
    }

    const { data: organization, error: organizationError } = await admin
      .from('organizations')
      .insert({ name, slug })
      .select('id, name, slug')
      .single()

    if (organizationError || !organization) {
      return res.status(500).json({
        error: organizationError?.message ?? 'Could not create organization.',
      })
    }

    await ensureOrganizationMembership(admin, {
      organizationId: organization.id,
      email: creatorEmail,
      userId: user.id,
      role: 'admin',
      status: 'active',
      invitedBy: user.id,
      joinedAt: new Date().toISOString(),
    })

    return res.status(200).json({
      ok: true,
      organization: {
        organizationId: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create organization failed.'
    console.error('create-organization handler error', error)
    return res.status(500).json({ error: message })
  }
}
