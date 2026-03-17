import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { holdings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const broker = searchParams.get("broker");

    if (broker && broker !== "all") {
      await db.delete(holdings).where(
        and(
          eq(holdings.userId, userId),
          eq(holdings.broker, broker)
        )
      );
    } else {
      await db.delete(holdings).where(
        eq(holdings.userId, userId)
      );
    }

    return NextResponse.json({ 
      success: true,
      message: `Holdings cleared successfully`
    });
  } catch (error: any) {
    console.error("Clear holdings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear holdings" },
      { status: 500 }
    );
  }
}
