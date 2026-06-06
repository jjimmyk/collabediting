type ResendEmailParams = {
  apiKey: string
  fromAddress: string
  to: string
  subject: string
  signInLink: string
  intro: string
}

export async function sendInviteEmailViaResend(
  params: ResendEmailParams
): Promise<{ ok: true } | { ok: false; details: string }> {
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.fromAddress,
      to: [params.to],
      subject: params.subject,
      html: `
        <p>${params.intro}</p>
        <p>Click the link below to accept your invitation and create your password. This link expires in about one hour.</p>
        <p><a href="${params.signInLink}">Accept invitation</a></p>
        <p>If you did not expect this email, you can ignore it.</p>
      `,
    }),
  })

  if (!emailResponse.ok) {
    const details = await emailResponse.text().catch(() => '')
    return { ok: false, details: details.slice(0, 300) }
  }

  return { ok: true }
}

export function getInviteEmailFromAddress(): string {
  return process.env.SIGN_IN_EMAIL_FROM ?? 'Pratus <onboarding@resend.dev>'
}

export function getAppCallbackUrl(workspaceId: string): string {
  const appUrl = (
    process.env.VITE_APP_URL ??
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://thehub-6426.vercel.app')
  ).replace(/\/$/, '')

  return `${appUrl}/auth/callback?workspace=${encodeURIComponent(workspaceId)}`
}
