import { NextResponse } from 'next/server';

// Public interfaces and types
export interface AuthTestResponse {
  message: string;
}

/**
 * Test endpoint for authentication system.
 * Returns a simple success message to verify the auth route is working.
 */
export async function GET(): Promise<NextResponse<AuthTestResponse>> {
  return NextResponse.json({ message: 'Auth test route is working!' });
}
