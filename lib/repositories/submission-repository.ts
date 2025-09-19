import { prisma } from './prisma';
import type { Submission as PrismaSubmission, SubmissionFile } from '../generated/prisma';
import { 
  Submission, 
  CreateSubmissionRequest, 
  UpdateSubmissionRequest,
  SubmissionUpdate,
  GetSubmissionsQuery,
  SubmissionStatus,
  SubmissionTier
} from '../types/submission';

type PrismaSubmissionWithFiles = PrismaSubmission & {
  files?: SubmissionFile[];
};

export interface SubmissionRepository {
  create(data: CreateSubmissionRequest): Promise<Submission>;
  getById(id: string): Promise<(Submission & { files?: SubmissionFile[] }) | null>;
  getByUserId(userId: string): Promise<Submission[]>;
  update(id: string, data: UpdateSubmissionRequest): Promise<Submission>;
  updateStatus(id: string, status: SubmissionStatus): Promise<void>;
  delete(id: string): Promise<void>;
  list(query?: GetSubmissionsQuery): Promise<Submission[]>;
}

// Utility function to convert Prisma Submission to our Submission interface
function mapPrismaSubmissionToSubmission(prismaSubmission: PrismaSubmissionWithFiles): Submission & { files?: SubmissionFile[] } {
  return {
    id: prismaSubmission.id,
    userId: prismaSubmission.userId,
    status: prismaSubmission.status as SubmissionStatus,
    tier: prismaSubmission.tier as SubmissionTier,
    title: prismaSubmission.title,
    baseIrsPath: prismaSubmission.baseIrsPath || undefined,
    submissionType: prismaSubmission.submissionType || undefined,
    fiscalNumber: prismaSubmission.fiscalNumber || undefined,
    year: prismaSubmission.year || undefined,
    createdAt: prismaSubmission.createdAt,
    updatedAt: prismaSubmission.updatedAt,
    // Preserve files if they exist
    files: prismaSubmission.files || undefined,
  };
}

class PrismaSubmissionRepository implements SubmissionRepository {
  async create(data: CreateSubmissionRequest): Promise<Submission> {
    const submission = await prisma.submission.create({
      data: {
        userId: data.userId,
        userPackId: data.userPackId,
        title: data.title,
        status: SubmissionStatus.DRAFT,
        tier: data.tier || 'STANDARD', // Default to STANDARD if not specified
        baseIrsPath: data.baseIrsPath,
        submissionType: data.submissionType,
        fiscalNumber: data.fiscalNumber,
        year: data.year,
      }
    });

    return mapPrismaSubmissionToSubmission(submission);
  }

  async getById(id: string): Promise<(Submission & { files?: SubmissionFile[] }) | null> {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        files: true
      }
    });
    
    return submission ? mapPrismaSubmissionToSubmission(submission) : null;
  }

  async getByUserId(userId: string): Promise<Submission[]> {
    const submissions = await prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    return submissions.map(mapPrismaSubmissionToSubmission);
  }

  async update(id: string, data: UpdateSubmissionRequest): Promise<Submission> {
    const updateData: SubmissionUpdate = {
      ...data,
      updatedAt: new Date(),
    };

    const submission = await prisma.submission.update({
      where: { id },
      data: updateData
    });
    
    return mapPrismaSubmissionToSubmission(submission);
  }

  async updateStatus(id: string, status: SubmissionStatus): Promise<void> {
    await prisma.submission.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      }
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.submission.delete({
      where: { id }
    });
  }

  async list(query?: GetSubmissionsQuery): Promise<Submission[]> {
    const where: { userId?: string; status?: SubmissionStatus } = {};
    
    if (query?.userId) {
      where.userId = query.userId;
    }
    
    if (query?.status) {
      where.status = query.status;
    }

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query?.limit,
      skip: query?.offset,
    });
    
    return submissions.map(mapPrismaSubmissionToSubmission);
  }
}

// Export singleton instance
export const submissionRepository = new PrismaSubmissionRepository();
