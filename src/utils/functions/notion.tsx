import { isFullDatabase, isFullPage } from "@notionhq/client"
import type {
  DatabaseObjectResponse,
  PageObjectResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse
} from "@notionhq/client/build/src/api-endpoints"

import type { ConversationTextdocs, StoredDatabase } from "~utils/types"

import { HTMLtoBlocks, i18n, mdToBlocks } from "."
import type {
  IconResponse,
  Property,
  PropertyType,
  SelectPropertyResponse
} from "../types/notion"

export const parseSearchResponse = (
  res: (
    | PageObjectResponse
    | DatabaseObjectResponse
    | PartialPageObjectResponse
    | PartialDatabaseObjectResponse
  )[]
) => {
  const pages: PageObjectResponse[] = []
  const partialPages: PartialPageObjectResponse[] = []
  const databases: DatabaseObjectResponse[] = []
  const partialDatabses: PartialDatabaseObjectResponse[] = []
  res.forEach((pageOrDB) => {
    if (pageOrDB.object === "page") {
      if (isFullPage(pageOrDB)) pages.push(pageOrDB)
      else partialPages.push(pageOrDB)
    } else {
      if (isFullDatabase(pageOrDB)) databases.push(pageOrDB)
      else partialDatabses.push(pageOrDB)
    }
  })
  return {
    pages,
    partialPages,
    databases,
    partialDatabses
  }
}

export const getProperty = <T extends PropertyType>(
  page: PageObjectResponse,
  property: string,
  type: T
): Property<T> | null => {
  if (!page.properties) return null
  if (!page.properties[property]) return null
  const prop = page.properties[property] as any
  if (prop.type !== type) return null
  return prop[type]
}

export const getDBProperty = <T extends PropertyType>(
  db: DatabaseObjectResponse,
  property: string,
  type: T
): Property<T> | null => {
  if (!db.properties) return null
  if (!db.properties[property]) return null
  const prop = db.properties[property] as any
  if (prop.type !== type) return null
  return prop[type]
}

export const getDBTagsProperties = (
  db: DatabaseObjectResponse
): (Property<"select"> | Property<"multi_select">)[] => {
  if (!db.properties) return []
  const keys = Object.keys(db.properties)
  const props = keys.map((key) => {
    const prop = db.properties[key]
    return {
      ...prop,
      name: key
    }
  })
  return props.filter(
    (prop) => prop.type === "select" || prop.type === "multi_select"
  ) as any
}

export const getIcon = (icon: IconResponse) => {
  if (!icon)
    return (
      <span className="text-2xl w-8 h-8 relative">
        <span className="absolute top-2 left-2 w-4 h-4 border-2 bg-main/25 border-main rounded" />
      </span>
    )
  switch (icon.type) {
    case "emoji":
      return <span className="text-2xl w-8 h-8">{icon.emoji}</span>
    case "file":
      return <img width={32} height={32} src={icon.file.url} alt="" />
    case "external":
      return <img width={32} height={32} src={icon.external.url} alt="" />
    default:
      return null
  }
}

export const getTagColor = (tag: SelectPropertyResponse) => {
  if (!tag) return ""
  if (tag.color === "default") return "bg-neutral-100 text-neutral-800"
  if (tag.color === "brown") return "bg-amber-100 text-amber-800"
  return `bg-${tag.color}-100 text-${tag.color}-800`
}

export const generateToggle = (content: string, children: any[]) => {
  return {
    object: "block" as const,
    type: "toggle" as const,
    toggle: {
      rich_text: [
        {
          type: "text" as const,
          text: {
            content,
            link: null
          },
          annotations: {
            bold: true,
            underline: true,
            italic: false,
            strikethrough: false,
            code: false,
            color: "default" as const
          }
        }
      ],
      children: children
    }
  }
}

export const generateCallout = (content: string) => {
  // I'm aware that I can use 'as const' once but readonly messes up typescript in other places
  return {
    object: "block" as const,
    type: "callout" as const,
    callout: {
      icon: {
        type: "emoji" as const,
        emoji: "⚙️" as const
      },
      rich_text: [
        {
          type: "text" as const,
          text: {
            content,
            link: null
          }
        }
      ]
    }
  }
}

