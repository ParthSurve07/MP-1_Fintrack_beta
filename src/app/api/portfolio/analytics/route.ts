import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { holdings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CACHE_TTL, redis } from "@/lib/redis";

// Simple sector mapping for common Indian stocks
const sectorMapping: Record<string, string> = {
  // IT & Technology
  'TCS': 'IT',
  'INFY': 'IT',
  'WIPRO': 'IT',
  'HCLTECH': 'IT',
  'TECHM': 'IT',
  'LTI': 'IT',
  'LTTS': 'IT',
  'MINDTREE': 'IT',
  'MPHASIS': 'IT',
  'COFORGE': 'IT',
  
  // Banking
  'HDFCBANK': 'Banking',
  'ICICIBANK': 'Banking',
  'SBIN': 'Banking',
  'AXISBANK': 'Banking',
  'KOTAKBANK': 'Banking',
  'INDUSINDBK': 'Banking',
  'BANDHANBNK': 'Banking',
  'FEDERALBNK': 'Banking',
  'IDFCFIRSTB': 'Banking',
  'PNB': 'Banking',
  'BANKBARODA': 'Banking',
  'CANBK': 'Banking',
  
  // Financial Services (NBFCs)
  'BAJFINANCE': 'Financial Services',
  'BAJAJFINSV': 'Financial Services',
  'HDFCLIFE': 'Financial Services',
  'SBILIFE': 'Financial Services',
  'ICICIGI': 'Financial Services',
  'CHOLAFIN': 'Financial Services',
  'MUTHOOTFIN': 'Financial Services',
  'PFC': 'Financial Services',
  'RECLTD': 'Financial Services',
  
  // Oil & Gas / Energy
  'RELIANCE': 'Oil & Gas',
  'ONGC': 'Oil & Gas',
  'BPCL': 'Oil & Gas',
  'IOC': 'Oil & Gas',
  'GAIL': 'Oil & Gas',
  'PETRONET': 'Oil & Gas',
  
  // Power
  'NTPC': 'Power',
  'POWERGRID': 'Power',
  'ADANIPOWER': 'Power',
  'TATAPOWER': 'Power',
  'TORNTPOWER': 'Power',
  'JSW ENERGY': 'Power',
  
  // Automobile
  'TATAMOTORS': 'Automobile',
  'MARUTI': 'Automobile',
  'M&M': 'Automobile',
  'HEROMOTOCO': 'Automobile',
  'BAJAJ-AUTO': 'Automobile',
  'EICHERMOT': 'Automobile',
  'ASHOKLEY': 'Automobile',
  'TVSMOTOR': 'Automobile',
  'ESCORTS': 'Automobile',
  
  // Pharma
  'SUNPHARMA': 'Pharma',
  'DRREDDY': 'Pharma',
  'CIPLA': 'Pharma',
  'DIVISLAB': 'Pharma',
  'AUROPHARMA': 'Pharma',
  'LUPIN': 'Pharma',
  'BIOCON': 'Pharma',
  'TORNTPHARM': 'Pharma',
  'ALKEM': 'Pharma',
  
  // FMCG (Fast Moving Consumer Goods)
  'HINDUNILVR': 'FMCG',
  'ITC': 'FMCG',
  'NESTLEIND': 'FMCG',
  'BRITANNIA': 'FMCG',
  'DABUR': 'FMCG',
  'MARICO': 'FMCG',
  'GODREJCP': 'FMCG',
  'COLPAL': 'FMCG',
  'TATACONSUM': 'FMCG',
  
  // Metals & Mining
  'TATASTEEL': 'Metals',
  'HINDALCO': 'Metals',
  'JSWSTEEL': 'Metals',
  'VEDL': 'Metals',
  'COALINDIA': 'Metals',
  'NATIONALUM': 'Metals',
  'SAIL': 'Metals',
  'HINDZINC': 'Metals',
  
  // Cement
  'ULTRACEMCO': 'Cement',
  'GRASIM': 'Cement',
  'SHREECEM': 'Cement',
  'AMBUJACEM': 'Cement',
  'ACC': 'Cement',
  'DALMIACEM': 'Cement',
  
  // Realty
  'DLF': 'Realty',
  'GODREJPROP': 'Realty',
  'OBEROIRLTY': 'Realty',
  'PRESTIGE': 'Realty',
  'PHOENIXLTD': 'Realty',
  'BRIGADE': 'Realty',
  
  // Infrastructure & Capital Goods
  'LT': 'Infrastructure',
  'ADANIPORTS': 'Infrastructure',
  'ADANIENT': 'Infrastructure',
  'BHARTIARTL': 'Telecom',
  'AIRTELPP': 'Telecom',
  'IDEA': 'Telecom',
  
  // Consumer Durables
  'VOLTAS': 'Consumer Durables',
  'HAVELLS': 'Consumer Durables',
  'DIXON': 'Consumer Durables',
  'WHIRLPOOL': 'Consumer Durables',
  'CROMPTON': 'Consumer Durables',
  
  // Media & Entertainment
  'ZEEL': 'Media',
  'PVR': 'Media',
  'SUNTV': 'Media',
  
  // Chemicals
  'UPL': 'Chemicals',
  'PIDILITIND': 'Chemicals',
  'AARTI': 'Chemicals',
  'DEEPAKNI': 'Chemicals',
  'SRF': 'Chemicals',
  
  // Textiles
  'ADITYA BIRLA': 'Textiles',
  'RAYMOND': 'Textiles',
  'WELSPUNIND': 'Textiles',
  
  // Healthcare
  'APOLLOHOSP': 'Healthcare',
  'FORTIS': 'Healthcare',
  'MAXHEALTH': 'Healthcare',
  'NARAYANAHSP': 'Healthcare',
};

