import type { Message } from "ai";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { FileText, FileSpreadsheet } from "lucide-react";
import Image from "next/image";

interface MessageListProps {
  messages: Message[];
}

interface Attachment {
  contentType?: string;
  url?: string;
  name?: string;
}

const AttachmentComponent = ({ attachment }: { attachment: Attachment }) => {
  if (attachment.contentType.startsWith("image/")) {
    // console.log("############# Got Image #############", attachment.url)
    return (
      // <div className="relative h-48 w-full rounded-md overflow-hidden">
      //   <Image
      //     src={attachment.url || "/placeholder.svg"}
      //     alt={`Attached image`}
      //     fill
      //     className="object-contain"
      //     onError={(e) => {
      //       console.error("Image failed to load:", attachment.url);
      //       // Fallback to placeholder if image fails to load
      //       (e.target as HTMLImageElement).src = "/placeholder.svg";
      //     }}
      //     unoptimized // Add this to bypass Next.js image optimization which might be causing issues
      //   />
      // </div>
      <div className="relative h-full w-48 rounded-md overflow-hidden">
        <img src={attachment.url || "/placeholder.svg"} alt="Image" className="object-contain" />
      </div>
    );
  } else if (attachment.contentType === "application/pdf") {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-gray-100">
        <FileText className="h-5 w-5 text-blue-600" />
        <div>
          <p className="text-xs font-medium">{attachment.name || "PDF Document"}</p>
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline text-blue-600"
          >
            View PDF
          </a>
        </div>
      </div>
    );
  } else if (
    attachment.contentType === "text/csv" ||
    attachment.contentType === "application/vnd.ms-excel"
  ) {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-gray-100">
        <FileSpreadsheet className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-xs font-medium">{attachment.name || "CSV File"}</p>
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline text-blue-600"
          >
            View Data
          </a>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-gray-100">
        <FileText className="h-5 w-5 text-gray-600" />
        <p className="text-xs">{attachment.name || `Attachment`}</p>
      </div>
    );
  }
};

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
    );
  }

  return (
    <div className="space-y-4 py-4">
      {messages.map((message) => {
        // Log each message to debug
        console.log("Rendering message:", message.id, message.role, message.content, message.experimental_attachments);

        // Check if this is a file-only message (content is empty or just whitespace)
        const isFileOnlyMessage = !message.content || message.content.trim() === "";
        const hasAttachments = message.experimental_attachments && message.experimental_attachments.length > 0;

        return (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <Avatar
                className={`h-8 w-8 ${message.role === "user" ? "bg-blue-600" : "bg-green-600"}`}
              >
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
                      {message.experimental_attachments.map((attachment, index) => (
                        <AttachmentComponent key={index} attachment={attachment} />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
}
