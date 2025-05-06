export type AIProvider = "openai" | "grok" | "anthropic" | "deepseek"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  experimental_attachments?: Attachment[]
}

export interface Attachment {
  contentType: string
  url: string
  name?: string
}

export interface OpenAIMessage {
  role: string
  content: string | ContentPart[]
}

export interface ContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: {
    url: string
  }
}

export interface AIServiceInterface {
  createChatCompletion(messages: any[]): Promise<any>
  formatMessages(messages: any[], attachments: any[]): any[]
  extractContentFromChunk(chunk: any): string | null
  getSystemPrompt(): string
  getModelName(): string
}
