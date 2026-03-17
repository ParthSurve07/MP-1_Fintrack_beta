import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { holdings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.userId, userId));

    return NextResponse.json({
      success: true,
      holdings: userHoldings,
    });
  } catch (error: any) {
    console.error("Fetch holdings error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
