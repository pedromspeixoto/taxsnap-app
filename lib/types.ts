export interface UploadedFile {
  id: string
  name: string
  uploadedAt: string
}

export interface Platform {
  id: string
  name: string
  color: string
  files: UploadedFile[]
} 