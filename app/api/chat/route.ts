// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const messagesJson = formData.get("messages") as string
    const messages = messagesJson ? JSON.parse(messagesJson) : []
    const files = formData.getAll("files") as File[]

    console.log("API received messages:", JSON.stringify(messages, null, 2))
    console.log("Files received:", files.length)

    // Process and prepare form data for the backend
    const backendFormData = new FormData()

    // Add messages as JSON
    backendFormData.append("messages", JSON.stringify(messages))

    // Add any file attachments
    if (files.length > 0) {
      for (const file of files) {
        backendFormData.append("files", file)
      }
    }

    // Call your backend server
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3001"
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      body: backendFormData,
    })

    // Return the streamed response
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
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
