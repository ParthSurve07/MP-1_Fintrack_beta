import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { holdings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Papa from "papaparse";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();

    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid CSV format" },
        { status: 400 }
      );
    }

    const csvData = result.data as any[];

    if (csvData.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      );
    }

    await db.delete(holdings).where(
      and(eq(holdings.userId, userId), eq(holdings.broker, "zerodha"))
    );

    const insertData = csvData.map((row) => ({
      userId,
      broker: "zerodha",
      symbol: row["Symbol"] || row["symbol"] || row["Instrument"] || "",
      companyName: row["Company"] || row["Instrument name"] || row["Symbol"] || "",
      isin: row["ISIN"] || row["isin"] || null,
      quantity: parseInt(row["Quantity"] || row["quantity"] || row["Qty."] || "0"),
      avgPrice: (row["Average price"] || row["Avg. cost"] || row["avg_price"] || "0").toString(),
      currentPrice: (row["LTP"] || row["Last price"] || row["Close price"] || "0").toString(),
      sector: null,
    }));

    const validData = insertData.filter(
      (item) => item.symbol && item.quantity > 0 && parseFloat(item.avgPrice) > 0
    );

    if (validData.length > 0) {
      await db.insert(holdings).values(validData);
    }

    await redis.del(`dashboard:${userId}`);
    await redis.del(`analytics:${userId}`);

    return NextResponse.json({
      success: true,
      count: validData.length,
    });
  } catch (error: any) {
    console.error("Zerodha upload error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