export const generateBlocks = (
  prompt: string,
  answer: string,
  generateHeadings: boolean,
  isMarkdown: boolean = false
) => {
  let answerBlocks: any[]

  if (isMarkdown) {
    answerBlocks = mdToBlocks(answer, false)
  } else {
    answerBlocks = HTMLtoBlocks(answer)
  }

  const promptText =
    prompt.length > 2000
      ? prompt.match(/.{1,2000}/g)?.map((subPrompt) => ({
          type: "text",
          text: {
            content: subPrompt
          }
        }))!
      : [
          {
            type: "text",
            text: {
              content: prompt
            }
          }
        ]
  const promptBlock =
    promptText.length > 100
      ? promptText.reduce(
          (acc, curr, i) => {
            if (i % 100 === 0)
              acc.push({
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: []
                }
              })
            acc[acc.length - 1].paragraph.rich_text.push(curr)
            return acc
          },
          [] as {
            object: "block"
            type: "paragraph"
            paragraph: {
              rich_text: any[]
            }
          }[]
        )
      : [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: promptText
            }
          }
        ]

  const promptBlocks = [
    ...(generateHeadings
      ? [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content:
                      prompt.length > 80
                        ? prompt.substring(0, 80) + "..."
                        : prompt
                  }
                }
              ]
            }
          },
          {
            object: "block",
            type: "heading_3",
            heading_3: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "❓ " + i18n("notion_prompt")
                  }
                }
              ],
              is_toggleable: true,
              children: promptBlock
            }
          }
        ]
      : [
          {
            object: "block",
            type: "heading_3",
            heading_3: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "❓ " + i18n("notion_prompt")
                  }
                }
              ],
              is_toggleable: true,
              children: promptBlock
            }
          }
        ]),
    {
      object: "block",
      type: "heading_3",
      heading_3: {
        rich_text: [
          {
            type: "text",
            text: {
              content: "💬 " + i18n("notion_answer")
            }
          }
        ]
      }
    }
  ]

  return { promptBlocks, answerBlocks }
}

export const generateCanvasBlocks = (textdocs: ConversationTextdocs) => {
  if (textdocs.length === 0) return []
  return textdocs.reduce(
    (acc, doc) => {
      return [
        ...acc,
        {
          object: "block",
          type: "heading_3",
          heading_3: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: "📄 " + doc.title
                }
              }
            ]
          }
        },
        ...mdToBlocks(
          "```" +
            `${getTextdocType(doc.textdoc_type)}\n` +
            doc.content +
            "\n```"
        )
      ]
    },
    [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [
            {
              type: "text",
              text: {
                content: "📄 Canvas"
              }
            }
          ]
        }
      }
    ] as any[]
  )
}

const getTextdocType = (type: string) => {
  if (type.includes("code")) return type.split("/")[1]
  return type
}

export const generateTag = (
  params: {
    options: SelectPropertyResponse[]
    name: string
    id: string
    type: "select" | "multi_select"
  },
  tagIndex: number
) => {
  if (tagIndex === -1 || !params.options) return undefined
  const { options, type } = params
  return type === "select"
    ? { select: { id: options[tagIndex].id } }
    : {
        multi_select: [{ id: options[tagIndex].id }]
      }
}

/**
 * Build the per-property property-values payload for Notion from the user's
 * stored selections. Returns an object mapping property-id to the Notion
 * property value shape, ready to merge into `pages.create({ properties: ... })`.
 */
export const generateTagProperties = (database: StoredDatabase) => {
  const out: Record<string, any> = {}
  const selections = database.tagSelections ?? {}
  for (const tag of database.tags) {
    const indices = selections[tag.id] ?? []
    if (indices.length === 0) continue
    if (tag.type === "select") {
      const idx = indices[0]
      if (idx < 0 || idx >= tag.options.length) continue
      out[tag.id] = { select: { id: tag.options[idx].id } }
    } else {
      const options = indices
        .filter((i) => i >= 0 && i < tag.options.length)
        .map((i) => ({ id: tag.options[i].id }))
      if (options.length === 0) continue
      out[tag.id] = { multi_select: options }
    }
  }
  return out
}

export const formatDB = (
  db: DatabaseObjectResponse,
  previous?: StoredDatabase | null
): StoredDatabase | null => {
  const properties = Object.values(db.properties)
  const titleID = properties.filter((val) => val.type === "title")[0].id
  const urls = properties.filter((val) => val.type === "url")
  if (urls.length === 0) return null
  const urlID = urls[0].id
  const tags = getDBTagsProperties(db)

  const richTextProps = Object.entries(db.properties)
    .filter(([, val]) => val.type === "rich_text")
    .map(([name, val]) => ({ id: (val as any).id, name }))

  // Preserve the user's previous per-property selections where the property
  // still exists on the (possibly refreshed) database.
  const previousSelections = previous?.tagSelections ?? {}
  const tagSelections: Record<string, number[]> = {}
  for (const tag of tags) {
    if (!previousSelections[tag.id]) continue
    const validIndices = previousSelections[tag.id].filter(
      (i) => i >= 0 && i < (tag as any)[tag.type].options.length
    )
    if (validIndices.length > 0) tagSelections[tag.id] = validIndices
  }

  const promptsPropertyId =
    previous?.promptsPropertyId &&
    richTextProps.some((p) => p.id === previous?.promptsPropertyId)
      ? previous.promptsPropertyId
      : null

  const formattedDB: StoredDatabase = {
    id: db.id,
    title: db.title[0].plain_text,
    icon: db.icon,
    propertiesIds: {
      title: titleID,
      url: urlID
    },
    tags: tags.map((prop) => {
      return {
        name: prop.name,
        type: prop.type,
        id: prop.id,
        options:
          prop.type === "multi_select"
            ? prop.multi_select.options
            : prop.select.options
      }
    }),
    tagPropertyIndex: previous?.tagPropertyIndex ?? 0,
    tagIndex: previous?.tagIndex ?? -1,
    tagSelections,
    richTextProps,
    promptsPropertyId
  }

  return formattedDB
}
