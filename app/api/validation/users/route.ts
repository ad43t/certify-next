import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import {
  findActiveValidationUsers,
  ValidationUnauthorizedError,
} from '@/lib/validation.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const users = await findActiveValidationUsers({
      database: prisma,
      session: await auth(),
      query: searchParams.get('q'),
    });

    return NextResponse.json({
      results: users.map((user) => ({
        value: user.id,
        label: `${user.name} (${user.email})`,
      })),
    });
  } catch (error) {
    if (error instanceof ValidationUnauthorizedError) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 },
      );
    }

    console.error('Failed to fetch options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation users.' },
      { status: 500 },
    );
  }
}
