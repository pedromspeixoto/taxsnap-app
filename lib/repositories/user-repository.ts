import { prisma } from './prisma';
import type { User as PrismaUser } from '../generated/prisma';

// Define the interface to match what the service expects
export interface User {
  id: string;
  email: string;
  password?: string;
  verified: boolean;
  verificationToken?: string;
  verificationUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  verificationToken: string;
  verificationUrl: string;
  password: string;
}

export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  getById(id: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  getByVerificationToken(token: string): Promise<User | null>;
  verifyUser(id: string): Promise<void>;
  updateVerificationToken(id: string, token: string, url: string): Promise<void>;
  setPassword(id: string, hashedPassword: string): Promise<void>;
  delete(id: string): Promise<void>;
}

// Utility function to convert Prisma User to our User interface
function mapPrismaUserToUser(prismaUser: PrismaUser): User {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    password: prismaUser.password || undefined,
    verified: prismaUser.verified,
    verificationToken: prismaUser.verificationToken || undefined,
    verificationUrl: prismaUser.verificationUrl || undefined,
    createdAt: prismaUser.createdAt.toISOString(),
    updatedAt: prismaUser.updatedAt.toISOString(),
  };
}

class PrismaUserRepository implements UserRepository {
  async create(data: CreateUserData): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        verificationToken: data.verificationToken,
        verificationUrl: data.verificationUrl,
        verified: false,
      }
    });
    
    return mapPrismaUserToUser(user);
  }

  async getById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    return user ? mapPrismaUserToUser(user) : null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    return user ? mapPrismaUserToUser(user) : null;
  }

  async getByVerificationToken(token: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });
    
    return user ? mapPrismaUserToUser(user) : null;
  }

  async verifyUser(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        verified: true,
        verificationToken: null,
        verificationUrl: null,
      }
    });
  }

  async updateVerificationToken(id: string, token: string, url: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        verificationToken: token,
        verificationUrl: url,
      }
    });
  }

  async setPassword(id: string, hashedPassword: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      }
    });
  }

  async delete(id: string): Promise<void> {
    // Soft delete by setting deletedAt timestamp
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      }
    });
  }
}

// Export singleton instance
export const userRepository = new PrismaUserRepository(); 