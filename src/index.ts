import type { Plugin } from "@opencode-ai/plugin"
import { notify, setStatus, clearStatus, log } from "./cmux.js"

const TAG = "[opencode-cmux]"

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
    } catch (e) {
      console.error(TAG, "fetchSession failed:", e)
      return null
    }
  }

  return {
    async event({ event }) {
      const e = event as any
      // Handle session status changes (busy/idle/retry)
      if (e.type === "session.status") {
        const { sessionID, status } = e.properties

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
            // Primary session — notify + log + clear
            await notify($, { title: `Done: ${title}` })
            await log($, `Done: ${title}`, { level: "success", source: "opencode" })
          } else {
            // Subagent session — log only (no notification spam)
            await log($, `Subagent finished: ${title}`, {
              level: "info",
              source: "opencode",
            })
          }
          // Always clear status on idle, regardless of primary/subagent
          await clearStatus($, "opencode")
          return
        }
      }

      // Handle session errors
      if (e.type === "session.error") {
        const sessionID = e.properties.sessionID
        const title = sessionID
          ? (await fetchSession(sessionID))?.title ?? sessionID
          : "unknown session"

        await notify($, { title: `Error: ${title}` })
        await log($, `Error in session: ${title}`, {
          level: "error",
          source: "opencode",
        })
        await clearStatus($, "opencode")
        return
      }

      // Handle question events
      if (e.type === "question.asked") {
        const header = e.properties.questions[0]?.header ?? "Question"
        await setStatus($, "opencode", "question", {
          icon: "help-circle",
          color: "#a855f7",
        })
        await notify($, { title: "Has a question", subtitle: header })
        await log($, `Question: ${header}`, { level: "info", source: "opencode" })
        return
      }

      if (e.type === "question.replied" || e.type === "question.rejected") {
        await clearStatus($, "opencode")
        return
      }
    },

    async "permission.ask"(input) {
      await notify($, { title: "Needs your permission", subtitle: input.title })
      await setStatus($, "opencode", "waiting", {
        icon: "lock",
        color: "#ef4444",
      })
      // Return undefined — do not block the permission
    },

  }
}

export default plugin
