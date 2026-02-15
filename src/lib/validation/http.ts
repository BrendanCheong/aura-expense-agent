import { NextResponse } from 'next/server';
import { treeifyError, type ZodError } from 'zod';
import { HttpStatus, ErrorMessage } from '@/lib/constants';

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    {
      error: ErrorMessage.VALIDATION_FAILED,
      issues: treeifyError(error),
    },
    { status: HttpStatus.BAD_REQUEST },
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
  return NextResponse.json(
    { error: ErrorMessage.UNAUTHORIZED },
    { status: HttpStatus.UNAUTHORIZED },
  );
}

export function serverErrorResponse() {
  return NextResponse.json(
    { error: ErrorMessage.INTERNAL_SERVER_ERROR },
    { status: HttpStatus.INTERNAL_SERVER_ERROR },
  );
}

export function notFoundResponse(message: string = ErrorMessage.NOT_FOUND) {
  return NextResponse.json({ error: message }, { status: HttpStatus.NOT_FOUND });
}

export function notImplementedResponse() {
  return NextResponse.json(
    { error: ErrorMessage.NOT_IMPLEMENTED },
    { status: HttpStatus.NOT_IMPLEMENTED },
  );
}

export function invalidJsonResponse() {
  return NextResponse.json(
    { error: ErrorMessage.INVALID_JSON },
    { status: HttpStatus.BAD_REQUEST },
  );
}

export function conflictResponse(message: string = ErrorMessage.ALREADY_EXISTS) {
  return NextResponse.json({ error: message }, { status: HttpStatus.CONFLICT });
}
