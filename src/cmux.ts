import { existsSync } from "node:fs"
import type { PluginInput } from "@opencode-ai/plugin"

type Shell = PluginInput["$"]

const TAG = "[opencode-cmux]"

export function isInCmux(): boolean {
  return (
    existsSync(process.env.CMUX_SOCKET_PATH ?? "/tmp/cmux.sock") ||
    !!process.env.CMUX_WORKSPACE_ID
  )
}

async function run($: Shell, args: TemplateStringsArray, ...values: any[]) {
  const result = await $`cmux ${String.raw(args, ...values)}`.nothrow()
  if (result.exitCode !== 0) {
    const stderr = result.stderr?.toString().trim()
    if (stderr) {
      console.error(TAG, `cmux exited ${result.exitCode}:`, stderr)
    }
  }
  return result
}

export async function notify(
  $: Shell,
  opts: { title: string; subtitle?: string; body?: string },
): Promise<void> {
  if (!isInCmux()) return
  const args: string[] = ["--title", opts.title]
  if (opts.subtitle !== undefined) args.push("--subtitle", opts.subtitle)
  if (opts.body !== undefined) args.push("--body", opts.body)
  try {
    await $`cmux notify ${args}`.nothrow()
  } catch (e) {
    console.error(TAG, "notify failed:", e)
  }
}

export async function setStatus(
  $: Shell,
  key: string,
  text: string,
  opts?: { icon?: string; color?: string },
): Promise<void> {
  if (!isInCmux()) return
  const args: string[] = [key]
  if (opts?.icon !== undefined) args.push("--icon", opts.icon)
  if (opts?.color !== undefined) args.push("--color", opts.color)
  args.push("--", text)
  try {
    await $`cmux set-status ${args}`.nothrow()
  } catch (e) {
    console.error(TAG, "set-status failed:", e)
  }
}

export async function clearStatus($: Shell, key: string): Promise<void> {
  if (!isInCmux()) return
  try {
    await $`cmux clear-status ${key}`.nothrow()
  } catch (e) {
    console.error(TAG, "clear-status failed:", e)
  }
}

export async function log(
  $: Shell,
  message: string,
  opts?: { level?: "info" | "success" | "error" | "warn"; source?: string },
): Promise<void> {
  if (!isInCmux()) return
  const args: string[] = []
  if (opts?.level !== undefined) {
    // cmux uses "warning" but we expose "warn" for ergonomics
    const level = opts.level === "warn" ? "warning" : opts.level
    args.push("--level", level)
  }
  if (opts?.source !== undefined) args.push("--source", opts.source)
  args.push("--", message)
  try {
    await $`cmux log ${args}`.nothrow()
  } catch (e) {
    console.error(TAG, "log failed:", e)
  }
}
