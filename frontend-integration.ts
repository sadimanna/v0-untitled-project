export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Extract any file attachments from the messages
    const attachments = messages.reduce((acc: any[], message: any) => {
      if (message.experimental_attachments?.length) {
        return [...acc, ...message.experimental_attachments]
      }
      return acc
    }, [])

    // Prepare form data for the backend
    const formData = new FormData()

    // Add messages as JSON
    formData.append("messages", JSON.stringify(messages))

    // Add any file attachments
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        // Convert the attachment URL to a file
        const response = await fetch(attachment.url)
        const blob = await response.blob()
        const file = new File([blob], attachment.name || "file", { type: attachment.contentType })
        formData.append("files", file)
      }
    }

    // Call your backend server
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3002"
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      body: formData,
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
