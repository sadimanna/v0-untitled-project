// Allow streaming responses up to 30 seconds
export const maxDuration = 30

import { randomUUID } from 'crypto';

interface Message {
  role: string;
  content: string | ContentItem[];
  experimental_attachments?: Attachment[];
}

interface ContentItem {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail: string;
  };
}

interface Attachment {
  contentType?: string;
  url?: string;
  name?: string;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type");
    // Force the backend URL to use port 3002
    const backendUrl = "http://localhost:3002"

    if (contentType && contentType.includes("application/json")) {
      const body = await req.json();
      const messages = body.messages || [];
      const files = body.files || [];

      console.log("contentType:", contentType);

      console.log("API received messages:", JSON.stringify(messages, null, 2));
      console.log("Files received:", files.length);
      console.log("Sending request to backend:", backendUrl);

      // Process and prepare form data for the backend
      const backendFormData = new FormData();

      // Add messages as JSON
      const formattedMessages = messages.map((msg: Message) => {
        const attachments = msg.experimental_attachments || [];
        if (attachments.length > 0) {
          return {
            role: msg.role,
            content: [
              ...attachments.map((att: Attachment) => {
                if (att.contentType?.startsWith('image/')) {
                  return {
                    type: 'image_url',
                    image_url: {
                      url: att.url || '',
                      detail: 'high'
                    }
                  }
                }
                return null
              }).filter(Boolean),
              { type: 'text', text: msg.content as string || '' }
            ]
          }
        }
        return msg
      });

      backendFormData.append("messages", JSON.stringify(formattedMessages));

      // Add any file attachments
      if (files.length > 0) {
        for (const file of files) {
          backendFormData.append("files", file);
        }
      }

      // Call your backend server
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        body: backendFormData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        throw new Error(`Backend responded with status: ${response.status}`);
      }

      console.log("Backend response status:", response.status);
      console.log("Backend response headers:", Object.fromEntries(response.headers.entries()));

      // Forward the response from the backend
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      // Create a new ReadableStream to transform the data
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Convert the chunk to text and add to buffer
              const chunk = new TextDecoder().decode(value);
              // console.log("[API Route] Received raw chunk:", chunk);
              buffer += chunk;
              
              // Process complete messages from buffer
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  // console.log("[API Route] Processing line:", data);
                  
                  if (data === '[DONE]') {
                    console.log("[API Route] Sending DONE signal");
                    // controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  } else {
                    try {
                      const parsed = JSON.parse(data);
                      console.log("[API Route] Raw parsed data:", data);
                      console.log("[API Route] Parsed message:", parsed);
                      
                      // Format the message for the AI SDK
                      const message = {
                        id: randomUUID(),
                        role: "assistant",
                        content: parsed.content,
                        parts: parsed.parts
                      };
                      console.log("[API Route] Formatted message:", message);
                      
                      // Send the message in SSE format without the data: prefix
                      const messageStr = parsed.content; //JSON.stringify(message) + "\n\n";
                      console.log("[API Route] Final message string:", messageStr);
                      controller.enqueue(new TextEncoder().encode(messageStr));
                    } catch (e) {
                      console.error('[API Route] Error parsing chunk:', e, 'Data:', data);
                      // If parsing fails, try to forward the raw data with proper SSE format
                      const messageStr = `data: {"type":"text","text":${JSON.stringify(data)}}\n\n`;
                      console.log("[API Route] Forwarding raw data:", messageStr);
                      controller.enqueue(new TextEncoder().encode(messageStr));
                    }
                  }
                }
              }
            }
            console.log("[API Route] Stream processing complete");
            controller.close();
          } catch (error) {
            console.error('[API Route] Error processing stream:', error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else if (contentType && contentType.startsWith("multipart/form-data")) {
      const formData = await req.formData();
      const messagesJson = formData.get("messages") as string;
      const messages = messagesJson ? JSON.parse(messagesJson) : [];
      const files = formData.getAll("files") as File[];

      console.log("contentType:", contentType);

      console.log("API received messages:", JSON.stringify(messages, null, 2));
      console.log("Files received:", files.length);
      console.log("Sending request to backend:", backendUrl);

      // Process and prepare form data for the backend
      const backendFormData = new FormData();

      // Add messages as JSON
      const formattedMessages = messages.map(msg => {
        if (msg.experimental_attachments?.length > 0) {
          return {
            role: msg.role,
            content: [
              ...msg.experimental_attachments.map(att => {
                if (att.contentType?.startsWith('image/')) {
                  return {
                    type: 'image_url',
                    image_url: {
                      url: att.url,
                      detail: 'high'
                    }
                  }
                }
                return null
              }).filter(Boolean),
              { type: 'text', text: msg.content || '' }
            ]
          }
        }
        return msg
      });

      backendFormData.append("messages", JSON.stringify(formattedMessages));

      // Add any file attachments
      if (files.length > 0) {
        for (const file of files) {
          backendFormData.append("files", file);
        }
      }

      // Call your backend server
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        body: backendFormData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        throw new Error(`Backend responded with status: ${response.status}`);
      }

      // Forward the response from the backend
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      // Create a new ReadableStream to transform the data
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Convert the chunk to text and add to buffer
              const chunk = new TextDecoder().decode(value);
              // console.log("Received chunk:", chunk);
              buffer += chunk;
              
              // Process complete messages from buffer
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    console.log("[API Route] Sending DONE signal");
                    // controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  } else {
                    try {
                      const parsed = JSON.parse(data);
                      console.log("[API Route] Raw parsed data:", data);
                      console.log("[API Route] Parsed message:", parsed);
                      
                      // Format the message for the AI SDK
                      const message = {
                        id: randomUUID(),
                        role: "assistant",
                        content: parsed.content,
                        parts: parsed.parts
                      };
                      // Send the message in SSE format without the data: prefix
                      const messageStr = parsed.content; //JSON.stringify(message) + "\n\n";
                      console.log("[API Route] Final message string:", messageStr);
                      controller.enqueue(new TextEncoder().encode(messageStr));
                    } catch (e) {
                      console.error('Error parsing chunk:', e, 'Data:', data);
                      // If parsing fails, try to forward the raw data with proper SSE format
                      const messageStr = `data: {"type":"text","text":${JSON.stringify(data)}}\n\n`;
                      console.log("[API Route] Forwarding raw data:", messageStr);
                      controller.enqueue(new TextEncoder().encode(messageStr));
                    }
                  }
                }
              }
            }
            controller.close();
          } catch (error) {
            console.error('Error processing stream:', error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported Content-Type." }),
        { status: 415, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

