import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, token, userId) => {
    return NextResponse.json({
      authenticated: true,
      userId,
      timestamp: new Date().toISOString()
    });
  });
}
