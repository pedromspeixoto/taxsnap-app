"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Send, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { getTranslations, TranslationHelper } from "@/lib/utils/get-translations"
import { isValidLocale, defaultLocale } from "@/lib/i18n"
import { toast } from "@/lib/hooks/use-toast"
import type { Locale } from "@/lib/i18n"

interface ContactPageProps {
  params: Promise<{ locale: string }>
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

export default function ContactPage({ params }: ContactPageProps) {
  const router = useRouter()
  const { user, getValidAccessToken, isAuthenticated, isLoading } = useAuth()
  const [t, setT] = useState<TranslationHelper | null>(null)
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  
  // Form state
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState("")
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Resolve params and set locale
  useEffect(() => {
    params.then(resolvedParams => {
      const validLocale = isValidLocale(resolvedParams.locale) ? resolvedParams.locale : defaultLocale
      setLocale(validLocale)
    })
  }, [params])

  // Load translations
  useEffect(() => {
    getTranslations(locale).then(messages => {
      setT(new TranslationHelper(messages))
    })
  }, [locale])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}`)
    }
  }, [isAuthenticated, isLoading, router, locale])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // Check file sizes
      const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE)
      if (oversizedFiles.length > 0) {
        toast.error(t?.t('contact.errors.fileTooLarge') || "File size exceeds 10MB limit")
        return
      }
      
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!subject.trim()) {
      toast.error(t?.t('contact.errors.subjectRequired') || "Subject is required")
      return
    }
    if (!category) {
      toast.error(t?.t('contact.errors.categoryRequired') || "Please select a category")
      return
    }
    if (!message.trim()) {
      toast.error(t?.t('contact.errors.messageRequired') || "Message is required")
      return
    }

    try {
      setIsSubmitting(true)
      const accessToken = await getValidAccessToken()

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('subject', subject)
      formData.append('category', category)
      formData.append('message', message)
      
      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Success
      toast.success(
        t?.t('contact.success.title') || "Message Sent Successfully!",
        t?.t('contact.success.description') || "Thank you for contacting us. We'll get back to you as soon as possible."
      )

      // Reset form
      setSubject("")
      setCategory("")
      setMessage("")
      setFiles([])
      
    } catch (error) {
      console.error('Error sending contact message:', error)
      toast.error(t?.t('contact.errors.sendFailed') || "Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !t) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t?.t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        showBackButton 
        backButtonHref="/dashboard" 
        backButtonText={t.t('nav.backToDashboard')} 
      />
      
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{t.t('contact.title')}</h1>
            <p className="text-muted-foreground text-lg">{t.t('contact.subtitle')}</p>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>{t.t('contact.form.subject')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">{t.t('contact.form.subject')}</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder={t.t('contact.form.subjectPlaceholder')}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">{t.t('contact.form.category')}</Label>
                  <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder={t.t('contact.form.categoryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="question">{t.t('contact.form.categories.question')}</SelectItem>
                      <SelectItem value="complaint">{t.t('contact.form.categories.complaint')}</SelectItem>
                      <SelectItem value="other">{t.t('contact.form.categories.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">{t.t('contact.form.message')}</Label>
                  <textarea
                    id="message"
                    className="w-full min-h-[150px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={t.t('contact.form.messagePlaceholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* File Attachments */}
                <div className="space-y-2">
                  <Label htmlFor="files">{t.t('contact.form.attachments')}</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t.t('contact.form.attachmentsHelper')}
                  </p>
                  
                  {/* File Input */}
                  <div className="flex items-center gap-2">
                    <input
                      id="files"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('files')?.click()}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {t.t('contact.form.chooseFiles')}
                    </Button>
                  </div>

                  {/* File List */}
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-md"
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={isSubmitting}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">{t.t('contact.form.submitting')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t.t('contact.form.submit')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

