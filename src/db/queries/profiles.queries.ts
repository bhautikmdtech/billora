import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getProfileById(id: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);
  return profile || null;
}

export async function upsertProfile(data: typeof profiles.$inferInsert) {
  const [profile] = await db
    .insert(profiles)
    .values(data)
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        fullName: data.fullName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        updatedAt: new Date(),
      },
    })
    .returning();
  return profile;
}
