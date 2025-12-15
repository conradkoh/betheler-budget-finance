import { NextResponse } from 'next/server';

// Public interfaces and types
export interface TestResponse {
  message: string;
}

/**
 * General test endpoint for API routes.
 * Returns a simple success message to verify the route is working.
 */
export async function GET(): Promise<NextResponse<TestResponse>> {
  return NextResponse.json({ message: 'Test route is working!' });
}
