"use client"

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileUploader } from "./file-uploader"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  files: FileList | null
  setFiles: (files: FileList | null) => void
  onUpload?: (files: FileList) => void
}


export function FileUploadDialog({ open, onOpenChange, files, setFiles, onUpload }: FileUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null);

  // Function to handle the upload process
  const handleUpload = async () => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      if (onUpload) {
        await onUpload(files);
      } else {
        // Simulate upload progress
        const totalFiles = files.length;
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const newProgress = prev + Math.random() * 15;
            if (newProgress >= 100) {
              clearInterval(progressInterval);

              // Simulate completion delay
              setTimeout(() => {
                setIsUploading(false);
                onOpenChange(false); // Close dialog when complete
              }, 500);

              return 100;
            }
            return newProgress;
          });
        }, 300);
      }
    } catch (error: any) {
      setError(error.message);
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    // Add logic to cancel ongoing upload processes
    setIsUploading(false);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        // Prevent closing dialog during upload
        if (isUploading && !newOpen) return
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <FileUploader files={files} setFiles={setFiles} fileInputRef={fileInputRef} />
        </div>

        {isUploading && (
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-600 font-medium">Uploading files...</span>
              <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!files || files.length === 0 || isUploading}
            className="min-w-[80px]"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading</span>
              </div>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
