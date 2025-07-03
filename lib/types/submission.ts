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
  
export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED'
}

export interface Submission {
  id: string
  userId: string
  status: SubmissionStatus
  title: string
  baseIrsPath?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateSubmissionRequest {
  userId: string
  title: string
  baseIrsPath?: string
}

export interface UpdateSubmissionRequest {
  title?: string
  status?: SubmissionStatus
  baseIrsPath?: string
}

export interface SubmissionFile {
  id: string
  brokerName: string
  fileType: string
  filePath: string
  createdAt: Date
}

export interface SubmissionResponse {
  id: string
  userId?: string
  status: SubmissionStatus
  title: string
  baseIrsPath?: string
  createdAt: Date
  updatedAt: Date
  files?: SubmissionFile[]
  platforms?: Platform[]
}

export interface SubmissionUpdate {
  title?: string
  status?: SubmissionStatus
  baseIrsPath?: string
  updatedAt?: Date
}

export interface GetSubmissionsQuery {
  userId?: string
  status?: SubmissionStatus
  limit?: number
  offset?: number
}