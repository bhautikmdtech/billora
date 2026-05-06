import { requireAuth } from "@/lib/auth";
import { ok, handleError } from "@/lib/http";
import { upsertProfile } from "@/db/queries/profiles.queries";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validated = schema.parse(body);

    const profile = await upsertProfile({
      id: user.id,
      fullName: validated.fullName,
      phone: validated.phone,
      avatarUrl: validated.avatarUrl,
    });

    return ok(profile);
  } catch (err) {
    return handleError(err);
  }
}
