const https = require("https")

function testGrokAPI() {
  const apiKey = process.env.GROK_API_KEY

  if (!apiKey) {
    console.error("GROK_API_KEY environment variable is not set")
    console.error("Example: GROK_API_KEY=your_api_key node test-grok-simple.js")
    process.exit(1)
  }

  const data = JSON.stringify({
    model: "grok-2",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello, how are you?" },
    ],
    stream: false,
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
    let responseData = ""

    console.log(`Status Code: ${res.statusCode}`)

    res.on("data", (chunk) => {
      responseData += chunk
    })

    res.on("end", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const parsedData = JSON.parse(responseData)
          console.log("Success! Response:", JSON.stringify(parsedData, null, 2))
        } catch (e) {
          console.error("Error parsing response:", e)
          console.log("Raw response:", responseData)
        }
      } else {
        console.error(`Error: ${res.statusCode}`)
        console.error("Response:", responseData)
      }
    })
  })

  req.on("error", (error) => {
    console.error("Error testing Grok API:", error)
  })

  req.write(data)
  req.end()
}

testGrokAPI()
