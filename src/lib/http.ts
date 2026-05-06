import { z } from "zod";
import { NextResponse } from "next/server";

export function ok<T>(data: T, meta?: unknown): NextResponse {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof z.ZodError) {
    return fail(err.issues[0]?.message ?? "Validation error", 400);
  }
  const e = err as any;
  if (e?.status && e?.message) {
    return fail(e.message, e.status);
  }
  console.error(err);
  return fail("Internal server error", 500);
}

export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  const body = await req.json();
  return schema.parse(body);
}
