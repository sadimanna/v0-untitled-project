const https = require("https")

function testGrokStreamAPI() {
  const apiKey = process.env.GROK_API_KEY

  if (!apiKey) {
    console.error("GROK_API_KEY environment variable is not set")
    console.error("Example: GROK_API_KEY=your_api_key node test-grok-stream.js")
    process.exit(1)
  }

  const data = JSON.stringify({
    model: "grok-2-1212",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Write a short poem about AI." },
    ],
    stream: true,
  })

  const options = {
    hostname: "api.x.ai",
    port: 443,
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Length": data.length,
    },
  }

  const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`)

    res.on("data", (chunk) => {
      const chunkStr = chunk.toString()
      console.log("Received chunk:", chunkStr)

      // Process the chunk (which may contain multiple SSE messages)
      const lines = chunkStr.split("\n")
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") {
            console.log("Stream completed")
          } else {
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                process.stdout.write(content)
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    })

    res.on("end", () => {
      console.log("\nStream ended")
    })
  })

  req.on("error", (error) => {
    console.error("Error testing Grok API:", error)
  })

  req.write(data)
  req.end()
}

testGrokStreamAPI()
