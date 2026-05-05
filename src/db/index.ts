import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "@/lib/env/server";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
  drizzleDb?: ReturnType<typeof drizzle<typeof schema>>;
};

const client =
  globalForDb.postgresClient ??
  postgres(serverEnv.DATABASE_URL, {
    max: 10,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: "require",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db =
  globalForDb.drizzleDb ??
  drizzle(client, {
    schema,
    logger: process.env.NODE_ENV === "development",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.drizzleDb = db;
}

export { schema };
