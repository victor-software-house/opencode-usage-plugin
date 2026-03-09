import { existsSync } from "fs"
import { readFile } from "fs/promises"
import { getAuthFilePath } from "../../utils/paths.js"

export interface GeminiAuthData {
  access: string
  refresh: string
  expires: number
  projectId?: string
  managedProjectId?: string
}

/**
 * Reads Gemini OAuth credentials from opencode auth.json.
 *
 * Returns null if:
 * - auth.json doesn't exist
 * - google entry is missing or type !== "oauth" (i.e. user configured an API key)
 *
 * When type is "api", the opencode-gemini-auth plugin returns null from its loader
 * and opencode falls back to the API key against generativelanguage.googleapis.com.
 * That quota is not queryable without Cloud Monitoring, so we show nothing.
 */
export async function readGeminiAuth(): Promise<GeminiAuthData | null> {
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

export function accessTokenExpired(auth: GeminiAuthData): boolean {
  const BUFFER_MS = 60_000
  return auth.expires <= Date.now() + BUFFER_MS
}
