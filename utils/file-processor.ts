import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv"
import fs from "fs"
import path from "path"
import { fileTypeFromBuffer } from "file-type"

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const loader = new PDFLoader(filePath)
  const docs = await loader.load()
  return docs.map((doc: { pageContent: string }) => doc.pageContent).join("\n")
}

export async function extractDataFromCSV(filePath: string): Promise<string> {
  const loader = new CSVLoader(filePath)
  const docs = await loader.load()
  return docs.map((doc: { pageContent: string }) => doc.pageContent).join("\n")
}

export async function encodeFileToBase64(filePath: string): Promise<string> {
  const fileBuffer = await fs.promises.readFile(filePath)
  return fileBuffer.toString("base64")
}

export function createTempDirectory(): string {
  const tempDir = path.join(process.cwd(), "temp")
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }
  return tempDir
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
