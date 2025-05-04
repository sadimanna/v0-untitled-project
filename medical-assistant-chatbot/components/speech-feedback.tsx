"use client"

import { useEffect, useState } from "react"
import { Mic } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SpeechFeedbackProps {
  isListening: boolean
}

export function SpeechFeedback({ isListening }: SpeechFeedbackProps) {
  const [volume, setVolume] = useState(0)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [microphone, setMicrophone] = useState<MediaStreamAudioSourceNode | null>(null)

  useEffect(() => {
    if (!isListening) {
      if (microphone) {
        microphone.disconnect()
        setMicrophone(null)
      }
      return
    }

    let animationFrame: number

    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const context = new AudioContext()
        const source = context.createMediaStreamSource(stream)
        const analyserNode = context.createAnalyser()

        analyserNode.fftSize = 256
        source.connect(analyserNode)

        setAudioContext(context)
        setAnalyser(analyserNode)
        setMicrophone(source)

        const dataArray = new Uint8Array(analyserNode.frequencyBinCount)

        const updateVolume = () => {
          if (!isListening) return

          analyserNode.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
          setVolume(average / 128) // Normalize to 0-1

          animationFrame = requestAnimationFrame(updateVolume)
        }

        updateVolume()
      } catch (error) {
        console.error("Error accessing microphone:", error)
      }
    }

    setupAudio()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }

      if (microphone) {
        microphone.disconnect()
      }

      if (audioContext && audioContext.state !== "closed") {
        audioContext.close()
      }
    }
  }, [isListening])

  if (!isListening) return null

  return (
    <Alert className="fixed bottom-24 left-1/2 transform -translate-x-1/2 w-80 bg-blue-50 border-blue-200 animate-pulse">
      <Mic className="h-4 w-4 text-blue-600" />
      <AlertTitle>Listening...</AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        <div className="flex gap-1 items-center">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-blue-600 rounded-full transition-all duration-100"
              style={{
                height: `${Math.max(4, Math.min(16, 4 + (volume * 12 * (i + 1)) / 5))}px`,
                opacity: volume > i / 5 ? 1 : 0.3,
              }}
            />
          ))}
        </div>
        <span>Speak now</span>
      </AlertDescription>
    </Alert>
  )
}
