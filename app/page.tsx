"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageList } from "@/components/message-list"
import { SpeechRecognizer } from "@/components/speech-recognition"
import { FileUploadDialog } from "@/components/file-upload-dialog"
import { FileText, Send, Loader2, Paperclip, ImageIcon, FileSpreadsheet, Upload } from "lucide-react"

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [fileDialogOpen, setFileDialogOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatAreaRef = useRef<HTMLDivElement>(null)
  const [maxFileSize, setMaxFileSize] = useState<string>("10 MB")

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: "/api/chat",
    id: "medical-assistant",
    // This prevents the API from being called on every keystroke
    mode: "manual",
  })

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Allow submission if there are files, even if there's no text
    if (!input.trim() && (!files || files.length === 0)) return

    console.log("Submitting form with files:", files ? Array.from(files).map((f) => f.name) : "none")

    // Create a copy of the files before clearing them
    const filesToSend = files

    // If there's no text but there are files, set a placeholder text
    // This ensures the message is properly created and displayed
    let currentInput = input
    if (!input.trim() && files && files.length > 0) {
      // Set a non-visible placeholder for file-only messages
      currentInput = " " // Space character that won't be visible but ensures message creation

      // Alternative approach: explicitly set a placeholder text
      // currentInput = `[File${files.length > 1 ? 's' : ''} uploaded]`;
    }

    // Submit the form with files and/or text
    handleSubmit(e, {
      experimental_attachments: filesToSend || undefined,
      // options: {
      body: {
        // Override the input with our modified version
        input: currentInput,
      },
      // },
      allowEmptySubmit: true,
    })

    // Clear files immediately after sending
    setFiles(null)
  }

  const handleSpeechResult = (transcript: string) => {
    setInput(transcript)
    // Focus the textarea after speech recognition
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Attach the files
      setFiles(e.dataTransfer.files)
    }
  }, [])

  // Fetch config from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
        const response = await fetch(`${backendUrl}/api/config`)
        const data = await response.json()
        setMaxFileSize(`${data.maxFileSizeMB} MB`)
      } catch (error) {
        console.error("Error fetching config:", error)
      }
    }

    fetchConfig()
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-blue-600">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="MediBot" />
              <AvatarFallback>MB</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold text-blue-800">MediAssist AI</h1>
          </div>
        </header>

        <Card
          className={`flex-1 flex flex-col overflow-hidden p-4 mb-4 border-blue-100 shadow-sm relative ${
            dragActive ? "border-2 border-blue-500 bg-blue-50" : ""
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          ref={chatAreaRef}
        >
          {dragActive && (
            <div className="absolute inset-0 bg-blue-50 bg-opacity-70 flex items-center justify-center z-10">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <h3 className="text-lg font-medium">Drop files to attach</h3>
                <p className="text-sm text-gray-500">Files will be attached to your message</p>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 pr-4">
            <MessageList messages={messages} />
            {isLoading && (
              <div className="flex items-center gap-2 text-blue-600 animate-pulse mt-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>MediAssist is thinking...</p>
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleFormSubmit} className="mt-4 flex flex-col gap-2">
            {files && files.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-blue-50 p-2 rounded-md border border-blue-100">
                <span className="text-sm font-medium text-blue-800">
                  {files.length} {files.length === 1 ? "file" : "files"} ready to send:
                </span>
                <div className="flex flex-wrap gap-2">
                  {Array.from(files).map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-white text-blue-800 px-2 py-1 rounded-md text-sm border border-blue-100"
                    >
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="h-3 w-3" />
                      ) : file.type === "application/pdf" ? (
                        <FileText className="h-3 w-3" />
                      ) : file.type === "text/csv" || file.type === "application/vnd.ms-excel" ? (
                        <FileSpreadsheet className="h-3 w-3" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-red-50"
                        onClick={() => {
                          const dt = new DataTransfer()
                          Array.from(files).forEach((f, i) => {
                            if (i !== index) dt.items.add(f)
                          })
                          setFiles(dt.files.length > 0 ? dt.files : null)
                        }}
                      >
                        &times;
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="ml-auto flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setFileDialogOpen(true)}
                  >
                    Edit Files
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setFiles(null)}>
                    Clear All
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything about your health concerns..."
                className="flex-1 resize-none"
                rows={3}
                onKeyDown={(e) => {
                  // Check if Enter/Return is pressed without Shift
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault() // Prevent default behavior (new line)

                    // Allow submission with just files, no text required
                    if (input.trim() || (files && files.length > 0)) {
                      handleFormSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
                    }
                  }
                  // If Shift+Enter is pressed, the default behavior (new line) will occur
                }}
              />
              <div className="flex flex-col justify-between">
                <SpeechRecognizer onTranscript={handleSpeechResult} isDisabled={isLoading} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setFileDialogOpen(true)}
                  title="Attach files"
                >
                  <Paperclip className="h-5 w-5 text-blue-600" />
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading || (!input.trim() && (!files || files.length === 0))}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>

      <FileUploadDialog
        open={fileDialogOpen}
        onOpenChange={setFileDialogOpen}
        files={files}
        setFiles={setFiles}
        maxFileSize={maxFileSize}
      />
    </main>
  )
}
