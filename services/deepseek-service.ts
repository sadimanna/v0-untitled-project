import type { AIServiceInterface } from "../types"
import { DeepSeek } from "deepseek-api"

export class DeepSeekService implements AIServiceInterface {
  private client: DeepSeek
  private model = "deepseek-reasoner"

  constructor(apiKey: string, model?: string) {
    this.client = new DeepSeek({
      apiKey,
    })
    if (model) {
      this.model = model
    }
  }

  async createChatCompletion(messages: any[]) {
    try {
      return this.client.chat.completions.create({
        model: this.model,
        messages,
        stream: true,
      })
    } catch (error) {
      console.error("Error calling DeepSeek API:", error)
      throw error
    }
  }

  formatMessages(messages: any[], attachments: any[]): any[] {
    // Format messages for DeepSeek API
    const apiMessages = messages.map((msg: any) => {
      // DeepSeek might have a different format for handling images
      // This is a simplified example - adjust based on actual DeepSeek API requirements
      if (msg.role === "user" && msg === messages[messages.length - 1] && attachments.length > 0) {
        // For now, we'll just include a note about images since DeepSeek Reasoner
        // might not support image inputs directly
        return {
          role: msg.role,
          content: `${msg.content || ""}\n[Note: This message includes ${attachments.length} image(s) which may not be directly viewable by the model]`,
        }
      }
      return {
        role: msg.role,
        content: msg.content,
      }
    })

    // Add system message if not present
    if (!apiMessages.some((msg: any) => msg.role === "system")) {
      apiMessages.unshift({
        role: "system",
        content: this.getSystemPrompt(),
      })
    }

    return apiMessages
  }

  extractContentFromChunk(chunk: any): string | null {
    // Extract content from DeepSeek API response chunk
    return chunk.choices?.[0]?.delta?.content || null
  }

  getSystemPrompt(): string {
    return `You are MediAssist AI, a helpful medical assistant chatbot. 
    You can analyze health data from CSV files and medical documents from PDFs.
    
    When analyzing CSV data:
    - Summarize the data structure
    - Identify key trends or patterns
    - Explain the medical relevance of the data
    
    When analyzing PDFs:
    - Summarize the key information
    - Explain medical terminology in simple terms
    - Highlight important points
    
    Always remind users that you're not a replacement for professional medical advice.
    Be empathetic, clear, and helpful in your responses.`
  }

  getModelName(): string {
    return this.model
  }
}
