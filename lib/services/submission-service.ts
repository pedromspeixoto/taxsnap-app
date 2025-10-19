import { processorClient } from '../processor/client';
import { BrokerResponse, Broker, CalculateTaxesRequest, CalculateTaxesResponse } from '../types/broker';
import { submissionRepository } from '../repositories/submission-repository';
import { CreateSubmissionRequest, Submission, SubmissionResponse, Platform, UploadedFile, SubmissionStatus } from '../types/submission';
import { prisma } from '../repositories/prisma';

export interface SubmissionService {
  // Broker management
  getBrokers(): Promise<BrokerResponse>;
  getManualLogTemplate(): Promise<{ message: string; template_path: string }>;
  // File management
  uploadBrokerFiles(submissionId: string, broker: string, files: File[]): Promise<void>;
  deleteSubmissionFile(fileId: string): Promise<void>;
  // Submission management
  createSubmission(submission: CreateSubmissionRequest): Promise<SubmissionResponse>;
  getSubmission(id: string): Promise<SubmissionResponse | null>;
  getSubmissions(userId: string): Promise<SubmissionResponse[]>;
  updateSubmission(id: string, data: { title?: string }): Promise<SubmissionResponse>;
  updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<void>;
  storeSubmissionResults(submissionId: string, results: Record<string, unknown>): Promise<void>;
  getSubmissionResults(submissionId: string): Promise<Record<string, unknown> | null>;
  // Tax calculation
  calculateTaxes(request: CalculateTaxesRequest): Promise<CalculateTaxesResponse>;
}

export class SubmissionServiceImpl implements SubmissionService {
  constructor(
    private client = processorClient,
    private repository = submissionRepository
  ) {}

  async getBrokers(): Promise<BrokerResponse> {
    try {
      const response = await this.client.getBrokers();

      // Filter out 'not_applicable' and transform the supported_brokers array to Broker objects
      const brokers: Broker[] = response.supported_brokers
        .filter((brokerCode: string) => brokerCode !== 'not_applicable')
        .map((brokerCode: string) => ({
          id: brokerCode,
          name: this.formatBrokerName(brokerCode)
        }));

      return { brokers };
    } catch (error) {
      console.error('[SERVICE] submissionService.getBrokers', error);
      throw error;
    }
  }

  async getManualLogTemplate(): Promise<{ message: string; template_path: string }> {
    try {
      const response = await this.client.getManualLogTemplate();
      return response;
    } catch (error) {
      console.error('[SERVICE] submissionService.getManualLogTemplate', error);
      throw error;
    }
  }

  async uploadBrokerFiles(submissionId: string, broker: string, files: File[]): Promise<void> {
    try {
      // First, upload files to the external processor API
      const response = await this.client.uploadBrokerFiles({
        user_id: submissionId,
        broker_id: broker,
        files: files,
      });

      console.log('response', response);
      const fileRecords: {
        submissionId: string;
        brokerName: string;
        fileType: string;
        filePath: string;
      }[] = [];
      const errors: string[] = [];

      // Loop response (there might be files that were skipped)
      response.forEach(file => {
        if (file.error_message === undefined || file.error_message === '' || file.error_message === null || file.error_message === 'None' || file.error_message === 'none') {
          fileRecords.push({
            submissionId,
            brokerName: broker,
            fileType: file.document_type,
            filePath: file.filepath,
          });
        } else {
          // Collect error messages from skipped files
          errors.push(`${file.document_name}: ${file.error_message}`);
        }
      });

      // If there are errors, throw them
      if (errors.length > 0) {
        const errorMessage = errors.join('\n');
        throw new Error(errorMessage);
      }

      // Only if the processor API call succeeds, save file metadata to our database
      if (fileRecords.length > 0) {
        await prisma.submissionFile.createMany({
          data: fileRecords,
        });
      }

    } catch (error) {
      console.error('[SERVICE] submissionService.uploadBrokerFiles', error);
      throw error;
    }
  }

