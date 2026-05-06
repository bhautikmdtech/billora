import { NextResponse } from "next/server";
import { db } from "@/db";
import { expenses, dailyKharsa, auditLogs } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { handleError } from "@/lib/http";

const schema = z.object({
  date: z.string().optional(),
  category: z.enum(["salary", "rent", "electricity", "transport", "maintenance", "misc", "other"]).optional(),
  description: z.string().optional(),
  amount: z.number().int().positive().optional(),
  paymentMethod: z.enum(["cash", "upi", "card", "credit", "cheque"]).optional(),
  paidTo: z.string().optional(),
});

export async function DELETE(
  _req: Request,
  { params }: { params: { orgId: string, shopId: string, expenseId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, params.shopId);

    const result = await db.transaction(async (tx) => {
      const [expense] = await tx
        .select()
        .from(expenses)
        .where(and(eq(expenses.id, params.expenseId), eq(expenses.shopId, params.shopId)))
        .limit(1);

      if (!expense) return null;

      await tx.delete(expenses).where(eq(expenses.id, params.expenseId));

      // Update dailyKharsa
      await tx
        .update(dailyKharsa)
        .set({
          totalExpenses: sql`${dailyKharsa.totalExpenses} - ${expense.amount}`,
        })
        .where(and(eq(dailyKharsa.shopId, params.shopId), eq(dailyKharsa.date, expense.date)));

      await tx.insert(auditLogs).values({
        orgId: params.orgId,
        shopId: params.shopId,
        userId: user.id,
        action: "expense.deleted",
        entity: "expense",
        entityId: params.expenseId,
      });

      return true;
    });

    if (!result) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
