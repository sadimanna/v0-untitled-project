import express, { Request, Response } from "express"
import multer from "multer"
import cors from "cors"
import path from "path"
import fs from "fs"
import { fileTypeFromBuffer } from "file-type"
import dotenv from "dotenv"
import {
  extractTextFromPDF,
  extractDataFromCSV,
  encodeFileToBase64,
  createTempDirectory,
  cleanupFile,
} from "./utils/file-processor"
import { parseFileSize } from "./utils/file-size-parser"
import { OpenAIService } from "./services/openai-service"
import { GrokService } from "./services/grok-service"
import type { AIProvider } from "./types"
import crypto from "crypto"

// Load environment variables
dotenv.config()

console.log("Starting server initialization...")

// Get AI provider from environment variables
const AI_PROVIDER = (process.env.AI_PROVIDER || "openai").toLowerCase() as AIProvider
console.log(`AI Provider set to: ${AI_PROVIDER}`)

// Initialize AI service based on provider
let aiService: GrokService

console.log("Initializing Grok AI provider...")
// Use XAI_API_KEY for Grok (as per their documentation)
const apiKey = process.env.XAI_API_KEY
if (!apiKey) {
  console.error("XAI_API_KEY environment variable is not set")
  process.exit(1)
}
console.log(`Grok API Key length: ${apiKey.length} characters`)

// Use the vision model for image support
aiService = new GrokService(apiKey, "grok-2-vision-latest")
console.log("Grok service initialized successfully")

const app = express()
const PORT = 3002  // Hardcode to 3002 to avoid any confusion
console.log(`Server will run on port: ${PORT}`)

// Parse MAX_FILE_SIZE environment variable
const MAX_FILE_SIZE = parseFileSize(process.env.MAX_FILE_SIZE || "10MB")
console.log(`Maximum file size set to: ${MAX_FILE_SIZE} bytes (${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)} MB)`)

// Configure CORS to allow requests from your frontend
const frontendUrl = "http://localhost:3000"  // Hardcode to 3000
console.log(`Configuring CORS for frontend URL: ${frontendUrl}`)

app.use(
  cors({
    origin: frontendUrl,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

app.use(express.json())

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = createTempDirectory()
    cb(null, uploadDir)
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE, // Use the parsed file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images, PDFs, and CSVs
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf" ||
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true)
    } else {
      cb(new Error("Unsupported file type. Please upload images, PDFs, or CSV files.") as any)
    }
  },
})

// Main chat endpoint
app.post("/api/chat", upload.array("files"), async (req: Request, res: Response) => {
  try {
    // Parse messages from request body
    const messages = typeof req.body.messages === 'string' 
      ? JSON.parse(req.body.messages) 
      : req.body.messages;

    const files = req.files as Express.Multer.File[]

    console.log(`Using AI Provider: ${AI_PROVIDER}`)
    console.log("Received chat request with messages:", JSON.stringify(messages, null, 2))
    console.log(
      "Received files:",
      files?.map((f) => f.originalname),
    )

    // Process uploaded files
    const processedAttachments = []
    const filePaths: string[] = []

    if (files && files.length > 0) {
      for (const file of files) {
        filePaths.push(file.path)
        const fileBuffer = fs.readFileSync(file.path)
        const fileType = await fileTypeFromBuffer(fileBuffer)

        // Process file based on type
        if (file.mimetype.startsWith("image/")) {
          // For images, encode as base64 for AI API
          const base64Image = await encodeFileToBase64(file.path)
          processedAttachments.push({
            type: "image_url",
            image_url: {
              url: `data:${file.mimetype};base64,${base64Image}`,
              detail: "high",
            },
          })
        } else if (file.mimetype === "application/pdf") {
          // For PDFs, extract text and add as a message
          const pdfText = await extractTextFromPDF(file.path)
          messages.push({
            role: "user",
            content: `PDF Content (${file.originalname}):\n${pdfText}`,
          })
        } else if (file.mimetype === "text/csv" || file.mimetype === "application/vnd.ms-excel") {
          // For CSVs, extract data and add as a message
          const csvData = await extractDataFromCSV(file.path)
          messages.push({
            role: "user",
            content: `CSV Data (${file.originalname}):\n${csvData}`,
          })
        }
      }
    }

    // Prepare messages for AI API
    const apiMessages = aiService.formatMessages(messages, processedAttachments)
    console.log("Formatted messages for API:", JSON.stringify(apiMessages, null, 2))

    // Set up streaming response
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")

    try {
      console.log(`Using ${AI_PROVIDER} for this request`)
      const stream = await aiService.createChatCompletion(apiMessages)

      // Stream the response
      let chunkCount = 0
      let fullResponse = ""
      const chunks: string[] = []
      for await (const chunk of stream) {
        chunkCount++
        const content = aiService.extractContentFromChunk(chunk)
        if (content) {
          fullResponse += content
          console.log(`Chunk ${chunkCount} content:`, content)
          chunks.push(content)
        }
      }
      console.log(`Total chunks received: ${chunkCount}`)
      console.log("Full response:", fullResponse)

      // Send the complete response as a single message
      const message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullResponse,
        createdAt: new Date().toISOString(),
        parts: [
          {
            type: "text",
            text: fullResponse
          }
        ]
      };
      // Ensure proper SSE format with double newlines
      const messageStr = `data: ${JSON.stringify(message)}\n\n`;
      console.log("Sending message:", messageStr);
      res.write(messageStr);
      res.write("data: [DONE]\n\n");
    } catch (error: any) {
      console.error(`Error from ${AI_PROVIDER} API:`, error)
      console.error(`Error stack:`, error.stack)
      res.write(`data: ${JSON.stringify({ error: `Error from ${AI_PROVIDER} API: ${error.message}` })}\n\n`)
      res.write("data: [DONE]\n\n")
    }

    res.end()

    // Clean up uploaded files
    filePaths.forEach(cleanupFile)
  } catch (error: any) {
    console.error("Error processing chat request:", error)
    res.status(500).json({
      error: "An error occurred while processing your request",
      details: error.message,
    })
  }
})

// File size limit info endpoint
app.get("/api/config", (req, res) => {
  res.status(200).json({
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2),
    provider: AI_PROVIDER,
    model: aiService.getModelName(),
  })
})

// Provider info endpoint
app.get("/api/provider", (req, res) => {
  res.status(200).json({
    provider: AI_PROVIDER,
    model: aiService.getModelName(),
  })
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    provider: AI_PROVIDER,
    maxFileSizeMB: (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2),
  })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} using ${AI_PROVIDER} provider`)
  console.log(`Maximum file size: ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)} MB`)
  console.log(`CORS enabled for: ${frontendUrl}`)
})
