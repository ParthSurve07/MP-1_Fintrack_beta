"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Wallet, Layers } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

type DashboardStats = {
  totalInvested: number;
  currentValue: number;
  totalPL: number;
  totalPLPercent: number;
  holdingsCount: number;
  topHoldings: { symbol: string; value: number; percentage: number }[];
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/portfolio/dashboard");
      const data = await res.json();

      if (res.ok) {
        setStats(data);
      } else {
        toast.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>Add holdings from brokers to see your dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Invested</CardTitle>
            <Wallet className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-gray-400 mt-1">Initial capital deployed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Current Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-gray-400 mt-1">Present portfolio value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Profit / Loss</CardTitle>
            {stats.totalPL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalPL >= 0 ? "text-green-500" : "text-red-500"}`}>
              {stats.totalPL >= 0 ? "+" : ""}₹{stats.totalPL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className={`text-xs mt-1 ${stats.totalPL >= 0 ? "text-green-500" : "text-red-500"}`}>
              {stats.totalPL >= 0 ? "+" : ""}{stats.totalPLPercent.toFixed(2)}% all time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Holdings</CardTitle>
            <Layers className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.holdingsCount}</div>
            <p className="text-xs text-gray-400 mt-1">Unique stocks</p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Distribution */}
      {stats.topHoldings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Holdings Distribution</CardTitle>
            <CardDescription>Top holdings by portfolio value</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <defs>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                  </filter>
                </defs>
                <Pie
                  data={stats.topHoldings}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={120}
                  innerRadius={60}  
                  paddingAngle={2}  
                  dataKey="value"
                  nameKey="symbol"
                  animationBegin={0}
                  animationDuration={800}
                  style={{ filter: 'url(#shadow)' }}
                >
                  {stats.topHoldings.map((entry, index) => (
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
                  formatter={(value: number, name: string) => [
                    `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                    name
                  ]}
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
                  Total Value
                </text>
                <text
                  x="50%"
                  y="49%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xl font-bold fill-white"
                >
                  ₹{stats.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
