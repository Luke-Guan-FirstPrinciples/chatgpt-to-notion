/**
 * Enumerate the user's recent conversations and group them by the `gizmo_id`
 * that ChatGPT attaches to project-bound chats. Projects have gizmo ids of
 * the form `g-p-<uuid>-<slug>`.
 *
 * ChatGPT does not expose a clean public "list my projects" endpoint. The
 * conversations listing is the most reliable source available to a browser
 * extension that already knows the user's auth headers.
 */

const PAGE_SIZE = 50
const MAX_PAGES = 10 // up to 500 recent conversations

export type ChatGPTProject = {
  gizmo_id: string
  /** Best-effort human label; falls back to a short form of the gizmo_id. */
  title: string
  /** How many conversations in the recent window belong to this project. */
  conversationCount: number
}

type ConversationItem = {
  id: string
  title?: string
  gizmo_id?: string | null
  async_status?: number
}

const isProjectGizmo = (g?: string | null): g is string =>
  typeof g === "string" && g.startsWith("g-p-")

export const listChatGPTProjects = async (
  headers: any
): Promise<ChatGPTProject[]> => {
  const byId = new Map<string, ChatGPTProject>()

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE
    try {
      const res = await fetch(
        `https://chatgpt.com/backend-api/conversations?offset=${offset}&limit=${PAGE_SIZE}&order=updated`,
        {
          method: "GET",
          headers: headers,
          credentials: "include"
        }
      )
      if (!res.ok) break
      const data = await res.json()
      const items: ConversationItem[] = data?.items ?? []
      if (items.length === 0) break

      for (const item of items) {
        if (!isProjectGizmo(item.gizmo_id)) continue
        const existing = byId.get(item.gizmo_id)
        if (existing) {
          existing.conversationCount++
        } else {
          byId.set(item.gizmo_id, {
            gizmo_id: item.gizmo_id,
            title: deriveProjectTitle(item.gizmo_id),
            conversationCount: 1
          })
        }
      }

      const total: number | undefined = data?.total
      if (typeof total === "number" && offset + items.length >= total) break
    } catch (err) {
      console.error("listChatGPTProjects failed on page", page, err)
      break
    }
  }

  // Try to upgrade each title by hitting the gizmo details endpoint (best
  // effort; silently skip on failure).
  await Promise.all(
    Array.from(byId.values()).map(async (project) => {
      try {
        const res = await fetch(
          `https://chatgpt.com/backend-api/gizmos/${project.gizmo_id}`,
          { method: "GET", headers, credentials: "include" }
        )
        if (!res.ok) return
        const data = await res.json()
        const name =
          data?.gizmo?.display?.name ??
          data?.gizmo?.short_url ??
          data?.gizmo?.name
        if (typeof name === "string" && name.length > 0) {
          project.title = name
        }
      } catch {
        // keep derived title
      }
    })
  )

  return Array.from(byId.values()).sort(
    (a, b) => b.conversationCount - a.conversationCount
  )
}

const deriveProjectTitle = (gizmoId: string) => {
  // "g-p-<uuid>-<slug-with-hyphens>" — try to pull out the slug portion.
  const slugPart = gizmoId.replace(/^g-p-[0-9a-f]+-?/i, "")
  if (!slugPart || slugPart === gizmoId) {
    return `Project ${gizmoId.slice(-8)}`
  }
  return slugPart.replace(/-/g, " ")
}

/**
 * Fetch every conversation id that belongs to a given project (by gizmo_id).
 * Paginates through the same /conversations endpoint the extension already
 * relies on.
 */
export const listChatGPTProjectConversationIds = async (
  headers: any,
  projectGizmoId: string
): Promise<string[]> => {
  const ids: string[] = []

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE
    try {
      const res = await fetch(
        `https://chatgpt.com/backend-api/conversations?offset=${offset}&limit=${PAGE_SIZE}&order=updated`,
        {
          method: "GET",
          headers: headers,
          credentials: "include"
        }
      )
      if (!res.ok) break
      const data = await res.json()
      const items: ConversationItem[] = data?.items ?? []
      if (items.length === 0) break

      for (const item of items) {
        if (item.gizmo_id === projectGizmoId) ids.push(item.id)
      }

      const total: number | undefined = data?.total
      if (typeof total === "number" && offset + items.length >= total) break
    } catch (err) {
      console.error("listChatGPTProjectConversationIds failed", err)
      break
    }
  }

  return ids
}
