"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, ImageIcon, FileSpreadsheet, Upload, X } from "lucide-react"
import Image from "next/image"

interface FileUploaderProps {
  files: FileList | null
  setFiles: (files: FileList | null) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}

export function FileUploader({ files, setFiles, fileInputRef }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files)
    }
  }

  const handleRemoveFile = (index: number) => {
    if (!files) return

    const dt = new DataTransfer()
    for (let i = 0; i < files.length; i++) {
      if (i !== index) {
        dt.items.add(files[i])
      }
    }
    setFiles(dt.files.length > 0 ? dt.files : null)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-6 w-6 text-blue-600" />
    } else if (fileType === "application/pdf") {
      return <FileText className="h-6 w-6 text-red-600" />
    } else if (fileType === "text/csv" || fileType === "application/vnd.ms-excel") {
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />
    } else {
      return <FileText className="h-6 w-6 text-gray-600" />
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 text-blue-600 mx-auto mb-2" />
        <h3 className="text-lg font-medium mb-1">Select Files</h3>
        <p className="text-sm text-gray-500 mb-4">Drag and drop files here or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          accept="image/*,.pdf,.csv"
          className="hidden"
          id="file-upload"
        />
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
          Select Files
        </Button>
        <p className="text-xs text-gray-500 mt-2">Supported formats: Images, PDFs, and CSV files</p>
      </div>

      {files && files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Selected Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Array.from(files).map((file, index) => (
              <Card key={index} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  {file.type.startsWith("image/") ? (
                    <div className="h-10 w-10 relative rounded overflow-hidden">
                      <Image
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={file.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    getFileIcon(file.type)
                  )}
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
