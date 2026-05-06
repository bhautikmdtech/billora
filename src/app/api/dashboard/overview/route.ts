import { getDashboardOverview } from "@/db/queries/dashboard.queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const overview = await getDashboardOverview();
    return NextResponse.json({ success: true, data: overview });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
