import type { Plugin } from "@opencode-ai/plugin"
import { notify, setStatus, clearStatus, log } from "./cmux.js"

const plugin: Plugin = async ({ client, $ }) => {
  async function fetchSession(
    sessionID: string,
  ): Promise<{ title: string; parentID?: string } | null> {
    try {
      const result = await client.session.get({ path: { id: sessionID } })
      if (result.data) {
        return { title: result.data.title, parentID: result.data.parentID }
      }
      return null
    } catch {
      return null
    }
  }

  return {
    async event({ event }) {
      // Handle session status changes (busy/idle/retry)
      if (event.type === "session.status") {
        const { sessionID, status } = event.properties

        if (status.type === "busy") {
          await setStatus($, "opencode", "working", {
            icon: "terminal",
            color: "#f59e0b",
          })
          return
        }

        if (status.type === "idle") {
          const session = await fetchSession(sessionID)
          const title = session?.title ?? sessionID

          if (!session?.parentID) {
            // Primary session
            await notify($, { title: `Done: ${title}` })
            await log($, `Done: ${title}`, { level: "success", source: "opencode" })
            await clearStatus($, "opencode")
          } else {
            // Subagent session — log only, no notify/clearStatus to avoid spam
            await log($, `Subagent finished: ${title}`, {
              level: "info",
              source: "opencode",
            })
          }
          return
        }
      }

      // Handle session errors
      if (event.type === "session.error") {
        const sessionID = event.properties.sessionID
        const title = sessionID
          ? (await fetchSession(sessionID))?.title ?? sessionID
          : "unknown session"

        await notify($, { title: `Error: ${title}` })
        await log($, `Error in session: ${title}`, {
          level: "error",
          source: "opencode",
        })
        await clearStatus($, "opencode")
      }
    },

    async "permission.ask"(input) {
      const title =
        "title" in input && typeof input.title === "string"
          ? input.title
          : "Needs your permission"

      await notify($, { title: "Needs your permission", subtitle: title })
      await setStatus($, "opencode", "waiting", {
        icon: "lock",
        color: "#ef4444",
      })
      // Return undefined — do not block the permission
    },

    async "tool.execute.before"(input) {
      if (input.tool === "ask") {
        await notify($, { title: "Has a question" })
        await setStatus($, "opencode", "question", {
          icon: "help-circle",
          color: "#a855f7",
        })
      }
      // Return undefined — do not block the tool
    },
  }
}

export default plugin
