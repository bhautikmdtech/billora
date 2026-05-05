import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("❌ Invalid env for Drizzle");
}

export const nodeEnv = parsed.data;