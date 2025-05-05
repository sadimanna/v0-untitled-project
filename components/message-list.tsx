import type { Message } from "ai"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { FileText, FileSpreadsheet } from "lucide-react"
import Image from "next/image"

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-medium text-blue-800 mb-2">Welcome to MediAssist AI</h3>
        <p className="text-gray-600 max-w-md">
          I can help answer your medical questions and analyze your health documents. Upload images, PDFs, or CSV files
          to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-4">
      {messages.map((message) => {
        // Log each message to debug
        console.log("Rendering message:", message.id, message.role, message.content, message.experimental_attachments)

        // Check if this is a file-only message (content is empty or just whitespace)
        const isFileOnlyMessage = !message.content || message.content.trim() === ""
        const hasAttachments = message.experimental_attachments && message.experimental_attachments.length > 0

        return (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <Avatar className={`h-8 w-8 ${message.role === "user" ? "bg-blue-600" : "bg-green-600"}`}>
                <AvatarFallback>{message.role === "user" ? "U" : "AI"}</AvatarFallback>
              </Avatar>

              <Card
                className={`p-3 ${message.role === "user" ? "bg-blue-600 text-white" : "bg-white border-blue-100"}`}
              >
                <div className="space-y-3">
                  {/* Only show content if it's not a file-only message or if there's actual content */}
                  {(!isFileOnlyMessage || !hasAttachments) && message.content && (
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  )}

                  {hasAttachments && (
                    <div className="space-y-2">
                      {message.experimental_attachments.map((attachment, index) => {
                        console.log("Rendering attachment:", index, attachment)

                        // Handle image attachments
                        if (attachment.contentType?.startsWith("image/")) {
                          console.log("Image attachment URL:", attachment.url)
                          return (
                            <div key={index} className="mt-2">
                              <div className="relative h-48 w-full rounded-md overflow-hidden">
                                <Image
                                  src={attachment.url || "/placeholder.svg"}
                                  alt={`Attached image ${index + 1}`}
                                  fill
                                  className="object-contain"
                                  onError={(e) => {
                                    console.error("Image failed to load:", attachment.url)
                                    // Fallback to placeholder if image fails to load
                                    ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                                  }}
                                  unoptimized // Add this to bypass Next.js image optimization which might be causing issues
                                />
                              </div>
                              {attachment.name && (
                                <p
                                  className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}
                                >
                                  {attachment.name}
                                </p>
                              )}
                            </div>
                          )
                        }

                        // Handle PDF attachments
                        else if (attachment.contentType === "application/pdf") {
                          return (
                            <div
                              key={index}
                              className={`flex items-center gap-2 p-2 rounded ${
                                message.role === "user" ? "bg-blue-700" : "bg-gray-100"
                              }`}
                            >
                              <FileText
                                className={`h-5 w-5 ${message.role === "user" ? "text-white" : "text-blue-600"}`}
                              />
                              <div>
                                <p className="text-xs font-medium">{attachment.name || "PDF Document"}</p>
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-xs underline ${message.role === "user" ? "text-blue-100" : "text-blue-600"}`}
                                >
                                  View PDF
                                </a>
                              </div>
                            </div>
                          )
                        }

                        // Handle CSV attachments
                        else if (
                          attachment.contentType === "text/csv" ||
                          attachment.contentType === "application/vnd.ms-excel"
                        ) {
                          return (
                            <div
                              key={index}
                              className={`flex items-center gap-2 p-2 rounded ${
                                message.role === "user" ? "bg-blue-700" : "bg-gray-100"
                              }`}
                            >
                              <FileSpreadsheet
                                className={`h-5 w-5 ${message.role === "user" ? "text-white" : "text-green-600"}`}
                              />
                              <div>
                                <p className="text-xs font-medium">{attachment.name || "CSV File"}</p>
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-xs underline ${message.role === "user" ? "text-blue-100" : "text-blue-600"}`}
                                >
                                  View Data
                                </a>
                              </div>
                            </div>
                          )
                        }

                        // Handle other attachments
                        return (
                          <div
                            key={index}
                            className={`flex items-center gap-2 p-2 rounded ${
                              message.role === "user" ? "bg-blue-700" : "bg-gray-100"
                            }`}
                          >
                            <FileText
                              className={`h-5 w-5 ${message.role === "user" ? "text-white" : "text-gray-600"}`}
                            />
                            <p className="text-xs">{attachment.name || `Attachment ${index + 1}`}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )
      })}
    </div>
  )
}
