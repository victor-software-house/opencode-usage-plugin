import type { UsageProvider } from "../base.js"
import type { UsageSnapshot } from "../../types.js"
import { readGeminiAuth, accessTokenExpired } from "./auth.js"
import { fetchGeminiQuota, refreshGeminiToken, resolveProjectId } from "./fetch.js"
import type { GeminiQuotaBucket } from "./fetch.js"

export type { GeminiQuotaBucket }

export const GeminiProvider: UsageProvider<void> = {
  id: "google",
  displayName: "Google Gemini",

  async fetchUsage(): Promise<UsageSnapshot | null> {
    let auth = await readGeminiAuth()
    if (!auth) return null

    if (accessTokenExpired(auth)) {
      const refreshed = await refreshGeminiToken(auth.refresh)
      if (!refreshed) return null
      auth = { ...auth, ...refreshed }
    }

    const projectId = resolveProjectId(auth.projectId, auth.managedProjectId)
    if (!projectId) return null

    const quota = await fetchGeminiQuota(auth.access, projectId)
    if (!quota?.buckets?.length) return null

    return {
      timestamp: Date.now(),
      updatedAt: Date.now(),
      provider: "google",
      planType: null,
      primary: null,
      secondary: null,
      codeReview: null,
      credits: null,
      geminiQuota: {
        projectId,
        buckets: quota.buckets,
      },
    }
  },
}
