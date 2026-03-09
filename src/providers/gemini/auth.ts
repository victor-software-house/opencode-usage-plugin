import { existsSync } from "fs"
import { readFile } from "fs/promises"
import { homedir } from "os"
import { join } from "path"
import { getAuthFilePath } from "../../utils/paths.js"

export interface GeminiAuthData {
  access: string
  refresh: string
  expires: number
  projectId?: string
  managedProjectId?: string
}

/**
 * Reads Gemini OAuth credentials from all known sources, in priority order:
 *
 * 1. opencode auth.json "google" key (type=oauth) — set by opencode-gemini-auth plugin
 * 2. ~/.gemini/oauth_creds.json — set by Gemini CLI
 *
 * Both store a refresh token that works with the GCA OAuth client credentials.
 * The access token from source 2 may be expired; the provider will refresh it.
 */
export async function readGeminiAuth(): Promise<GeminiAuthData | null> {
  return (await readOpencodeGeminiAuth()) ?? (await readGeminiCliAuth())
}

/**
 * Reads from opencode auth.json "google" key (requires opencode-gemini-auth OAuth login).
 */
async function readOpencodeGeminiAuth(): Promise<GeminiAuthData | null> {
  try {
    const authPath = getAuthFilePath()
    if (!existsSync(authPath)) return null

    const content = await readFile(authPath, "utf-8")
    const authData = JSON.parse(content)
    const google = authData?.["google"]

    if (!google || google.type !== "oauth" || !google.access) return null

    const refresh: string = google.refresh ?? ""
    const [refreshToken = "", projectId = "", managedProjectId = ""] = refresh.split("|")

    return {
      access: google.access,
      refresh: refreshToken,
      expires: google.expires ?? 0,
      projectId: projectId || undefined,
      managedProjectId: managedProjectId || undefined,
    }
  } catch {
    return null
  }
}

/**
 * Reads from ~/.gemini/oauth_creds.json — set by the Gemini CLI (gemini auth login).
 * Format: { access_token, refresh_token, expiry_date (ms), token_type, scope }
 * The client_id field is absent; we use the known GCA app credentials to refresh.
 */
async function readGeminiCliAuth(): Promise<GeminiAuthData | null> {
  try {
    const credsPath = join(homedir(), ".gemini", "oauth_creds.json")
    if (!existsSync(credsPath)) return null

    const content = await readFile(credsPath, "utf-8")
    const creds = JSON.parse(content)

    const access: string = creds.access_token ?? ""
    const refresh: string = creds.refresh_token ?? ""
    if (!refresh) return null

    const expiryDate: number = typeof creds.expiry_date === "number" ? creds.expiry_date : 0

    return {
      access,
      refresh,
      expires: expiryDate,
    }
  } catch {
    return null
  }
}

export function accessTokenExpired(auth: GeminiAuthData): boolean {
  const BUFFER_MS = 60_000
  return auth.expires <= Date.now() + BUFFER_MS
}
