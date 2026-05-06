"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function setupProfile(data: {
  userId: string;
  fullName: string;
  phone?: string;
}) {
  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, data.userId))
    .limit(1);

  if (existing) {
    await db
      .update(profiles)
      .set({
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() || null,
      })
      .where(eq(profiles.id, data.userId));
  } else {
    await db.insert(profiles).values({
      id: data.userId,
      fullName: data.fullName.trim(),
      phone: data.phone?.trim() || null,
    });
  }
}
