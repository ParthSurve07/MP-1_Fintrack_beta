import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { holdings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import * as speakeasy from "speakeasy";
import { redis } from "@/lib/redis";

const ANGELONE_API_KEY = process.env.ANGELONE_API_KEY || "jOoWIZMN";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clientCode, password, totpSecret } = body;

    const totp = speakeasy.totp({
      secret: totpSecret,
      encoding: "base32",
    });

    const loginRes = await fetch("https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "192.168.1.1",
        "X-ClientPublicIP": "106.193.147.98",
        "X-MACAddress": "fe80::216e:6507:4b90:3719",
        "X-PrivateKey": ANGELONE_API_KEY,
      },
      body: JSON.stringify({
        clientcode: clientCode,
        password: password,
        totp: totp,
      }),
    });

    const loginData = await loginRes.json();
    console.log("Login response:", loginData);

    if (!loginData.status || !loginData.data?.jwtToken) {
      return NextResponse.json(
        { error: loginData.message || "Login failed" },
        { status: 400 }
      );
    }

    const jwtToken = loginData.data.jwtToken;

    const holdingsRes = await fetch("https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "192.168.1.1",
        "X-ClientPublicIP": "106.193.147.98",
        "X-MACAddress": "fe80::216e:6507:4b90:3719",
        "X-PrivateKey": ANGELONE_API_KEY,
      },
    });

    const holdingsData = await holdingsRes.json();
    console.log("Holdings response:", JSON.stringify(holdingsData, null, 2));

    if (!holdingsData.status) {
      return NextResponse.json(
        { error: holdingsData.message || "Failed to fetch holdings" },
        { status: 400 }
      );
    }

    let angelHoldings = holdingsData.data?.holdings || holdingsData.data || [];
    
    if (!Array.isArray(angelHoldings)) {
      console.log("Holdings is not an array:", angelHoldings);
      angelHoldings = [];
    }

    console.log("Parsed holdings count:", angelHoldings.length);

    await db.delete(holdings).where(
      and(eq(holdings.userId, userId), eq(holdings.broker, "angelone"))
    );

    if (angelHoldings.length > 0) {
      const insertData = angelHoldings.map((h: any) => ({
        userId,
        broker: "angelone",
        symbol: h.tradingsymbol || h.symbol || "UNKNOWN",
        companyName: h.tradingsymbol || h.symbol || "UNKNOWN",
        isin: h.isin || null,
        quantity: parseInt(h.quantity || h.qty) || 0,
        avgPrice: (h.averageprice || h.avgPrice || h.average_price || "0").toString(),
        currentPrice: (h.ltp || h.close || h.lastPrice || "0").toString(),
        sector: null,
      }));

      console.log("Inserting data:", insertData);
      await db.insert(holdings).values(insertData);
    }

    await redis.del(`dashboard:${userId}`);
    await redis.del(`analytics:${userId}`);

    return NextResponse.json({
      success: true,
      count: angelHoldings.length,
      debug: holdingsData,
    });
  } catch (error: any) {
    console.error("Angel One sync error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
