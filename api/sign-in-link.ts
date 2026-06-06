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

type SignInBody = {
  email?: string
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

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  if (error) {
    const message = error.message.toLowerCase().includes('rate limit')
      ? 'Email rate limit exceeded.'
      : error.message
    const status = message.toLowerCase().includes('rate limit') ? 429 : 400
    return res.status(status).json({ error: message })
  }

  const signInLink = data.properties.action_link
  const resendKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.SIGN_IN_EMAIL_FROM ?? 'Pratus <onboarding@resend.dev>'

  if (resendKey) {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: 'Your Pratus sign-in link',
        html: `
          <p>Click the link below to sign in to Pratus. This link expires in about one hour.</p>
          <p><a href="${signInLink}">Sign in to Pratus</a></p>
          <p>If you did not request this email, you can ignore it.</p>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const details = await emailResponse.text().catch(() => '')
      return res.status(502).json({
        error: 'Could not send sign-in email.',
        details: details.slice(0, 300),
      })
    }

    return res.status(200).json({ ok: true, delivery: 'resend' })
  }

  const { error: otpError } = await admin.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })

  if (otpError) {
    const status = otpError.message.toLowerCase().includes('rate limit') ? 429 : 400
    return res.status(status).json({ error: otpError.message })
  }

  return res.status(200).json({ ok: true, delivery: 'supabase' })
}
