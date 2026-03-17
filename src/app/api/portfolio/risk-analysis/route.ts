import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { holdings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Sector mapping
const sectorMapping: Record<string, string> = {
  'TCS': 'IT', 'INFY': 'IT', 'WIPRO': 'IT', 'HCLTECH': 'IT', 'TECHM': 'IT',
  'HDFCBANK': 'Banking', 'ICICIBANK': 'Banking', 'SBIN': 'Banking', 'AXISBANK': 'Banking', 'KOTAKBANK': 'Banking',
  'INDUSINDBK': 'Banking', 'BANDHANBNK': 'Banking', 'FEDERALBNK': 'Banking', 'IDFCFIRSTB': 'Banking',
  'PNB': 'Banking', 'BANKBARODA': 'Banking', 'CANBK': 'Banking',
  'BAJFINANCE': 'Financial Services', 'BAJAJFINSV': 'Financial Services', 'HDFCLIFE': 'Financial Services',
  'SBILIFE': 'Financial Services', 'ICICIGI': 'Financial Services', 'PFC': 'Financial Services',
  'RELIANCE': 'Oil & Gas', 'ONGC': 'Oil & Gas', 'BPCL': 'Oil & Gas', 'IOC': 'Oil & Gas', 'GAIL': 'Oil & Gas',
  'NTPC': 'Power', 'POWERGRID': 'Power', 'ADANIPOWER': 'Power', 'TATAPOWER': 'Power',
  'TATAMOTORS': 'Automobile', 'MARUTI': 'Automobile', 'M&M': 'Automobile', 'HEROMOTOCO': 'Automobile',
  'BAJAJ-AUTO': 'Automobile', 'EICHERMOT': 'Automobile',
  'SUNPHARMA': 'Pharma', 'DRREDDY': 'Pharma', 'CIPLA': 'Pharma', 'DIVISLAB': 'Pharma', 'AUROPHARMA': 'Pharma',
  'HINDUNILVR': 'FMCG', 'ITC': 'FMCG', 'NESTLEIND': 'FMCG', 'BRITANNIA': 'FMCG', 'DABUR': 'FMCG',
  'TATASTEEL': 'Metals', 'HINDALCO': 'Metals', 'JSWSTEEL': 'Metals', 'COALINDIA': 'Metals',
  'ULTRACEMCO': 'Cement', 'GRASIM': 'Cement', 'SHREECEM': 'Cement',
  'BHARTIARTL': 'Telecom', 'AIRTELPP': 'Telecom',
  'ANANTRAJ': 'Realty', 'DLF': 'Realty', 'GODREJPROP': 'Realty',
  'LT': 'Infrastructure', 'ADANIPORTS': 'Infrastructure', 'ADANIENT': 'Infrastructure',
};

function getSector(symbol: string): string {
  const cleanSymbol = symbol.replace(/-EQ$/i, '').replace(/-E1$/i, '').toUpperCase();
  return sectorMapping[cleanSymbol] || 'Others';
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.userId, userId));

    if (userHoldings.length === 0) {
      return NextResponse.json({ error: "No holdings found" }, { status: 400 });
    }

    // Calculate portfolio metrics
    let totalValue = 0;
    const sectorMap: Record<string, number> = {};
    const stockValues: { symbol: string; value: number; percentage: number }[] = [];

    userHoldings.forEach((h) => {
      const value = h.currentPrice 
        ? parseFloat(h.currentPrice) * h.quantity 
        : parseFloat(h.avgPrice) * h.quantity;
      
      totalValue += value;
      
      const sector = getSector(h.symbol);
      sectorMap[sector] = (sectorMap[sector] || 0) + value;
      
      stockValues.push({
        symbol: h.symbol,
        value,
        percentage: 0
      });
    });

    // Calculate percentages
    stockValues.forEach(s => s.percentage = (s.value / totalValue) * 100);
    stockValues.sort((a, b) => b.value - a.value);

    const sectorPercentages = Object.entries(sectorMap).map(([sector, value]) => ({
      sector,
      percentage: (value / totalValue) * 100
    })).sort((a, b) => b.percentage - a.percentage);

    const topHoldingPercent = stockValues[0].percentage;
    const top3HoldingsPercent = stockValues.slice(0, 3).reduce((sum, s) => sum + s.percentage, 0);
    const topSectorPercent = sectorPercentages[0].percentage;
    const topSectorName = sectorPercentages[0].sector;

    // Calculate risk score (0-10)
    let riskScore = 0;
    
    // Factor 1: Single stock concentration (max 3 points)
    if (topHoldingPercent > 30) riskScore += 3;
    else if (topHoldingPercent > 20) riskScore += 2;
    else if (topHoldingPercent > 10) riskScore += 1;

    // Factor 2: Top 3 holdings (max 3 points)
    if (top3HoldingsPercent > 60) riskScore += 3;
    else if (top3HoldingsPercent > 45) riskScore += 2;
    else if (top3HoldingsPercent > 30) riskScore += 1;

    // Factor 3: Sector concentration (max 2 points)
    if (topSectorPercent > 50) riskScore += 2;
    else if (topSectorPercent > 35) riskScore += 1;

    // Factor 4: Number of holdings (max 2 points)
    if (userHoldings.length < 6) riskScore += 2;
    else if (userHoldings.length < 10) riskScore += 1;

    // Risk level
    let riskLevel = "";
    if (riskScore <= 3) riskLevel = "Low Risk - Well Diversified";
    else if (riskScore <= 6) riskLevel = "Moderate Risk - Balanced Portfolio";
    else riskLevel = "High Risk - Concentrated Portfolio";

    // Prepare sector breakdown for AI
    const sectorBreakdown = sectorPercentages
      .map(s => `${s.sector}: ${s.percentage.toFixed(1)}%`)
      .join(', ');

    const top5Stocks = stockValues
      .slice(0, 5)
      .map(s => `${s.symbol} (${s.percentage.toFixed(1)}%)`)
      .join(', ');

    // AI-POWERED RECOMMENDATIONS
    let recommendations: string[] = [];
    
    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      
      if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY not found");
      }

      const aiPrompt = `You are an expert portfolio risk analyst for Indian stock markets. Analyze this portfolio and provide EXACTLY 2-3 actionable recommendations.

PORTFOLIO METRICS:
- Risk Score: ${riskScore.toFixed(1)}/10 (${riskLevel})
- Total Holdings: ${userHoldings.length} stocks
- Portfolio Value: ₹${totalValue.toFixed(0)}

CONCENTRATION ANALYSIS:
- Top Holding: ${stockValues[0].symbol} = ${topHoldingPercent.toFixed(1)}% of portfolio
- Top 3 Holdings Combined: ${top3HoldingsPercent.toFixed(1)}%
- Top 5 Holdings: ${top5Stocks}

SECTOR ALLOCATION:
- Top Sector: ${topSectorName} = ${topSectorPercent.toFixed(1)}%
- Sector Breakdown: ${sectorBreakdown}

INSTRUCTIONS:
1. Provide 2-3 specific, actionable recommendations
2. Each recommendation should be 1-2 sentences maximum
3. Focus on the biggest risks (concentration, sector imbalance, diversification)
4. Be direct and specific with stock names and percentages
5. If "Others" sector is too high, suggest consolidation into known sectors
6. Format as numbered list (1. 2. 3.)`;

      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: aiPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
            },
          }),
        }
      );

      if (!aiResponse.ok) {
        throw new Error(`Gemini API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiText) {
        // Parse AI recommendations (extract numbered points)
        recommendations = aiText
          .split('\n')
          .filter((line: string) => {
            const trimmed = line.trim();
            return trimmed && trimmed.match(/^[\d\.\*\-]/) && trimmed.length > 10;
          })
          .map((line: string) => line.replace(/^[\d\.\*\-\s]+/, '').trim())
          .slice(0, 3);
      }

      // Fallback if AI didn't return good format
      if (recommendations.length === 0) {
        throw new Error("AI returned invalid format");
      }

    } catch (aiError: any) {
      console.error("AI recommendations failed:", aiError.message);
      
      // FALLBACK: Rule-based recommendations
      if (topHoldingPercent > 25) {
        recommendations.push(
          `Your top holding (${stockValues[0].symbol}) represents ${topHoldingPercent.toFixed(1)}% of portfolio. Consider booking partial profits to reduce single-stock risk below 20%.`
        );
      }
      
      if (top3HoldingsPercent > 50) {
        recommendations.push(
          `Top 3 holdings account for ${top3HoldingsPercent.toFixed(1)}% of portfolio. Diversify by adding 3-4 quality stocks from underrepresented sectors.`
        );
      }
      
      if (topSectorPercent > 40) {
        if (topSectorName === 'Others') {
          recommendations.push(
            `${topSectorPercent.toFixed(1)}% is in miscellaneous stocks. Consolidate into established sectors like IT, Banking, or Pharma for better portfolio clarity.`
          );
        } else {
          recommendations.push(
            `${topSectorPercent.toFixed(1)}% exposure to ${topSectorName} is too high. Balance by adding IT, Banking, or FMCG stocks.`
          );
        }
      }
      
      if (userHoldings.length < 8 && recommendations.length < 3) {
        recommendations.push(
          `With only ${userHoldings.length} holdings, add 3-5 quality stocks across different sectors to improve diversification.`
        );
      }
    }

    return NextResponse.json({
      riskScore,
      riskLevel,
      recommendations,
    });

  } catch (error: any) {
    console.error("Risk analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze risk" },
      { status: 500 }
    );
  }
}
