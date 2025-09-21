import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText } from "lucide-react"
import FileList from "./FileList"
import { UploadedFile } from "@/lib/types/submission"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import { useState, useEffect } from "react"

interface IrsFileUploadProps {
  files: UploadedFile[]
  onFileUpload: (file: File) => void
  onFileRemove: (fileId: string) => void
  variant?: "card" | "inline"
  size?: "default" | "large"
  singleFile?: boolean
  optional?: boolean
}

export default function IrsFileUpload({ 
  files, 
  onFileUpload, 
  onFileRemove,
  variant = "card",
  size = "default",
  singleFile = false,
  optional = false
}: IrsFileUploadProps) {
  const { currentLocale } = useLocalizedNavigation()
  const [t, setT] = useState<TranslationHelper | null>(null)

  // Load translations
  useEffect(() => {
    getTranslations(currentLocale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [currentLocale])
  const handleUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf,.csv,.xlsx,.xls"
    input.multiple = !singleFile
    input.onchange = (e) => {
      const uploadedFiles = Array.from((e.target as HTMLInputElement).files || [])
      if (singleFile && uploadedFiles.length > 0) {
        // If single file mode and we already have a file, remove it first
        if (files.length > 0) {
          onFileRemove(files[0].id)
        }
        onFileUpload(uploadedFiles[0])
      } else {
        uploadedFiles.forEach((file) => onFileUpload(file))
      }
    }
    input.click()
  }

  const content = (
    <div className="space-y-4">
      <FileList 
        files={files}
        onRemove={onFileRemove}
        title={singleFile ? (t?.t('components.irsUpload.irsFiles') || "Uploaded IRS File") : (t?.t('components.irsUpload.irsFiles') || "Uploaded IRS Files")}
        maxHeight={size === "large" ? "max-h-60" : "max-h-40"}
        showCount={!singleFile}
      />

      <Button
        className={`w-full group/upload transition-all duration-200 hover:shadow-md ${
          size === "large" ? "h-16 text-lg" : "h-12"
        }`}
        variant={files.length > 0 ? "outline" : "default"}
        onClick={handleUpload}
      >
        <Upload className={`mr-2 group-hover/upload:scale-110 transition-transform ${
          size === "large" ? "w-5 h-5 mr-3" : "w-4 h-4"
        }`} />
        {singleFile 
          ? (files.length > 0 ? (t?.t('components.irsUpload.uploadFiles') || "Replace IRS File") : (t?.t('components.irsUpload.uploadFiles') || "Upload IRS File"))
          : (files.length > 0 ? (t?.t('components.irsUpload.uploadFiles') || "Add More IRS Files") : (t?.t('components.irsUpload.uploadFiles') || "Upload IRS Files"))
        }
      </Button>
      
      <p className={`text-muted-foreground text-center ${
        size === "large" ? "text-sm" : "text-xs"
      }`}>
        {t?.t('components.irsUpload.supportedFormats') || 'Supports PDF, CSV, and Excel files (.pdf, .csv, .xlsx, .xls)'}{size === "large" && ". These will be validated automatically."}
        {singleFile && " (Only one file allowed)"}
      </p>
    </div>
  )

  if (variant === "inline") {
    return content
  }

  return (
    <Card className={`shadow-sm border-l-4 ${optional ? "border-l-blue-500" : "border-l-red-500"}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className={`w-5 h-5 ${optional ? "text-blue-600" : "text-red-600"}`} />
          {t?.t('components.irsUpload.irsFiles') || 'IRS Files'}{optional ? (t?.t('components.irsUpload.optional') || ' (Optional)') : " (Required)"}
        </CardTitle>
        <CardDescription>
          {optional 
            ? (t?.t('components.irsUpload.dragDropUpload') || "Drag and drop your IRS files here or click to upload")
            : (t?.t('components.irsUpload.dragDropUpload') || "Drag and drop your IRS files here or click to upload")
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
} 