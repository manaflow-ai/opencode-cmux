import { existsSync } from "node:fs"
import type { PluginInput } from "@opencode-ai/plugin"

type Shell = PluginInput["$"]

export function isInCmux(): boolean {
  return (
    existsSync(process.env.CMUX_SOCKET_PATH ?? "/tmp/cmux.sock") ||
    !!process.env.CMUX_WORKSPACE_ID
  )
}

export async function notify(
  $: Shell,
  opts: { title: string; subtitle?: string; body?: string },
): Promise<void> {
  if (!isInCmux()) return
  try {
    const args: string[] = ["--title", opts.title]
    if (opts.subtitle !== undefined) args.push("--subtitle", opts.subtitle)
    if (opts.body !== undefined) args.push("--body", opts.body)
    await $`cmux notify ${args}`.quiet().nothrow()
  } catch {
    // swallow errors silently
  }
}

export async function setStatus(
  $: Shell,
  key: string,
  text: string,
  opts?: { icon?: string; color?: string },
): Promise<void> {
  if (!isInCmux()) return
  try {
    const args: string[] = [key, text]
    if (opts?.icon !== undefined) args.push("--icon", opts.icon)
    if (opts?.color !== undefined) args.push("--color", opts.color)
    await $`cmux set-status ${args}`.quiet().nothrow()
  } catch {
    // swallow errors silently
  }
}

export async function clearStatus($: Shell, key: string): Promise<void> {
  if (!isInCmux()) return
  try {
    await $`cmux clear-status ${key}`.quiet().nothrow()
  } catch {
    // swallow errors silently
  }
}

export async function log(
  $: Shell,
  message: string,
  opts?: { level?: "info" | "success" | "error" | "warn"; source?: string },
): Promise<void> {
  if (!isInCmux()) return
  try {
    const args: string[] = []
    if (opts?.level !== undefined) {
      // cmux uses "warning" but we expose "warn" for ergonomics
      const level = opts.level === "warn" ? "warning" : opts.level
      args.push("--level", level)
    }
    if (opts?.source !== undefined) args.push("--source", opts.source)
    args.push("--", message)
    await $`cmux log ${args}`.quiet().nothrow()
  } catch {
    // swallow errors silently
  }
}
