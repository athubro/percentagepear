/**
 * CORS proxy transport for GitHub Pages deployments.
 *
 * GitHub Pages is static hosting — it cannot add response headers, so the
 * browser blocks the direct StudentVUE call. We therefore tunnel every
 * StudentVUE request through a CORS proxy that replays it server-side.
 *
 * ── Protocol ────────────────────────────────────────────────────────────
 * The proxy used by www.grademelon.org exposes a single JSON route:
 *
 *   POST {base}/fulfillRest
 *   Content-Type: application/json
 *   {
 *     "url":       "https://<host>/api/v1/mobile/PXPWebServices/<Method>",
 *     "methodName": "<Method>",
 *     "userID":    "<student id>",
 *     "request":   { ...method params, credentials removed... },
 *     "auth":      { "type": "basic", "userID": "...", "password": "..." }
 *                 | { "type": "bearer", "token": "..." },
 *     "encrypted": false
 *   }
 *
 * Success  → { "status": true,  "response": <StudentVUE JSON> }
 * Failure  → { "status": false, "message": "...", "httpStatus": 401 }
 *
 * The proxy attaches `Access-Control-Allow-Origin: *` and answers the
 * browser's OPTIONS preflight, so no custom headers are needed from the
 * browser side (credentials travel in the JSON body, not in an
 * `Authorization` header).
 */

/** Public proxy bundled with the app. Verified reachable and CORS-enabled. */
export const DEFAULT_PROXY_URL = 'https://studentvuelib.up.railway.app'

export type ProxyAuth =
  | { type: 'basic'; userID: string; password: string }
  | { type: 'bearer'; token: string }

export interface ProxyPayload {
  url: string
  methodName: string
  userID: string
  request: Record<string, unknown>
  auth: ProxyAuth
  encrypted: boolean
}

export interface ProxyEnvelope {
  status: boolean
  message?: string
  httpStatus?: number
  response?: unknown
}

/** Strip trailing slashes so `${base}/fulfillRest` never doubles up. */
export function normalizeProxyBase(base: string | undefined | null): string {
  const trimmed = String(base ?? '').trim()
  if (!trimmed) return DEFAULT_PROXY_URL
  return trimmed.replace(/\/+$/, '')
}

/**
 * Send one StudentVUE request through the proxy.
 *
 * Always resolves with a StudentVUE-shaped object so callers keep working
 * with the same `{ error, data, access_token }` shape they get from a
 * direct request. Transport failures throw; upstream 401s are normalised
 * into `{ error: { code: '401' } }` so the existing re-login logic applies.
 */
export async function fulfillRest(
  base: string,
  payload: ProxyPayload
): Promise<any> {
  const url = `${normalizeProxyBase(base)}/fulfillRest`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const text = await res.text()
  let json: ProxyEnvelope
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(
      `CORS proxy returned non-JSON (HTTP ${res.status}). ` +
        `The proxy may be down or blocking the request.`
    )
  }

  if (!json || typeof json !== 'object') {
    throw new Error(`CORS proxy returned an unexpected response (HTTP ${res.status}).`)
  }

  if (json.status) {
    return json.response ?? {}
  }

  // Upstream rejected the request. Surface 401s in StudentVUE's own shape so
  // the caller can refresh the token and retry.
  if (json.httpStatus === 401) {
    return { error: { code: '401', message: json.message || 'Unauthorized' } }
  }

  throw new Error(json.message || `CORS proxy request failed (HTTP ${res.status}).`)
}
