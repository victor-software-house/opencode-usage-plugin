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
 * Reads the Gemini OAuth token stored by opencode-gemini-auth.
 * The plugin stores credentials under the "google" key in auth.json as type "oauth".
 * The refresh field is packed as "refreshToken|projectId|managedProjectId".
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
