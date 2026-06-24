export function readEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  return value ? value : null
}

export function hasSupabaseTestEnv(): boolean {
  return Boolean(
    readEnv('SUPABASE_URL') ?? readEnv('VITE_SUPABASE_URL') ?? readEnv('NEXT_PUBLIC_SUPABASE_URL')
  ) && Boolean(readEnv('SUPABASE_SERVICE_ROLE_KEY') ?? readEnv('SUPABASE_SECRET_KEY'))
}

export function hasIntegrationTestCredentials(): boolean {
  return (
    hasSupabaseTestEnv() &&
    Boolean(readEnv('TEST_USER_EMAIL')) &&
    Boolean(readEnv('TEST_USER_PASSWORD'))
  )
}

export function supabaseUrl(): string {
  return (
    readEnv('SUPABASE_URL') ??
    readEnv('VITE_SUPABASE_URL') ??
    readEnv('NEXT_PUBLIC_SUPABASE_URL') ??
    ''
  )
}

export function supabaseAnonKey(): string {
  return (
    readEnv('SUPABASE_ANON_KEY') ??
    readEnv('VITE_SUPABASE_ANON_KEY') ??
    readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ??
    readEnv('SUPABASE_PUBLISHABLE_KEY') ??
    ''
  )
}

export function supabaseServiceRoleKey(): string {
  return readEnv('SUPABASE_SERVICE_ROLE_KEY') ?? readEnv('SUPABASE_SECRET_KEY') ?? ''
}

export function integrationDescribeLabel(): string {
  if (!hasSupabaseTestEnv()) {
    return 'integration (skipped: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'
  }
  if (!hasIntegrationTestCredentials()) {
    return 'integration (skipped: missing TEST_USER_EMAIL / TEST_USER_PASSWORD)'
  }
  return 'integration'
}
