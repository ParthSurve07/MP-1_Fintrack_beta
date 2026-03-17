"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

export default function ZerodhaPage() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/brokers/zerodha/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Successfully uploaded ${data.count} holdings from Zerodha`);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById("csvFile") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        toast.error(data.error || "Failed to upload holdings");
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
          <h1 className="text-3xl font-bold">Zerodha</h1>
          <p className="text-gray-400">Upload your holdings CSV from Zerodha Console</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Holdings CSV</CardTitle>
            <CardDescription>
              Download your holdings from Zerodha Console and upload here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="csvFile">Holdings CSV File</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-400">
                  Go to Zerodha Console → Holdings → Download holdings report (CSV)
                </p>
              </div>

              {file && (
                <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                  <p className="text-sm text-gray-400">
                    Selected: <span className="text-white font-medium">{file.name}</span>
                  </p>
                </div>
              )}

              <Button type="submit" disabled={loading || !file} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Uploading..." : <><Upload className="mr-2 h-4 w-4" /> Upload Holdings</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">How to get your Zerodha holdings CSV?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-400">
            <ol className="list-decimal list-inside space-y-2">
              <li>Login to Zerodha Console</li>
              <li>Go to "Holdings" section</li>
              <li>Click on "Download holdings" or export icon</li>
              <li>Save the CSV file</li>
              <li>Upload it here</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
