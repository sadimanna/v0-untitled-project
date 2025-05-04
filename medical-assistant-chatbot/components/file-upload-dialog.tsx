"use client"

import { useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileUploader } from "./file-uploader"
import { Button } from "@/components/ui/button"

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  files: FileList | null
  setFiles: (files: FileList | null) => void
  onUpload?: (files: FileList) => void // Made optional since we're changing behavior
}

export function FileUploadDialog({ open, onOpenChange, files, setFiles, onUpload }: FileUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <FileUploader files={files} setFiles={setFiles} fileInputRef={fileInputRef} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              // Just close the dialog and keep the files attached
              onOpenChange(false)
            }}
            disabled={!files || files.length === 0}
          >
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
