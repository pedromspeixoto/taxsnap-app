import { Button } from "@/components/ui/button"
import { FileText, X } from "lucide-react"
import { UploadedFile } from "@/lib/types/submission"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import { useState, useEffect } from "react"

interface FileListProps {
  files: UploadedFile[]
  onRemove: (fileId: string) => void
  title?: string
  maxHeight?: string
  showCount?: boolean
}

export default function FileList({ 
  files, 
  onRemove, 
  title,
  maxHeight = "max-h-40",
  showCount = false
}: FileListProps) {
  const { currentLocale } = useLocalizedNavigation()
  const [t, setT] = useState<TranslationHelper | null>(null)

  // Load translations
  useEffect(() => {
    getTranslations(currentLocale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [currentLocale])

  const displayTitle = title || t?.t('components.fileList.uploadedFiles') || 'Uploaded Files'
  if (files.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <FileText className="w-4 h-4" />
        {displayTitle} {showCount && `(${files.length})`}
      </p>
      <div className={`space-y-2 ${maxHeight} overflow-y-auto pr-1`}>
        {files.map((file) => (
          <div key={file.id} className="group/file flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors border border-border/30">
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.uploadedAt}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 group-hover/file:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onRemove(file.id)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 