  async deleteSubmissionFile(fileId: string): Promise<void> {
    try {
      // Delete file from our database
      const file = await prisma.submissionFile.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        throw new Error('File not found');
      }

      // Delete file from external processor API
      await this.client.deleteSubmissionFile(file.submissionId, file.brokerName, file.fileType, file.filePath);

      await prisma.submissionFile.delete({
        where: { id: fileId }
      });
    } catch (error) {
      console.error('[SERVICE] submissionService.deleteSubmissionFile', error);
      throw error;
    }
  }

  async deleteAllSubmissionFiles(submissionId: string, brokerId: string): Promise<void> {
    try {
      await this.client.deleteAllSubmissionFiles(submissionId, brokerId);

      // Delete files from our database
      await prisma.submissionFile.deleteMany({
        where: { submissionId, brokerName: brokerId }
      });
    } catch (error) {
      console.error('[SERVICE] submissionService.deleteAllSubmissionFiles', error);
      throw error;
    }
  }

  async calculateTaxes(request: CalculateTaxesRequest): Promise<CalculateTaxesResponse> {
    await this.repository.updateStatus(request.user_id, SubmissionStatus.PROCESSING);
    try {
      const result = await this.client.calculateTaxes(request);
      await this.storeSubmissionResults(request.user_id, result);
      if (result.status === 'error' || result.status === 'failed') {
        // Keep status as processing
        console.error('[SERVICE] submissionService.calculateTaxes', result.error_message);
        // TODO: send email to backoffice with error message
      } else {
        await this.repository.updateStatus(request.user_id, SubmissionStatus.COMPLETE);
      }
      return result;
    } catch (error) {
      console.error('[SERVICE] submissionService.calculateTaxes', error);
      throw error;
    }
  }

  async createSubmission(submission: CreateSubmissionRequest): Promise<SubmissionResponse> {
    const result = await this.repository.create({
      ...submission,
    });
    
    // Map Submission to SubmissionResponse
    return this.mapToResponse(result);
  }

  async getSubmission(id: string): Promise<SubmissionResponse | null> {
    const result = await this.repository.getById(id);
    
    if (!result) {
      return null;
    }
    
    // Map Submission to SubmissionResponse
    return this.mapToResponse(result);
  }

  async getSubmissions(userId: string): Promise<SubmissionResponse[]> {
    const results = await this.repository.getByUserId(userId);
    
    // Map each submission to SubmissionResponse
    return results.map(submission => this.mapToResponse(submission));
  }

  async updateSubmission(id: string, data: { title?: string }): Promise<SubmissionResponse> {
    const result = await this.repository.update(id, data);
    
    // Map Submission to SubmissionResponse
    return this.mapToResponse(result);
  }

  async updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<void> {
    await this.repository.updateStatus(id, status);
  }

  async storeSubmissionResults(submissionId: string, results: Record<string, unknown>): Promise<void> {
    try {
      await prisma.submissionResult.create({
        data: {
          submissionId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          results: results as any, // Prisma Json type requires any
        },
      });
    } catch (error) {
      console.error('[SERVICE] submissionService.storeSubmissionResults', error);
      throw error;
    }
  }

  async getSubmissionResults(submissionId: string): Promise<Record<string, unknown> | null> {
    try {
      const result = await prisma.submissionResult.findFirst({
        where: { submissionId },
      });
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return result?.results as any || null;
    } catch (error) {
      console.error('[SERVICE] submissionService.getSubmissionResults', error);
      throw error;
    }
  }

  private mapToResponse(submission: Submission & { files?: Array<{id: string, brokerName: string, filePath: string, createdAt: Date}> }): SubmissionResponse {
    // Group files by broker to create platforms
    const platforms: Platform[] = [];
    if (submission.files) {
      const brokerGroups = submission.files.reduce((groups: Record<string, Array<{id: string, brokerName: string, filePath: string, createdAt: Date}>>, file) => {
        if (!groups[file.brokerName]) {
          groups[file.brokerName] = [];
        }
        groups[file.brokerName].push(file);
        return groups;
      }, {} as Record<string, Array<{id: string, brokerName: string, filePath: string, createdAt: Date}>>);

      // Convert broker groups to platforms
      Object.entries(brokerGroups).forEach(([brokerName, files]) => {
        const brokerNameToCode: Record<string, string> = {
          'degiro': 'degiro',
          't212': 't212', 
          'manual_log': 'manual_log'
        };

        const displayNames: Record<string, string> = {
          'degiro': 'DEGIRO',
          't212': 'Trading 212',
          'manual_log': 'Manual Log'
        };

        const colors: Record<string, string> = {
          'degiro': 'bg-emerald-200',
          't212': 'bg-blue-200',
          'manual_log': 'bg-purple-200'
        };

        const uploadedFiles: UploadedFile[] = files.map((file) => ({
          id: file.id,
          name: file.filePath.split('/').pop() || file.filePath, // Extract filename from path
          uploadedAt: new Date(file.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
        }));

        platforms.push({
          id: brokerNameToCode[brokerName] || brokerName,
          name: displayNames[brokerName] || brokerName,
          color: colors[brokerName] || 'bg-gray-200',
          files: uploadedFiles
        });
      });
    }

    return {
      id: submission.id,
      userId: submission.userId,
      status: submission.status,
      tier: submission.tier,
      title: submission.title,
      baseIrsPath: submission.baseIrsPath,
      submissionType: submission.submissionType,
      fiscalNumber: submission.fiscalNumber,
      year: submission.year,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      platforms
    };
  }

  private formatBrokerName(brokerCode: string): string {
    // Convert broker codes to human-readable names
    const brokerNames: Record<string, string> = {
      'degiro': 'DEGIRO',
      't212': 'Trading 212',
      'manual_log': 'Manual Log'
    };

    return brokerNames[brokerCode] || brokerCode.charAt(0).toUpperCase() + brokerCode.slice(1);
  }
}

// Export instance for use in API routes
export const submissionService = new SubmissionServiceImpl();
