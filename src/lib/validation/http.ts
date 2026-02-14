import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      issues: error.flatten(),
    },
    { status: 400 },
  );
}

export function parseQueryObject(searchParams: URLSearchParams): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    query[key] = value;
  }
  return query;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function serverErrorResponse() {
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
