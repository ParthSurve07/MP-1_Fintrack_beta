"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, TrendingDown, AlertCircle, Shield, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

type AnalyticsData = {
  sectorAllocation: { sector: string; value: number; percentage: number }[];
  topGainers: { symbol: string; plPercent: number; pl: number }[];
  topLosers: { symbol: string; plPercent: number; pl: number }[];
  aiInsights: string | null;
  riskScore?: number;
  riskLevel?: string;
  recommendations?: string[];
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [riskLoading, setRiskLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/portfolio/analytics");
      const result = await res.json();

      if (res.ok) {
        setData(result);
      } else {
        toast.error("Failed to fetch analytics");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/portfolio/ai-insights", {
        method: "POST",
      });
      const result = await res.json();

      if (res.ok) {
        if (result.insights && result.insights !== "Unable to generate insights") {
          setData((prev) => prev ? { ...prev, aiInsights: result.insights } : null);
          toast.success("AI insights generated!");
        } else {
          setAiError("Unable to generate insights. Please check your API key and try again.");
          toast.error("Failed to generate insights");
        }
      } else {
        setAiError(result.error || "Failed to generate insights");
        toast.error(result.error || "Failed to generate insights");
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      setAiError(error.message || "Something went wrong");
      toast.error("Something went wrong");
    } finally {
      setAiLoading(false);
    }
  };

  const generateRiskAnalysis = async () => {
    setRiskLoading(true);
    try {
      const res = await fetch("/api/portfolio/risk-analysis", {
        method: "POST",
      });
      const result = await res.json();

      if (res.ok) {
        setData((prev) => prev ? {
          ...prev,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          recommendations: result.recommendations
        } : null);
        toast.success("Risk analysis complete!");
      } else {
        toast.error(result.error || "Failed to analyze risk");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setRiskLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>Add holdings to see analytics</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score <= 3) return "text-green-500";
    if (score <= 6) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* AI Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-500" />
              AI Risk Assessment
            </CardTitle>
            <CardDescription>Portfolio risk and diversification analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.riskScore !== undefined ? (
              <>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Risk Score</span>
                    <span className={`text-2xl font-bold ${getRiskColor(data.riskScore)}`}>
                      {data.riskScore.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${data.riskScore <= 3 ? 'bg-green-500' :
                          data.riskScore <= 6 ? 'bg-yellow-500' :
                            'bg-red-500'
                        }`}
                      style={{ width: `${(data.riskScore / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {data.riskLevel}
                </Badge>
              </>
            ) : (
              <p className="text-sm text-gray-400">
                Click below to generate AI-powered risk analysis
              </p>
            )}

            <Button
              onClick={generateRiskAnalysis}
              disabled={riskLoading}
              className="w-full"
              variant="outline"
            >
              {riskLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  {data.riskScore ? 'Refresh Analysis' : 'Generate Risk Analysis'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              AI Recommendations
            </CardTitle>
            <CardDescription>Smart suggestions for your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recommendations && data.recommendations.length > 0 ? (
              <ul className="space-y-3">
                {data.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 flex-shrink-0">
                      {idx + 1}
                    </Badge>
                    <p className="text-sm text-gray-300 leading-relaxed">{rec}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">
                Generate risk analysis to get personalized recommendations
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              AI Portfolio Insights
            </h2>
            <p className="text-sm text-gray-400 mt-1">Powered by Gemini AI</p>
          </div>
          <Button onClick={generateAIInsights} disabled={aiLoading}>
            {aiLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>

        {aiError ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 p-4 bg-red-950/30 border border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm font-medium">Error generating insights</p>
                  <p className="text-red-300 text-xs mt-1">{aiError}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    Check if GEMINI_API_KEY is set in your .env.local file
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : data.aiInsights ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.aiInsights.split('\n\n').map((section, idx) => {
              const isHeading = section.match(/^[📊⚠️💡🎯]/);

              if (isHeading) {
                const lines = section.split('\n');
                const heading = lines[0];
                const content = lines.slice(1).join('\n').trim();

                let borderColor = "border-gray-800";
                let iconColor = "text-gray-400";
                let bgAccent = "bg-gray-900/50";

                if (heading.includes('📊')) {
                  borderColor = "border-blue-500/30";
                  iconColor = "text-blue-400";
                  bgAccent = "bg-blue-500/5";
                } else if (heading.includes('⚠️')) {
                  borderColor = "border-yellow-500/30";
                  iconColor = "text-yellow-400";
                  bgAccent = "bg-yellow-500/5";
                } else if (heading.includes('💡')) {
                  borderColor = "border-purple-500/30";
                  iconColor = "text-purple-400";
                  bgAccent = "bg-purple-500/5";
                } else if (heading.includes('🎯')) {
                  borderColor = "border-green-500/30";
                  iconColor = "text-green-400";
                  bgAccent = "bg-green-500/5";
                }

                return (
                  <Card key={idx} className={`border-2 ${borderColor} ${bgAccent}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className={`text-base ${iconColor} font-semibold`}>
                        {heading}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-300 space-y-2.5">
                        {content.split('\n').map((line, i) => {
                          const trimmedLine = line.trim();
                          if (!trimmedLine) return null;

                          if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
                            return (
                              <div key={i} className="flex items-start gap-2">
                                <span className={`${iconColor} mt-1 flex-shrink-0`}>•</span>
                                <p className="flex-1 leading-relaxed">{trimmedLine.replace(/^[•\-]\s*/, '')}</p>
                              </div>
                            );
                          }

                          const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
                          if (numberedMatch) {
                            return (
                              <div key={i} className="flex items-start gap-2">
                                <span className={`${iconColor} font-semibold flex-shrink-0`}>
                                  {numberedMatch[1]}.
                                </span>
                                <p className="flex-1 leading-relaxed">{numberedMatch[2]}</p>
                              </div>
                            );
                          }

                          return <p key={i} className="leading-relaxed">{trimmedLine}</p>;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">
                  Click "Generate Insights" to get AI-powered analysis of your portfolio
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {data.sectorAllocation.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sector Allocation</CardTitle>
              <CardDescription>Portfolio distribution by sector</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <defs>
                    <filter id="shadow-sector" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                    </filter>
                  </defs>
                  <Pie
                    data={data.sectorAllocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={120}
                    innerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="sector"
                    animationBegin={0}
                    animationDuration={800}
                    style={{ filter: 'url(#shadow-sector)' }}
                  >
                    {data.sectorAllocation.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(223, 223, 223, 0.95)',
                      border: '1px solid rgba(75, 85, 99, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                    formatter={(value: number, name: string, props: any) => {
                      const percentage = props.payload.percentage;
                      return [
                        `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${percentage.toFixed(1)}%)`,
                        name
                      ];
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value: string, entry: any) => {
                      const percentage = entry.payload?.percentage || 0;
                      return `${value} (${percentage.toFixed(1)}%)`;
                    }}
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '13px',
                    }}
                  />

                  <text
                    x="50%"
                    y="40%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs fill-gray-400"
                  >
                    Sector Split
                  </text>
                  <text
                    x="50%"
                    y="49%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-lg font-bold fill-white"
                  >
                    {data.sectorAllocation.length} Sectors
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Gainers & Losers */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Top gainers and losers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topGainers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-green-500 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Top Gainers
                </h3>
                <div className="space-y-2">
                  {data.topGainers.map((stock) => (
                    <div key={stock.symbol} className="flex justify-between items-center">
                      <span className="text-sm">{stock.symbol}</span>
                      <span className="text-sm text-green-500 font-medium">
                        +{stock.plPercent.toFixed(2)}% (₹{stock.pl.toFixed(0)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.topLosers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-500 mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Top Losers
                </h3>
                <div className="space-y-2">
                  {data.topLosers.map((stock) => (
                    <div key={stock.symbol} className="flex justify-between items-center">
                      <span className="text-sm">{stock.symbol}</span>
                      <span className="text-sm text-red-500 font-medium">
                        {stock.plPercent.toFixed(2)}% (₹{stock.pl.toFixed(0)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
