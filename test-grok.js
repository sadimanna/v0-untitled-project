// For Node.js 18+ which has built-in fetch
async function testGrokAPI() {
  const apiKey = process.env.GROK_API_KEY

  if (!apiKey) {
    console.error("GROK_API_KEY environment variable is not set")
    return
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello, how are you?" },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error: ${response.status} - ${errorText}`)
      return
    }

    const data = await response.json()
    console.log("Success! Response:", JSON.stringify(data, null, 2))
  } catch (error) {
    console.error("Error testing Grok API:", error)
  }
}

// Make sure the GROK_API_KEY environment variable is set
if (!process.env.GROK_API_KEY) {
  console.error("Please set the GROK_API_KEY environment variable before running this script.")
  console.error("Example: GROK_API_KEY=your_api_key node test-grok.js")
  process.exit(1)
}

testGrokAPI()
