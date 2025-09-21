import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Download, X } from "lucide-react"
import { UploadedFile } from "@/lib/types/submission"
import FileList from "./FileList"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { useLocalizedNavigation } from "@/lib/utils/locale-navigation"
import { useState, useEffect } from "react"

interface ManualTransactionsProps {
  files: UploadedFile[]
  onFileUpload: (file: File) => void
  onFileRemove: (fileId: string) => void
  variant?: "card" | "inline"
  size?: "default" | "large"
  showSkipOption?: boolean
  onSkip?: () => void
}

export default function ManualTransactions({
  files,
  onFileUpload,
  onFileRemove,
  variant = "card",
  size = "default",
  showSkipOption = false,
  onSkip
}: ManualTransactionsProps) {
  const { currentLocale } = useLocalizedNavigation()
  const [t, setT] = useState<TranslationHelper | null>(null)

  // Load translations
  useEffect(() => {
    getTranslations(currentLocale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [currentLocale])
  const downloadTemplate = () => {
    const csvContent = `Date,Symbol,Quantity,Price,Transaction Type,Fees,Exchange
2024-01-15,AAPL,10,150.50,BUY,1.00,NASDAQ
2024-02-20,GOOGL,5,2500.00,BUY,2.50,NASDAQ
2024-03-10,AAPL,5,160.00,SELL,1.00,NASDAQ`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'manual_transactions_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv"
    input.multiple = true
    input.onchange = (e) => {
      const uploadedFiles = Array.from((e.target as HTMLInputElement).files || [])
      uploadedFiles.forEach((file) => onFileUpload(file))
    }
    input.click()
  }

  const content = (
    <div className={`space-y-${size === "large" ? "6" : "4"}`}>
      {/* Template Download */}
      <div className={`flex items-center justify-between ${
        size === "large" ? "p-6" : "p-4"
      } bg-blue-50 border border-blue-200 rounded-lg`}>
        <div className="flex-1">
          <p className={`font-semibold text-blue-900 ${
            size === "large" ? "text-lg mb-1" : "text-sm"
          }`}>
            {t?.t('manualTransactions.downloadCsvTemplate') || 'Download CSV Template'}
          </p>
          <p className="text-sm text-blue-700">
            {size === "large" 
              ? (t?.t('manualTransactions.getCsvTemplateForManual') || 'Get the CSV template with the required format for manual transactions')
              : (t?.t('manualTransactions.getCsvTemplate') || 'Get the CSV template with the required format')
            }
          </p>
          {size === "large" && (
            <div className="mt-3 text-xs text-blue-600">
              <p><strong>{t?.t('manualTransactions.requiredColumns') || 'Required columns: Date, Symbol, Quantity, Price, Transaction Type, Fees, Exchange'}</strong></p>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          size={size === "large" ? "lg" : "sm"} 
          onClick={downloadTemplate}
          className={size === "large" ? "ml-4" : ""}
        >
          <Download className={`mr-2 ${size === "large" ? "w-5 h-5" : "w-4 h-4"}`} />
          {t?.t('manualTransactions.template') || 'Template'}
        </Button>
      </div>

      {/* Enhanced File List for Large Size */}
      {size === "large" && files.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              {t?.t('manualTransactions.manualTransactionFilesCount')?.replace('{{count}}', files.length.toString()) || `Manual Transaction Files (${files.length})`}
            </h3>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {files.map((file) => (
              <div key={file.id} className="group/file flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors border border-border/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{t?.t('manualTransactions.uploadedAt')?.replace('{{date}}', file.uploadedAt) || `Uploaded ${file.uploadedAt}`}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover/file:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onFileRemove(file.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <FileList 
          files={files}
          onRemove={onFileRemove}
          title={t?.t('manualTransactions.manualTransactionFiles') || "Manual Transaction Files"}
          maxHeight="max-h-40"
        />
      )}

      {/* Upload Section */}
      <div className="space-y-4">
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
          {files.length > 0 ? (t?.t('manualTransactions.addMoreManualFiles') || "Add More Manual Files") : (t?.t('manualTransactions.uploadManualTransactionFiles') || "Upload Manual Transaction Files")}
        </Button>
        
        <div className="text-center space-y-2">
          <p className={`text-muted-foreground ${
            size === "large" ? "text-sm" : "text-xs"
          }`}>
            {t?.t('manualTransactions.csvFilesSupported') || 'Only CSV files supported - Use the template above for correct format'}
          </p>
          {size === "large" && (
            <p className="text-xs text-muted-foreground italic">
              {t?.t('manualTransactions.optionalStep') || 'This step is optional. Manual transactions can supplement data from your brokers.'}
            </p>
          )}
        </div>
      </div>

      {/* Skip Option */}
      {showSkipOption && onSkip && (
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={onSkip} 
            className="text-muted-foreground hover:text-foreground"
          >
            {t?.t('manualTransactions.skipManualTransactions') || 'Skip manual transactions and proceed to processing'}
          </Button>
        </div>
      )}
    </div>
  )

  if (variant === "inline") {
    return content
  }

  return (
    <Card className={`shadow-sm border-l-4 border-l-blue-500 ${
      size === "large" ? "max-w-4xl mx-auto" : ""
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          {t?.t('manualTransactions.manualTransactionsOptional') || 'Manual Transactions (Optional)'}
        </CardTitle>
        <CardDescription>
          {size === "large" 
            ? (t?.t('manualTransactions.uploadManualTransactionsDescriptionLong') || 'Upload manual transaction files using our template format, or download the template to get started. This step is optional - you can skip it if you don\'t have manual transactions to add.')
            : (t?.t('manualTransactions.uploadManualTransactionsDescription') || 'Upload manual transaction files using our template format, or download the template to get started.')
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
} 