import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Debug: Log the incoming messages to see what's being received
    console.log("API received messages:", JSON.stringify(messages, null, 2))

    // Check if any message has attachments
    const hasAttachments = messages.some(
      (message: any) => message.experimental_attachments && message.experimental_attachments.length > 0,
    )

    if (hasAttachments) {
      console.log("Message contains attachments")
    }

    // Use GPT-4o for multi-modal capabilities
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      system: `You are MediAssist AI, a helpful medical assistant chatbot. 
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
      Be empathetic, clear, and helpful in your responses.`,
    })

    return result.toDataStreamResponse({
      // Make sure we're sending attachments back to the client
      sendAttachments: true,
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
