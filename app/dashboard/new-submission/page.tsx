"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { ArrowLeft, Upload, Plus, X, FileText } from "lucide-react"
import Link from "next/link"

interface UploadedFile {
  id: string
  name: string
  uploadedAt: string
}

interface Platform {
  id: string
  name: string
  color: string
  files: UploadedFile[]
}

const AVAILABLE_BROKERS = [
  { name: "DEGIRO", color: "bg-emerald-200" },
  { name: "Interactive Brokers", color: "bg-purple-200" },
  { name: "Trading 212", color: "bg-blue-200" },
  { name: "Revolut", color: "bg-pink-200" },
  { name: "TradeRepublic", color: "bg-yellow-200" },
  { name: "eToro", color: "bg-indigo-200" },
  { name: "Saxo Bank", color: "bg-green-200" },
  { name: "Charles Schwab", color: "bg-rose-200" },
  { name: "Fidelity", color: "bg-cyan-200" },
  { name: "TD Ameritrade", color: "bg-violet-200" },
  { name: "E*TRADE", color: "bg-lime-200" },
  { name: "Robinhood", color: "bg-orange-200" },
  { name: "Webull", color: "bg-teal-200" },
  { name: "Questrade", color: "bg-amber-200" },
  { name: "XTB", color: "bg-slate-200" },
]

export default function NewSubmission() {
  const router = useRouter()
  const [submissionName, setSubmissionName] = useState("")
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: "1", name: "DEGIRO", color: "bg-emerald-200", files: [] },
    { id: "2", name: "Interactive Brokers", color: "bg-purple-200", files: [] },
    { id: "3", name: "Trading 212", color: "bg-blue-200", files: [] },
  ])
  const [selectedBroker, setSelectedBroker] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)

  const addPlatform = () => {
    if (selectedBroker) {
      const brokerInfo = AVAILABLE_BROKERS.find((b) => b.name === selectedBroker)
      if (brokerInfo && !platforms.find((p) => p.name === selectedBroker)) {
        const newPlatform: Platform = {
          id: Date.now().toString(),
          name: selectedBroker,
          color: brokerInfo.color,
          files: [],
        }
        setPlatforms([...platforms, newPlatform])
        setSelectedBroker("")
        setShowAddForm(false)
      }
    }
  }

  const removePlatform = (platformId: string) => {
    setPlatforms(platforms.filter((p) => p.id !== platformId))
  }

  const handleFileUpload = (platformId: string, file: File) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      uploadedAt: new Date().toLocaleString(),
    }

    setPlatforms((prev) => prev.map((p) => (p.id === platformId ? { ...p, files: [...p.files, newFile] } : p)))
  }

  const removeFile = (platformId: string, fileId: string) => {
    setPlatforms((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, files: p.files.filter((f) => f.id !== fileId) } : p)),
    )
  }

  const handleProcess = () => {
    const platformsWithFiles = platforms.filter((p) => p.files.length > 0)
    if (platformsWithFiles.length === 0) {
      alert("Please upload at least one trade file")
      return
    }

    // Simulate processing
    router.push("/dashboard/submission/preview")
  }

  const getAvailableBrokers = () => {
    const usedBrokers = platforms.map((p) => p.name)
    return AVAILABLE_BROKERS.filter((broker) => !usedBrokers.includes(broker.name))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold">Taxsnap</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">New Tax Submission</h1>
          <p className="text-muted-foreground">Upload your trade files from different platforms</p>
        </div>

        {/* Submission Name */}
        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
            <CardDescription>Give your submission a name for easy identification</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Submission Name</Label>
              <Input
                id="name"
                placeholder="e.g., 2024 Tax Year, Q1 2024 Amendment"
                value={submissionName}
                onChange={(e) => setSubmissionName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Platform Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Investment Platforms</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload trade files from your investment platforms
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {platforms.map((platform) => (
              <Card key={platform.id} className="group relative overflow-hidden border-2 border-border/50 hover:border-primary/20 transition-all duration-300 p-0">
                <CardHeader className={`${platform.color} text-gray-900 relative p-4 m-0 rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold truncate pr-2">{platform.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-60 hover:opacity-100 hover:bg-white/30 transition-all duration-200 shrink-0"
                      onClick={() => removePlatform(platform.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {platform.files.length > 0 && (
                    <Badge variant="secondary" className="absolute -bottom-2 right-3 bg-primary text-primary-foreground shadow-sm">
                      <FileText className="w-3 h-3 mr-1" />
                      {platform.files.length} file{platform.files.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </CardHeader>
                
                <CardContent className="p-4 space-y-4">
                  {/* Uploaded Files List */}
                  {platform.files.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Uploaded Files
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {platform.files.map((file) => (
                          <div key={file.id} className="group/file flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors border border-border/30">
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.uploadedAt}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover/file:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => removeFile(platform.id, file.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <Button
                    className="w-full h-12 group/upload transition-all duration-200 hover:shadow-md"
                    variant={platform.files.length > 0 ? "outline" : "default"}
                    onClick={() => {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.accept = ".csv,.xlsx,.xls"
                      input.multiple = true
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || [])
                        files.forEach((file) => handleFileUpload(platform.id, file))
                      }
                      input.click()
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2 group-hover/upload:scale-110 transition-transform" />
                    {platform.files.length > 0 ? "Add More Files" : "Upload Trade Files"}
                  </Button>
                  
                  {/* Helper text */}
                  <p className="text-xs text-muted-foreground text-center">
                    Supports CSV, XLSX, and XLS files
                  </p>
                </CardContent>
              </Card>
            ))}
            
            {/* Add new platform card when no add form is shown */}
            {!showAddForm && getAvailableBrokers().length > 0 && (
              <Card 
                className="group border-2 border-dashed border-border hover:border-primary/40 transition-all duration-300 cursor-pointer bg-muted/20 hover:bg-muted/40"
                onClick={() => setShowAddForm(true)}
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium text-foreground">Add New Platform</p>
                    <p className="text-sm text-muted-foreground">
                      {getAvailableBrokers().length} broker{getAvailableBrokers().length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {showAddForm && (
            <Card className="mt-6 shadow-lg border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Add New Investment Platform
                </CardTitle>
                <CardDescription>
                  Choose from {getAvailableBrokers().length} available broker{getAvailableBrokers().length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="broker-select" className="text-sm font-medium">
                    Select Broker
                  </Label>
                  <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                    <SelectTrigger id="broker-select" className="h-12 bg-background">
                      <SelectValue placeholder="Choose a broker platform..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableBrokers().map((broker) => (
                        <SelectItem key={broker.name} value={broker.name} className="py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${broker.color}`}></div>
                            {broker.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={addPlatform} 
                    disabled={!selectedBroker}
                    className="flex-1 h-11 font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Platform
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    className="h-11 px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
        </div>

        {/* Process Button */}
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            className="px-16 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            onClick={handleProcess}
            disabled={!platforms.some((p) => p.files.length > 0) || !submissionName}
          >
            <FileText className="w-5 h-5 mr-3" />
            Process Submissions
          </Button>
        </div>
      </div>
    </div>
  )
}
