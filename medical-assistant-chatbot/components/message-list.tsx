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

  // Debug: Log the messages to see what's coming in
  console.log("Rendering messages:", messages)

  return (
    <div className="space-y-4 py-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <Avatar className={`h-8 w-8 ${message.role === "user" ? "bg-blue-600" : "bg-green-600"}`}>
              <AvatarFallback>{message.role === "user" ? "U" : "AI"}</AvatarFallback>
            </Avatar>

            <Card className={`p-3 ${message.role === "user" ? "bg-blue-600 text-white" : "bg-white border-blue-100"}`}>
              <div className="space-y-3">
                {message.content && <div className="whitespace-pre-wrap text-sm">{message.content}</div>}

                {/* Debug: Log attachments to see if they exist */}
                {message.experimental_attachments &&
                  console.log("Message attachments:", message.experimental_attachments)}

                {message.experimental_attachments?.map((attachment, index) => {
                  console.log("Rendering attachment:", attachment)

                  // Handle image attachments
                  if (attachment.contentType?.startsWith("image/")) {
                    return (
                      <div key={index} className="mt-2">
                        <div className="relative h-48 w-full rounded-md overflow-hidden">
                          <Image
                            src={attachment.url || "/placeholder.svg"}
                            alt={`Attached image ${index + 1}`}
                            fill
                            className="object-contain"
                          />
                        </div>
                        {attachment.name && <p className="text-xs mt-1 opacity-70">{attachment.name}</p>}
                      </div>
                    )
                  }

                  // Handle PDF attachments
                  else if (attachment.contentType === "application/pdf") {
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 bg-opacity-10 bg-black rounded">
                        <FileText className="h-5 w-5" />
                        <div>
                          <p className="text-xs font-medium">{attachment.name || "PDF Document"}</p>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline"
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
                      <div key={index} className="flex items-center gap-2 p-2 bg-opacity-10 bg-black rounded">
                        <FileSpreadsheet className="h-5 w-5" />
                        <div>
                          <p className="text-xs font-medium">{attachment.name || "CSV File"}</p>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline"
                          >
                            View Data
                          </a>
                        </div>
                      </div>
                    )
                  }

                  // Handle other attachments
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-opacity-10 bg-black rounded">
                      <FileText className="h-5 w-5" />
                      <p className="text-xs">{attachment.name || `Attachment ${index + 1}`}</p>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      ))}
    </div>
  )
}
