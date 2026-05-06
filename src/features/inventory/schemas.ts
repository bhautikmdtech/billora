import { z } from "zod";

export const addSkuSchema = z.object({
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number({ invalid_type_error: "Enter a valid amount" }).nonnegative(),
  sellingPrice: z.number({ invalid_type_error: "Enter a valid amount" }).nonnegative(),
  mrp: z.number({ invalid_type_error: "Enter a valid amount" }).nonnegative(),
  gstPercent: z.number().min(0).max(100).default(0),
  quantity: z.number().int().positive("Quantity must be at least 1").default(1),
});

export const editSkuSchema = z.object({
  category: z.string().optional(),
  subCategory: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  mrp: z.number().nonnegative().optional(),
  gstPercent: z.number().min(0).max(100).optional(),
  status: z.enum(["available", "sold", "returned_supplier", "damaged"]).optional(),
});

export type AddSkuInput = z.infer<typeof addSkuSchema>;
export type EditSkuInput = z.infer<typeof editSkuSchema>;
