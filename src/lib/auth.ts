import { createClient } from "./supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { unauthorized } from "./errors";

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) throw unauthorized();
  return user;
}

export async function getUserProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId));
  return profile ?? null;
}

export async function requireAuthWithProfile() {
  const user = await requireAuth();
  const profile = await getUserProfile(user.id);
  if (!profile) throw unauthorized("Profile not found");
  return { user, profile };
}
