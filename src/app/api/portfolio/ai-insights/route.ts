import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { holdings } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    let totalInvested = 0;
    let currentValue = 0;
    const stockSummary: string[] = [];

    userHoldings.forEach((h) => {
      const invested = parseFloat(h.avgPrice) * h.quantity;
      const current = h.currentPrice ? parseFloat(h.currentPrice) * h.quantity : invested;
      const pl = current - invested;
      const plPercent = (pl / invested) * 100;

      totalInvested += invested;
      currentValue += current;

      stockSummary.push(
        `${h.symbol}: Qty ${h.quantity}, Avg ₹${h.avgPrice}, Current ₹${h.currentPrice || "N/A"}, P&L ${plPercent.toFixed(1)}%`
      );
    });

    const totalPL = currentValue - totalInvested;
    const totalPLPercent = (totalPL / totalInvested) * 100;

    const prompt = `You are an expert portfolio analyst with deep knowledge of Indian stock markets. Analyze this portfolio with specific, actionable insights.

PORTFOLIO DATA:
Total Invested: ₹${totalInvested.toFixed(0)}
Current Value: ₹${currentValue.toFixed(0)}
Total P&L: ₹${totalPL.toFixed(0)} (${totalPLPercent.toFixed(2)}%)
Number of Holdings: ${userHoldings.length}

HOLDINGS BREAKDOWN:
${stockSummary.join("\n")}

ANALYSIS REQUIREMENTS:

📊 Portfolio Overview
- Evaluate overall performance vs typical market returns (consider Nifty 50 benchmark)
- Comment on portfolio size and capital efficiency
- Mention if portfolio is growth-oriented, value-focused, or balanced

⚠️ Risk Assessment
- Calculate and explain concentration risk (mention if top 3 holdings exceed 50%)
- Identify sector overexposure or underexposure
- Flag any high-volatility stocks or risky bets
- Comment on diversification quality

💡 Key Insights
- Identify best and worst performers with specific percentages
- Spot patterns: Are gains from a single sector? Is there a theme?
- Mention any stocks with unusually high allocation
- Point out any defensive vs aggressive stock mix

🎯 Actionable Recommendations
- Provide 2-3 specific, implementable actions (e.g., "Book 30% profits from [stock]", "Add exposure to pharma sector")
- Suggest rebalancing if needed with exact percentages
- Recommend specific sectors or stock types to consider adding
- Mention if portfolio needs no changes (if truly balanced)

IMPORTANT:
- Be specific with stock names and numbers
- Use Indian market context (mention Nifty, Sensex if relevant)
- Keep each section to 2-4 sentences
- Be direct and actionable, not generic
- If returns are negative, provide constructive recovery suggestions`;



    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not found");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    console.log("Calling Gemini API...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to generate insights" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("API success");

    const insights = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate insights";

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error("AI insights error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate insights" },
      { status: 500 }
    );
  }
}
