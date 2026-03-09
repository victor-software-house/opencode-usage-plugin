import { existsSync } from "fs"
import { readFile } from "fs/promises"
import { homedir } from "os"
import { join } from "path"
import { getAuthFilePath } from "../../utils/paths.js"
import { type AnthropicAuthData } from "./types.js"

export async function readAnthropicAuth(): Promise<AnthropicAuthData | null> {
  // 1. Check opencode auth.json (authoritative — managed by opencode's own auth flow)
  try {
    const authPath = getAuthFilePath()
    if (existsSync(authPath)) {
      const content = await readFile(authPath, "utf-8")
      const authData = JSON.parse(content)
      const anthropicAuth = authData?.["anthropic"]
      if (anthropicAuth?.access) {
        return anthropicAuth
      }
    }
  } catch {}

  // 2. Check ~/.claude/credentials.json (Claude Code desktop app credentials)
  try {
    const claudePath = join(homedir(), ".claude", "credentials.json")
    if (existsSync(claudePath)) {
      const content = await readFile(claudePath, "utf-8")
      const creds = JSON.parse(content)
      const oauth = creds?.claudeAiOauth
      if (oauth?.accessToken) {
        return {
          access: oauth.accessToken,
          refresh: oauth.refreshToken,
          expires: oauth.expiresAt
        }
      }
    }
  } catch {}

  // 3. Fall back to environment variable (may hold a stale or mismatched token
  //    when set globally — opencode auth.json is preferred above)
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return { access: process.env.CLAUDE_CODE_OAUTH_TOKEN }
  }

  return null
}
