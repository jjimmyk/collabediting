import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

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

function parseRetryAfterSeconds(message: string): number | null {
  const match = message.match(/after\s+(\d+)\s+seconds?/i)
  if (!match) return null
  const seconds = Number(match[1])
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null
}

function authErrorResponse(res: VercelResponse, message: string) {
  const retryAfterSeconds = parseRetryAfterSeconds(message)
  const normalized = message.toLowerCase()
  const isRateLimited =
    retryAfterSeconds !== null ||
    normalized.includes('rate limit') ||
    normalized.includes('too many requests')

  return res.status(isRateLimited ? 429 : 400).json({
    error: message,
    retryAfterSeconds: retryAfterSeconds ?? undefined,
  })
}

type SignInBody = {
  email?: string
}

async function sendSignInEmailViaResend(params: {
  apiKey: string
  fromAddress: string
  email: string
  signInLink: string
}): Promise<{ ok: true } | { ok: false; details: string }> {
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.fromAddress,
      to: [params.email],
      subject: 'Your Pratus sign-in link',
      html: `
        <p>Click the link below to sign in to Pratus. This link expires in about one hour.</p>
        <p><a href="${params.signInLink}">Sign in to Pratus</a></p>
        <p>If you did not request this email, you can ignore it.</p>
      `,
    }),
  })

  if (!emailResponse.ok) {
    const details = await emailResponse.text().catch(() => '')
    return { ok: false, details: details.slice(0, 300) }
  }

  return { ok: true }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return res.status(503).json({ error: 'Supabase server environment is not configured.' })
  }

  const email = (req.body as SignInBody).email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }

  const redirectTo = `${getAppUrl()}/auth/callback`
  const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
  const resendKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.SIGN_IN_EMAIL_FROM ?? 'Pratus <onboarding@resend.dev>'

  if (resendKey) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    })

    if (error) {
      return authErrorResponse(res, error.message)
    }

    const sent = await sendSignInEmailViaResend({
      apiKey: resendKey,
      fromAddress,
      email,
      signInLink: data.properties.action_link,
    })

    if (!sent.ok) {
      return res.status(502).json({
        error: 'Could not send sign-in email.',
        details: sent.details,
      })
    }

    return res.status(200).json({ ok: true, delivery: 'resend' })
  }

  const { error: otpError } = await admin.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })

  if (otpError) {
    return authErrorResponse(res, otpError.message)
  }

  return res.status(200).json({ ok: true, delivery: 'supabase' })
}
