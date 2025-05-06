import Anthropic from "@anthropic-ai/sdk"
import type { AIServiceInterface } from "../types"

export class AnthropicService implements AIServiceInterface {
  private client: Anthropic
  private model = "claude-3-5-sonnet"

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({
      apiKey,
    })
    if (model) {
      this.model = model
    }
  }

  async createChatCompletion(messages: any[]) {
    try {
      return this.client.messages.create({
        model: this.model,
        messages,
        stream: true,
      })
    } catch (error) {
      console.error("Error calling Anthropic API:", error)
      throw error
    }
  }

  formatMessages(messages: any[], attachments: any[]): any[] {
    // Format messages for Anthropic API
    const apiMessages = messages.map((msg: any) => {
      // Anthropic has a different format for handling images
      if (msg.role === "user" && msg === messages[messages.length - 1] && attachments.length > 0) {
        return {
          role: msg.role,
          content: [
            { type: "text", text: msg.content || "" },
            ...attachments.map((attachment: any) => ({
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg", // Adjust based on actual image type
                data: attachment.image_url.url.split(",")[1], // Extract base64 data
              },
            })),
          ],
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
    // Extract content from Anthropic API response chunk
    return chunk.delta?.text || null
  }

  getSystemPrompt(): string {
    return `You are MediAssist AI, a helpful medical assistant chatbot. 
    You can analyze medical images, health data from CSV files, and medical documents from PDFs.
    
    When analyzing images:
    - Describe what you see in the image
    - Identify potential medical concerns if visible
    - Provide general information related to what's shown
    - Always clarify you're not providing a diagnosis
    
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
