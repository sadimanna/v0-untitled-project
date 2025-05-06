import express from "express"
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

// Load environment variables
dotenv.config()

// Get AI provider from environment variables
const AI_PROVIDER = (process.env.AI_PROVIDER || "openai").toLowerCase() as AIProvider

// Initialize AI service based on provider
let aiService: OpenAIService | GrokService

if (AI_PROVIDER === "grok") {
  aiService = new GrokService(process.env.GROK_API_KEY || "")
} else {
  // Default to OpenAI
  aiService = new OpenAIService(process.env.OPENAI_API_KEY || "")
}

const app = express()
const PORT = process.env.PORT || 3001

// Parse MAX_FILE_SIZE environment variable
const MAX_FILE_SIZE = parseFileSize(process.env.MAX_FILE_SIZE || "10MB")
console.log(`Maximum file size set to: ${MAX_FILE_SIZE} bytes (${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)} MB)`)

// Configure CORS to allow requests from your frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

app.use(express.json())

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = createTempDirectory()
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + "-" + uniqueSuffix + ext)
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
app.post("/api/chat", upload.array("files"), async (req, res) => {
  try {
    const { messages } = req.body
    const files = req.files as Express.Multer.File[]

    console.log(`Using AI Provider: ${AI_PROVIDER}`)
    console.log("Received chat request with messages:", messages)
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

    // Set up streaming response
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")

    try {
      // Get streaming response from AI provider
      const stream = await aiService.createChatCompletion(apiMessages)

      // Stream the response
      for await (const chunk of stream) {
        const content = aiService.extractContentFromChunk(chunk)
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`)
        }
      }

      res.write("data: [DONE]\n\n")
    } catch (error: any) {
      console.error(`Error from ${AI_PROVIDER} API:`, error)
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
})
