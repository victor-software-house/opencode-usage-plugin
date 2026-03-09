import { GCA_CLIENT_ID, GCA_CLIENT_SECRET } from "./credentials.js"

const CODE_ASSIST_ENDPOINT = "https://cloudcode-pa.googleapis.com"
const CODE_ASSIST_HEADERS = {
  "X-Goog-Api-Client": "gl-node/22.17.0",
  "Client-Metadata": "ideType=IDE_UNSPECIFIED,platform=PLATFORM_UNSPECIFIED,pluginType=GEMINI",
}

export interface GeminiQuotaBucket {
  modelId?: string
  tokenType?: string
  remainingAmount?: string
  remainingFraction?: number
  resetTime?: string
}

export interface GeminiQuotaResponse {
  buckets?: GeminiQuotaBucket[]
}

/**
 * Resolves the effective project ID from the packed refresh token or managed project.
 * gemini-auth packs refresh as "refreshToken|projectId|managedProjectId".
 */
export function resolveProjectId(projectId?: string, managedProjectId?: string): string | null {
  return managedProjectId || projectId || null
}

/**
 * Calls the Code Assist retrieveUserQuota endpoint.
 * Mirrors the fetch logic from opencode-gemini-auth/src/plugin/project/api.ts.
 */
export async function fetchGeminiQuota(
  accessToken: string,
  projectId: string,
): Promise<GeminiQuotaResponse | null> {
  try {
    const response = await fetch(`${CODE_ASSIST_ENDPOINT}/v1internal:retrieveUserQuota`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "opencode/1.0.0",
        ...CODE_ASSIST_HEADERS,
      },
      body: JSON.stringify({ project: projectId }),
    })

    if (!response.ok) return null
    return (await response.json()) as GeminiQuotaResponse
  } catch {
    return null
  }
}

/**
 * Attempts to refresh the Google OAuth access token using the refresh token.
 * Uses the same client credentials as opencode-gemini-auth.
 */
export async function refreshGeminiToken(refreshToken: string): Promise<{ access: string; expires: number } | null> {
  try {
    const body = new URLSearchParams({
      client_id: GCA_CLIENT_ID,
      client_secret: GCA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    })

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })

    if (!response.ok) return null
    const data = (await response.json()) as { access_token?: string; expires_in?: number }
    if (!data.access_token) return null

    return {
      access: data.access_token,
      expires: Date.now() + (data.expires_in ?? 3600) * 1000,
    }
  } catch {
    return null
  }
}
