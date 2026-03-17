"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type Holding = {
  id: number;
  broker: string;
  symbol: string;
  companyName: string | null;
  quantity: number;
  avgPrice: string;
  currentPrice: string | null;
  sector: string | null;
};

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "angelone" | "zerodha">("all");

  useEffect(() => {
    fetchHoldings();
  }, []);

  const fetchHoldings = async () => {
    try {
      const res = await fetch("/api/portfolio/holdings");
      const data = await res.json();

      if (res.ok) {
        setHoldings(data.holdings);
      } else {
        toast.error("Failed to fetch holdings");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const clearBrokerHoldings = async (broker: string) => {
    const brokerName = broker === "all" ? "all" : broker === "angelone" ? "Angel One" : "Zerodha";

    if (!confirm(`Delete all ${brokerName} holdings? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/portfolio/clear-holdings?broker=${broker}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`${brokerName} holdings cleared`);
        fetchHoldings(); // Refresh the list
      } else {
        toast.error("Failed to clear holdings");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const filteredHoldings = holdings.filter((h) =>
    filter === "all" ? true : h.broker === filter
  );

  const calculatePL = (avgPrice: string, currentPrice: string | null, quantity: number) => {
    if (!currentPrice) return { value: 0, percentage: 0 };
    const pl = (parseFloat(currentPrice) - parseFloat(avgPrice)) * quantity;
    const plPercent = ((parseFloat(currentPrice) - parseFloat(avgPrice)) / parseFloat(avgPrice)) * 100;
    return { value: pl, percentage: plPercent };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Holdings</h1>
          <p className="text-gray-400">Your portfolio holdings across all brokers</p>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearBrokerHoldings("angelone")}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Angel One
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearBrokerHoldings("zerodha")}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Zerodha
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => clearBrokerHoldings("all")}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "angelone" ? "default" : "outline"}
            onClick={() => setFilter("angelone")}
          >
            Angel One
          </Button>
          <Button
            variant={filter === "zerodha" ? "default" : "outline"}
            onClick={() => setFilter("zerodha")}
          >
            Zerodha
          </Button>
        </div>
      </div>

      {filteredHoldings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Holdings Found</CardTitle>
            <CardDescription>
              Add holdings from Angel One or Zerodha to see them here
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="bg-gray-900 border-b border-gray-800">
                    <TableHead className="text-gray-300 font-medium">Symbol</TableHead>
                    <TableHead className="text-gray-300 font-medium">Company</TableHead>
                    <TableHead className="text-gray-300 font-medium">Broker</TableHead>
                    <TableHead className="text-right text-gray-300 font-medium">Quantity</TableHead>
                    <TableHead className="text-right text-gray-300 font-medium">Avg Price</TableHead>
                    <TableHead className="text-right text-gray-300 font-medium">Current Price</TableHead>
                    <TableHead className="text-right text-gray-300 font-medium">Investment</TableHead>
                    <TableHead className="text-right text-gray-300 font-medium">Current Value</TableHead>
                    <TableHead className="text-right text-gray-300 font-medium">P&L</TableHead>
                    <TableHead className="text-right text-gray-300 font-medium">P&L %</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredHoldings.map((holding) => {
                    const pl = calculatePL(holding.avgPrice, holding.currentPrice, holding.quantity);
                    const invested = parseFloat(holding.avgPrice) * holding.quantity;
                    const currentVal = holding.currentPrice
                      ? parseFloat(holding.currentPrice) * holding.quantity
                      : invested;

                    return (
                      <TableRow
                        key={holding.id}
                        className="border-b border-gray-800 hover:bg-gray-900"
                      >
                        <TableCell className="text-white font-semibold">
                          {holding.symbol}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {holding.companyName || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700"
                          >
                            {holding.broker === "angelone" ? "Angel One" : "Zerodha"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right text-gray-300 font-mono">
                          {holding.quantity}
                        </TableCell>

                        <TableCell className="text-right text-gray-300 font-mono">
                          ₹{parseFloat(holding.avgPrice).toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right text-gray-300 font-mono">
                          {holding.currentPrice
                            ? `₹${parseFloat(holding.currentPrice).toFixed(2)}`
                            : "-"}
                        </TableCell>

                        <TableCell className="text-right text-gray-400 font-mono">
                          ₹{invested.toFixed(0)}
                        </TableCell>

                        <TableCell className="text-right text-gray-300 font-mono">
                          ₹{currentVal.toFixed(0)}
                        </TableCell>

                        <TableCell
                          className={`text-right font-semibold font-mono ${pl.value >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                        >
                          {holding.currentPrice
                            ? `${pl.value >= 0 ? "+" : ""}₹${pl.value.toFixed(0)}`
                            : "-"}
                        </TableCell>

                        <TableCell className="text-right font-mono">
                          {holding.currentPrice ? (
                            <Badge
                              className={`font-semibold border ${pl.percentage >= 0
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                                }`}
                            >
                              {pl.percentage >= 0 ? "↑" : "↓"} {Math.abs(pl.percentage).toFixed(2)}%
                            </Badge>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
