import { NextResponse } from 'next/server';
import prisma from '@/lib/repositories/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('Error pinging database:', error);
    return NextResponse.json({ message: 'Error pinging PostgreSQL database' }, { status: 500 });
  }
} 