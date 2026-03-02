/**
 * Formats GitHub Copilot usage snapshots.
 * Handles chat and completion quotas with progress bars and reset times.
 */

import type { UsageSnapshot } from "../../types"
import { formatBar, formatResetSuffixISO, formatMissingSnapshot } from "./shared"

export function formatCopilotSnapshot(snapshot: UsageSnapshot): string[] {
  const copilot = snapshot.copilotQuota
  if (!copilot) return formatMissingSnapshot(snapshot)

  const lines = ["→ [GITHUB] Copilot"]
  const reset = copilot.resetTime ? formatResetSuffixISO(copilot.resetTime) : ""
  const limitValue = copilot.limit === -1 ? -1 : Math.max(0, Math.floor(copilot.limit))
  const chatValue = limitValue === -1
    ? Math.max(0, Math.floor(copilot.remaining))
    : Math.max(0, Math.min(Math.floor(copilot.remaining), limitValue))
  const limit = limitValue === -1 ? "∞" : limitValue.toString()
  const chatPct = Math.max(0, Math.min(100, Math.round(copilot.percentRemaining)))

  lines.push(`  ${"Chat:".padEnd(13)} ${formatBar(chatPct)} ${chatValue}/${limit}${reset}`)

  if (copilot.completionsRemaining !== undefined && copilot.completionsLimit !== undefined) {
    const completionsLimit = Math.max(0, Math.floor(copilot.completionsLimit))
    const completionsRemaining = completionsLimit > 0
      ? Math.max(0, Math.min(Math.floor(copilot.completionsRemaining), completionsLimit))
      : Math.max(0, Math.floor(copilot.completionsRemaining))
    const pct = completionsLimit > 0
      ? Math.round((completionsRemaining / completionsLimit) * 100)
      : 0
    lines.push(`  ${"Completions:".padEnd(13)} ${formatBar(pct)} ${completionsRemaining}/${completionsLimit}`)
  }

  return lines
}
