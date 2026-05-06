import { db } from "@/db";
import { dailyKharsa } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getDailyKharsa(shopId: string, date: string) {
  const [kharsa] = await db
    .select()
    .from(dailyKharsa)
    .where(and(eq(dailyKharsa.shopId, shopId), eq(dailyKharsa.date, date)))
    .limit(1);
  return kharsa || null;
}

export async function upsertDailyKharsa(data: typeof dailyKharsa.$inferInsert) {
  const [kharsa] = await db
    .insert(dailyKharsa)
    .values(data)
    .onConflictDoUpdate({
      target: [dailyKharsa.shopId, dailyKharsa.date],
      set: {
        openingBalance: data.openingBalance,
        totalSales: data.totalSales,
        totalReturns: data.totalReturns,
        totalPurchases: data.totalPurchases,
        totalExpenses: data.totalExpenses,
        closingBalance: data.closingBalance,
        salesCount: data.salesCount,
      },
    })
    .returning();
  return kharsa;
}
