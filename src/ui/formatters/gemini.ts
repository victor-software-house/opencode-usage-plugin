import type { UsageSnapshot, GeminiQuotaBucket } from "../../types"
import { formatBar, formatMissingSnapshot } from "./shared"

function formatResetTime(resetTime: string | undefined): string {
  if (!resetTime) return ""
  try {
    const diffMs = new Date(resetTime).getTime() - Date.now()
    if (diffMs <= 0) return " (just refreshed)"
    const totalMinutes = Math.ceil(diffMs / 60_000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const days = Math.floor(hours / 24)
    const remHours = hours % 24
    if (days > 0) return ` (resets in ${days}d${remHours > 0 ? `${remHours}hrs` : ""})`
    if (hours > 0) return ` (resets in ${hours}hrs${minutes > 0 ? `${minutes}m` : ""})`
    return ` (resets in ${minutes}m)`
  } catch {
    return ""
  }
}

function humanizeModelId(modelId: string): string {
  // "gemini-2.5-flash-001" -> "Gemini 2.5 Flash 001", strip trailing revision if clean
  return modelId
    .replace(/^gemini-/i, "Gemini ")
    .replace(/-(\d{3})$/, "") // strip -001 style revision suffix
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
}

function humanizeTokenType(tokenType: string | undefined): string {
  if (!tokenType || tokenType.toUpperCase() === "REQUESTS") return ""
  return ` (${tokenType.charAt(0).toUpperCase()}${tokenType.slice(1).toLowerCase()})`
}

interface BucketRow {
  label: string
  bar: string
  pctStr: string
  reset: string
}

export function formatGeminiSnapshot(snapshot: UsageSnapshot): string[] {
  const quota = snapshot.geminiQuota
  if (!quota?.buckets?.length) return formatMissingSnapshot(snapshot)

  // Group buckets by modelId
  const byModel = new Map<string, GeminiQuotaBucket[]>()
  for (const bucket of quota.buckets) {
    const key = bucket.modelId ?? "unknown"
    const group = byModel.get(key) ?? []
    group.push(bucket)
    byModel.set(key, group)
  }

  // Sort models: newer versions first
  const sortedModels = [...byModel.keys()].sort((a, b) => b.localeCompare(a))

  const lines: string[] = [`→ [GEMINI] Code Assist`]

  // Build all rows first so we can compute label width
  const allRows: BucketRow[] = []
  for (const modelId of sortedModels) {
    const buckets = byModel.get(modelId)!
    for (const bucket of buckets) {
      const fraction = bucket.remainingFraction ?? null
      const pct = fraction !== null ? Math.max(0, Math.min(100, Math.round(fraction * 100))) : null
      const bar = pct !== null ? formatBar(pct) : "░".repeat(15)
      const pctStr = pct !== null ? `${pct}% left` : "unknown"
      const tokenSuffix = humanizeTokenType(bucket.tokenType)
      const label = `${humanizeModelId(modelId)}${tokenSuffix}:`
      const reset = formatResetTime(bucket.resetTime)
      allRows.push({ label, bar, pctStr, reset })
    }
  }

  const labelWidth = Math.max(...allRows.map(r => r.label.length), 0) + 1
  for (const row of allRows) {
    lines.push(`  ${row.label.padEnd(labelWidth)} ${row.bar} ${row.pctStr}${row.reset}`)
  }

  return lines
}
