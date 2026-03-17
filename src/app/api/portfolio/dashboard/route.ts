import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { holdings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CACHE_TTL, redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cacheKey = `dashboard:${userId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log("✅ Cache hit for dashboard");
      return NextResponse.json(cached);
    }

    console.log("❌ Cache miss - fetching from DB");

    const userHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.userId, userId));

    if (userHoldings.length === 0) {
      return NextResponse.json({
        totalInvested: 0,
        currentValue: 0,
        totalPL: 0,
        totalPLPercent: 0,
        holdingsCount: 0,
        topHoldings: [],
      });
    }

    // Calculate stats
    let totalInvested = 0;
    let currentValue = 0;
    const holdingValues: { symbol: string; value: number }[] = [];

    userHoldings.forEach((h) => {
      const invested = parseFloat(h.avgPrice) * h.quantity;
      const current = h.currentPrice ? parseFloat(h.currentPrice) * h.quantity : invested;

      totalInvested += invested;
      currentValue += current;

      holdingValues.push({
        symbol: h.symbol,
        value: current,
      });
    });

    const totalPL = currentValue - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    const sortedHoldings = holdingValues.sort((a, b) => b.value - a.value);
    const top5 = sortedHoldings.slice(0, 5);
    const remaining = sortedHoldings.slice(5);

    let topHoldings = top5.map((h) => ({
      symbol: h.symbol,
      value: h.value,
      percentage: (h.value / currentValue) * 100,
    }));

    if (remaining.length > 0) {
      const othersValue = remaining.reduce((sum, h) => sum + h.value, 0);
      topHoldings.push({
        symbol: `Others (${remaining.length})`,
        value: othersValue,
        percentage: (othersValue / currentValue) * 100,
      });
    }

    const response = {
      totalInvested,
      currentValue,
      totalPL,
      totalPLPercent,
      holdingsCount: userHoldings.length,
      topHoldings,
    };

    await redis.setex(cacheKey, CACHE_TTL.DASHBOARD, JSON.stringify(response));

    return NextResponse.json(response);

    // return NextResponse.json({
    //   totalInvested,
    //   currentValue,
    //   totalPL,
    //   totalPLPercent,
    //   holdingsCount: userHoldings.length,
    //   topHoldings,
    // });
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
