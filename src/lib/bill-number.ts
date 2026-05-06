import { db } from "@/db";
import { sales } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function generateBillNumber(shopId: string, shopCode: string) {
  const currentYear = new Date().getFullYear();
  
  // Find the latest bill for this shop in the current year
  const [latestSale] = await db
    .select({ billNumber: sales.billNumber })
    .from(sales)
    .where(
      and(
        eq(sales.shopId, shopId),
        sql`${sales.billNumber} LIKE ${shopCode + "-" + currentYear + "-%"}`
      )
    )
    .orderBy(sql`${sales.billNumber} DESC`)
    .limit(1);

  let nextNumber = 1;
  if (latestSale) {
    const parts = latestSale.billNumber.split("-");
    const lastNum = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  const paddedNumber = String(nextNumber).padStart(4, "0");
  return `${shopCode}-${currentYear}-${paddedNumber}`;
}
