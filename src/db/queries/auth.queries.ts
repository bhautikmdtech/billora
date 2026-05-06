import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile || null;
}

export async function createProfile(data: typeof profiles.$inferInsert) {
  const [profile] = await db.insert(profiles).values(data).returning();
  return profile;
}
