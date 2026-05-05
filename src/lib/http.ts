import { z } from "zod";

import { createRouteLogger } from "@/lib/logger";
import type { ApiResponse } from "@/types/api";

export function ok<TData, TMeta = undefined>(
  data: TData,
  meta?: TMeta
): Response {
  return Response.json({
    success: true,
    data,
    meta,
  } satisfies ApiResponse<TData, TMeta>);
}

export function fail(message: string, status = 400): Response {
  return Response.json(
    {
      success: false,
      data: null,
      error: message,
    },
    { status }
  );
}

export async function parseJson<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const payload = await request.json();
  return schema.parse(payload);
}

export function getRequestLogger(name: string) {
  return createRouteLogger({ route: name });
}
