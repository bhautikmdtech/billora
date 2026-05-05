import type { Config } from "drizzle-kit";
import { nodeEnv } from "./env.node";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: nodeEnv.DATABASE_URL,
  },
} satisfies Config;