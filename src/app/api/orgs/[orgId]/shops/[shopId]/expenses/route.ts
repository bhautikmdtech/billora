import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyKharsa, auditLogs } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { requireShopRole } from "@/lib/permissions";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { createExpense, getShopExpenses } from "@/db/queries/expenses.queries";

const schema = z.object({
  date: z.string(), // YYYY-MM-DD
  category: z.enum(["salary", "rent", "electricity", "transport", "maintenance", "misc", "other"]),
  description: z.string().optional(),
  amount: z.number().int().positive(),
  paymentMethod: z.enum(["cash", "upi", "card", "credit", "cheque"]),
  paidTo: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { orgId: string, shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin"], user.id, params.shopId);

    const body = await req.json();
    const validated = schema.parse(body);

    const result = await db.transaction(async (tx) => {
      const expense = await createExpense({
        ...validated,
        orgId: params.orgId,
        shopId: params.shopId,
        createdBy: user.id,
      });

      // Update dailyKharsa
      await tx
        .insert(dailyKharsa)
        .values({
          orgId: params.orgId,
          shopId: params.shopId,
          date: validated.date,
          totalExpenses: validated.amount,
        })
        .onConflictDoUpdate({
          target: [dailyKharsa.shopId, dailyKharsa.date],
          set: {
            totalExpenses: sql`${dailyKharsa.totalExpenses} + ${validated.amount}`,
          },
        });

      await tx.insert(auditLogs).values({
        orgId: params.orgId,
        shopId: params.shopId,
        userId: user.id,
        action: "expense.created",
        entity: "expense",
        entityId: expense.id,
        changes: validated as any,
      });

      return expense;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { orgId: string, shopId: string } }
) {
  try {
    const user = await requireAuth();
    await requireShopRole(["org_owner", "partner", "admin", "employee"], user.id, params.shopId);

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    
    const data = await getShopExpenses(params.shopId, dateFrom, dateTo);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
