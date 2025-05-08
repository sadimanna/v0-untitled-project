require("dotenv").config()
const OpenAI = require("openai")

async function testGrokWithOpenAISDK() {
  // Use XAI_API_KEY as per Grok documentation
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY

  if (!apiKey) {
    console.error("XAI_API_KEY or GROK_API_KEY environment variable is not set")
    process.exit(1)
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.x.ai/v1",
  })

  try {
    console.log("Testing Grok API with OpenAI SDK...")

    const stream = await openai.chat.completions.create({
      model: "grok-2-vision-latest",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Write a short poem about AI." },
      ],
      stream: true,
    })

    console.log("Stream created successfully, receiving chunks:")

    for await (const chunk of stream) {
      process.stdout.write(chunk.choices[0]?.delta?.content || "")
    }

    console.log("\n\nStream completed successfully!")
  } catch (error) {
    console.error("Error testing Grok API:", error)
  }
}

testGrokWithOpenAISDK()
