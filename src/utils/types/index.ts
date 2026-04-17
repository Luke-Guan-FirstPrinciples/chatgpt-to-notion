import type { ChatGPTConversation, ChatGPTMessage } from "~models/chatgpt/types"
import type { ClaudeConversation, ClaudeMessage } from "~models/claude/types"
import type {
  DeepseekConversation,
  DeepseekMessage
} from "~models/deepseek/types"
import type { MistralConversation, MistralMessage } from "~models/mistral/types"

import type { IconResponse, SelectPropertyResponse } from "./notion"

export type SupportedModels = "chatgpt" | "deepseek" | "mistral" | "claude"
// | "gemini"

export type ToBeSaved = {
  prompt: string
  answer: string
  title: string
  url: string
  pin: number
} | null

export type Error = {
  code?: string | null
  message?: string | null
  status?: number | null
}

export type RichTextProperty = {
  id: string
  name: string
}

export type StoredDatabase = {
  id: string
  title: string
  icon: IconResponse
  propertiesIds: {
    title: string
    url: string
  }
  tags: {
    options: SelectPropertyResponse[]
    name: string
    id: string
    type: "select" | "multi_select"
  }[]
  /** Legacy single-selection (kept for back-compat). Per-property selection now lives in `tagSelections`. */
  tagIndex: number
  tagPropertyIndex: number
  /** Per-property selection. For a `select` property it's a single index array (or empty);
   * for a `multi_select` property it can hold multiple indices. Keyed by property id. */
  tagSelections?: Record<string, number[]>
  /** Rich-text properties present in the DB, available as "prompts column" targets. */
  richTextProps?: RichTextProperty[]
  /** If set, the joined user prompts are written into this rich-text property at save time. */
  promptsPropertyId?: string | null
}

export type PopupEnum =
  | "index"
  | "save"
  | "settings"
  | "about"
  | "wrongpage"
  | "dbsettings"
  | "premium"
  | "ecology"
  | "history"
  | "error"

export type SaveBehavior = "override" | "append" | "ignore"

export type ChatConfig = {
  enabled: boolean
  targetPageId: string | null
  database: StoredDatabase | null
  lastSaveStatus: "success" | "error" | "generating" | null
  lastError: {
    message: string | null
    code: string | null
  } | null
}

export type AutosaveStatus =
  | "generating"
  | "saving"
  | "saved"
  | "error"
  | "disabled"

export type SaveStatus =
  | `saving:${number}:${number}`
  | "saved"
  | "error"
  | "fetching"
  | null

export type Conversation = {
  chatgpt: ChatGPTConversation
  deepseek: DeepseekConversation
  mistral: MistralConversation
  claude: ClaudeConversation
}

export type Message = {
  chatgpt: ChatGPTMessage
  deepseek: DeepseekMessage
  mistral: MistralMessage
  claude: ClaudeMessage
}

export type ConversationTextdocs = {
  id: string
  version: number
  title: string
  textdoc_type: string
  content: string
  comments: string[]
  updated_at: string
}[]

export type HistorySaveError = {
  url: string
  title: string
  message: string
}

export type ModelHeaders = {
  model: SupportedModels
  headers: { name: string; value?: string }[]
}
