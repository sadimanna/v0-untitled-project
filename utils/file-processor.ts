import fs from "fs"
import path from "path"
import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { CSVLoader } from "langchain/document_loaders/fs/csv"

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const loader = new PDFLoader(filePath)
    const docs = await loader.load()
    return docs.map((doc) => doc.pageContent).join("\n")
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    return "Error extracting text from PDF"
  }
}

export async function extractDataFromCSV(filePath: string): Promise<string> {
  try {
    const loader = new CSVLoader(filePath)
    const docs = await loader.load()
    return docs.map((doc) => doc.pageContent).join("\n")
  } catch (error) {
    console.error("Error extracting data from CSV:", error)
    return "Error extracting data from CSV"
  }
}

export function encodeFileToBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err)
      else resolve(data.toString("base64"))
    })
  })
}

export function createTempDirectory(): string {
  const uploadDir = path.join(__dirname, "..", "uploads")
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
  return uploadDir
}

export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error)
  }
}
