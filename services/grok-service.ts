import type { AIServiceInterface } from "../types"
import { XAI } from "@xai-org/xai-js"

export class GrokService implements AIServiceInterface {
  private client: XAI
  private model = "grok-2-vision-1212"

  constructor(apiKey: string, model?: string) {
    this.client = new XAI({
      apiKey,
    })
    if (model) {
      this.model = model
    }
  }

  async createChatCompletion(messages: any[]) {
    try {
      // Grok API for streaming
      return this.client.chat.completions.create({
        model: this.model,
        messages,
        stream: true,
      })
    } catch (error) {
      console.error("Error calling Grok API:", error)
      throw error
    }
  }

  formatMessages(messages: any[], attachments: any[]): any[] {
    // Format messages for Grok API
    const apiMessages = messages.map((msg: any) => {
      // Grok has a different format for handling images
      if (msg.role === "user" && msg === messages[messages.length - 1] && attachments.length > 0) {
        // For Grok, we need to format the content differently
        // This is a simplified example - adjust based on actual Grok API requirements
        return {
          role: "user",
          content: [
            { type: "text", text: msg.content || "" },
            ...attachments.map((attachment: any) => ({
              type: "image",
              image_url: attachment.image_url.url,
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
    // Extract content from Grok API response chunk
    // Adjust based on actual Grok API response format
    return chunk.choices?.[0]?.delta?.content || null
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
