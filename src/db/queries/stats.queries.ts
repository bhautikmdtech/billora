import { db } from "@/db";
import { sales, expenses, skus } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { startOfDay, startOfMonth } from "date-fns";

export async function getShopStats(shopId: string) {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const startOfThisMonth = startOfMonth(today);

  // Today's Sales
  const [todaySales] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`sum(${sales.grandTotal})`,
    })
    .from(sales)
    .where(and(eq(sales.shopId, shopId), gte(sales.createdAt, startOfToday)));

  // Today's Expenses
  const [todayExpenses] = await db
    .select({
      total: sql<number>`sum(${expenses.amount})`,
    })
    .from(expenses)
    .where(and(eq(expenses.shopId, shopId), eq(expenses.date, today.toISOString().split('T')[0])));

  // Month Sales
  const [monthSales] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`sum(${sales.grandTotal})`,
    })
    .from(sales)
    .where(and(eq(sales.shopId, shopId), gte(sales.createdAt, startOfThisMonth)));

  // Stock Available
  const [stockAvailable] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(skus)
    .where(and(eq(skus.shopId, shopId), eq(skus.status, "available")));

  return {
    todaySales: {
      count: Number(todaySales?.count || 0),
      total: Number(todaySales?.total || 0),
    },
    todayExpenses: Number(todayExpenses?.total || 0),
    monthSales: {
      count: Number(monthSales?.count || 0),
      total: Number(monthSales?.total || 0),
    },
    stockAvailable: Number(stockAvailable?.count || 0),
  };
}
