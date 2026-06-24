import type { VercelRequest, VercelResponse } from '@vercel/node'

type MockResponse = VercelResponse & {
  statusCode: number
  body: unknown
  headers: Record<string, string | string[]>
}

export function createMockRequest(
  overrides: Partial<VercelRequest> & {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  } = {}
): VercelRequest {
  return {
    method: overrides.method ?? 'POST',
    body: overrides.body ?? {},
    headers: overrides.headers ?? {},
    query: overrides.query ?? {},
    cookies: overrides.cookies ?? {},
    ...overrides,
  } as VercelRequest
}

export function createMockResponse(): MockResponse {
  const response: MockResponse = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code: number) {
      this.statusCode = code
      return this as VercelResponse
    },
    json(payload: unknown) {
      this.body = payload
      return this as VercelResponse
    },
    send(payload?: unknown) {
      this.body = payload ?? null
      return this as VercelResponse
    },
    setHeader(name: string, value: string | string[]) {
      this.headers[name.toLowerCase()] = value
      return this as VercelResponse
    },
    getHeader(name: string) {
      const value = this.headers[name.toLowerCase()]
      return Array.isArray(value) ? value[0] : value
    },
  } as MockResponse

  return response
}

export async function invokeHandler(
  handler: (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>,
  req: VercelRequest
): Promise<{ statusCode: number; body: unknown }> {
  const res = createMockResponse()
  await handler(req, res)
  return { statusCode: res.statusCode, body: res.body }
}
