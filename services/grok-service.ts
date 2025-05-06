import type { AIServiceInterface } from "../types"
import fetch from "node-fetch"

export class GrokService implements AIServiceInterface {
  private apiKey: string
  private model = "grok-2-vision-1212"
  private apiUrl = "https://api.grok.ai/v1/chat/completions" // This is a placeholder URL

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey
    if (model) {
      this.model = model
    }
  }

  async createChatCompletion(messages: any[]) {
    try {
      // Create a custom async generator to handle streaming
      const stream = this.streamCompletion(messages)
      return stream
    } catch (error) {
      console.error("Error calling Grok API:", error)
      throw error
    }
  }

  private async *streamCompletion(messages: any[]) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Grok API error (${response.status}): ${errorText}`)
      }

      if (!response.body) {
        throw new Error("No response body received from Grok API")
      }

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              return
            }

            try {
              const parsed = JSON.parse(data)
              yield parsed
            } catch (e) {
              console.warn("Error parsing Grok API response:", e)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error streaming from Grok API:", error)
      throw error
    }
  }

  formatMessages(messages: any[], attachments: any[]): any[] {
    // Format messages for Grok API
    const apiMessages = messages.map((msg: any) => {
      // Handle messages with attachments
      if (msg.role === "user" && msg === messages[messages.length - 1] && attachments.length > 0) {
        // For Grok, we'll format content in a way similar to OpenAI
        return {
          role: "user",
          content: [
            { type: "text", text: msg.content || "" },
            ...attachments.map((attachment: any) => ({
              type: "image_url",
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
    // This is a generic implementation that may need adjustment
    return chunk?.choices?.[0]?.delta?.content || null
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