function getSector(symbol: string): string {
  const cleanSymbol = symbol.replace(/-EQ$/i, '').toUpperCase();
  return sectorMapping[cleanSymbol] || 'Others';
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // const cacheKey = `analytics:${userId}`;
    // const cached = await redis.get(cacheKey);

    // if (cached) {
    //   console.log("✅ Cache hit for analytics");
    //   return NextResponse.json(cached);
    // }

    const userHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.userId, userId));

    if (userHoldings.length === 0) {
      return NextResponse.json({
        sectorAllocation: [],
        topGainers: [],
        topLosers: [],
        aiInsights: null,
      });
    }

    const sectorMap: Record<string, number> = {};
    let totalValue = 0;

    userHoldings.forEach((h) => {
      const sector = getSector(h.symbol); // Use mapping function
      const value = h.currentPrice ? parseFloat(h.currentPrice) * h.quantity : parseFloat(h.avgPrice) * h.quantity;
      sectorMap[sector] = (sectorMap[sector] || 0) + value;
      totalValue += value;
    });

    const sectorAllocation = Object.entries(sectorMap).map(([sector, value]) => ({
      sector,
      value,
      percentage: (value / totalValue) * 100,
    }));

    // Top gainers and losers
    const stockPerformance = userHoldings
      .filter((h) => h.currentPrice)
      .map((h) => {
        const pl = (parseFloat(h.currentPrice!) - parseFloat(h.avgPrice)) * h.quantity;
        const plPercent = ((parseFloat(h.currentPrice!) - parseFloat(h.avgPrice)) / parseFloat(h.avgPrice)) * 100;
        return {
          symbol: h.symbol,
          pl,
          plPercent,
        };
      });

    const topGainers = stockPerformance
      .filter((s) => s.plPercent > 0)
      .sort((a, b) => b.plPercent - a.plPercent)
      .slice(0, 3);

    const topLosers = stockPerformance
      .filter((s) => s.plPercent < 0)
      .sort((a, b) => a.plPercent - b.plPercent)
      .slice(0, 3);

    const response = {
      sectorAllocation,
      topGainers,
      topLosers,
      aiInsights: null,
    }

    // await redis.setex(cacheKey, CACHE_TTL.ANALYTICS, JSON.stringify(response));

    return NextResponse.json({
      sectorAllocation,
      topGainers,
      topLosers,
      aiInsights: null,
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
