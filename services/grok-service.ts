import type { AIServiceInterface } from "../types"
import OpenAI from "openai"

export class GrokService implements AIServiceInterface {
  private client: OpenAI
  private model = "grok-2-1212" // Default model

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.x.ai/v1",
    })

    if (model) {
      this.model = model
    }
  }

  async createChatCompletion(messages: any[]) {
    try {
      console.log("Calling Grok API with messages:", JSON.stringify(messages, null, 2))
      console.log("Using model:", this.model)

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
      // Handle messages with attachments
      if (msg.role === "user" && msg === messages[messages.length - 1] && attachments.length > 0) {
        // For Grok, format content as an array of content parts
        return {
          role: "user",
          content: [
            { type: "text", text: msg.content || "" },
            ...attachments.map((attachment: any) => ({
              type: "image_url",
              image_url: {
                url: attachment.image_url.url,
                detail: "high",
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
    // Extract content from Grok API response chunk
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
