import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";
import { nodeEnv } from "../env.node";

const sql = postgres(nodeEnv.DATABASE_URL, { max: 1 });

const migration = readFileSync(
  join(process.cwd(), "drizzle/0001_pink_silhouette.sql"),
  "utf8"
);

async function run() {
  console.log("Running migration...");
  console.log(migration);
  await sql.unsafe(migration);
  console.log("✓ Migration complete");
  await sql.end();
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
