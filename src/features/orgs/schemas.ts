import { z } from "zod";

export const onboardingSchema = z.object({
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
  orgCategory: z.enum([
    "saree",
    "dress",
    "kariyana",
    "jewellery",
    "electronics",
    "hardware",
    "general",
  ]),
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
});

export const createShopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters"),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z
    .object({
      line1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
    })
    .optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["org_owner", "partner", "admin", "employee"]),
  shopId: z.string().uuid().optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type CreateShopInput = z.infer<typeof createShopSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
