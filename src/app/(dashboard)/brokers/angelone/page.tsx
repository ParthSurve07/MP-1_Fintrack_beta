"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AngelOnePage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientCode: "",
    password: "",
    totpSecret: "",
  });

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientCode || !formData.password || !formData.totpSecret) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/brokers/angelone/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Successfully synced ${data.count} holdings from Angel One`);
        setFormData({ clientCode: "", password: "", totpSecret: "" });
      } else {
        toast.error(data.error || "Failed to sync holdings");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Angel One</h1>
          <p className="text-gray-400">Sync your holdings from Angel One</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connect Angel One Account</CardTitle>
            <CardDescription>
              Enter your Angel One credentials to fetch your current holdings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSync} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="clientCode">Client Code</Label>
                <Input
                  id="clientCode"
                  type="text"
                  placeholder="Your Client Code"
                  value={formData.clientCode}
                  onChange={(e) => setFormData({ ...formData, clientCode: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totpSecret">TOTP Secret</Label>
                <Input
                  id="totpSecret"
                  type="text"
                  placeholder="Your TOTP Secret Key"
                  value={formData.totpSecret}
                  onChange={(e) => setFormData({ ...formData, totpSecret: e.target.value })}
                />
                <p className="text-xs text-gray-400">
                  Get this from Angel One app settings → Enable TOTP
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Syncing..." : "Sync Holdings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
