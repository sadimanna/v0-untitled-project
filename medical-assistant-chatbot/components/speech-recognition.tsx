"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SpeechRecognitionProps {
  onTranscript: (transcript: string) => void
  isDisabled?: boolean
}

// Define SpeechRecognition type
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function SpeechRecognizer({ onTranscript, isDisabled = false }: SpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const { toast } = useToast()

  // Check if browser supports speech recognition
  useEffect(() => {
    const supported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window
    setIsSupported(supported)

    if (!supported) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Try using Chrome, Edge, or Safari.",
        variant: "destructive",
      })
    }
  }, [toast])

  // Handle speech recognition
  const toggleListening = useCallback(() => {
    if (isDisabled) return

    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Not Available",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      })
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    let finalTranscript = ""

    recognition.onstart = () => {
      setIsListening(true)
      finalTranscript = ""
    }

    recognition.onresult = (event) => {
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      // Update with interim results for real-time feedback
      if (interimTranscript) {
        onTranscript(finalTranscript + interimTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error)
      setIsListening(false)

      if (event.error === "not-allowed") {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use voice input.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Speech Recognition Error",
          description: "An error occurred while processing your speech.",
          variant: "destructive",
        })
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      if (finalTranscript) {
        onTranscript(finalTranscript)
      }
    }

    recognition.start()
  }, [isListening, isDisabled, onTranscript, toast])

  if (!isSupported) {
    return null
  }

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      className={`h-10 w-10 ${isListening ? "animate-pulse" : ""}`}
      onClick={toggleListening}
      disabled={isDisabled}
      title={isListening ? "Stop recording" : "Start voice input"}
    >
      {isListening ? (
        <div className="relative">
          <MicOff className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </div>
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  )
}
