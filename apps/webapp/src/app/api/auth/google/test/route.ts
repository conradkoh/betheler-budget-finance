import { NextResponse } from 'next/server';

// Public interfaces and types
export interface TestResponse {
  message: string;
}

/**
 * Test endpoint for Google authentication configuration.
 * Returns a simple success message to verify the route is working.
 */
export async function GET(): Promise<NextResponse<TestResponse>> {
  return NextResponse.json({ message: 'Google auth test route is working!' });
}
