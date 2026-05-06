import { db } from "@/db";
import { expenses } from "@/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export async function getShopExpenses(shopId: string, dateFrom?: string, dateTo?: string) {
  const whereClauses = [eq(expenses.shopId, shopId)];
  if (dateFrom) whereClauses.push(gte(expenses.date, dateFrom));
  if (dateTo) whereClauses.push(lte(expenses.date, dateTo));

  return db
    .select()
    .from(expenses)
    .where(and(...whereClauses))
    .orderBy(sql`${expenses.date} DESC`);
}

export async function createExpense(data: typeof expenses.$inferInsert) {
  const [expense] = await db.insert(expenses).values(data).returning();
  return expense;
}
