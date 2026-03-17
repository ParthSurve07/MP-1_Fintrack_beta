import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, TrendingUp, Zap, Lock, LineChart } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg" />
            <span className="text-xl font-bold">FinTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-white text-black hover:bg-gray-200">
                  Get Started
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button className="bg-white text-black hover:bg-gray-200">
                  Dashboard
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-sm text-gray-300">AI-Powered Portfolio Analytics</span>
          </div> */}

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
              Your Portfolio,
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Unify holdings from Angel One and Zerodha. Get intelligent insights powered by Gemini AI.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg h-12 px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg h-12 px-8">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Features Grid - Minimal Design */}
      <div className="max-w-5xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-12">

          {/* Feature 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                <LineChart className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold">Multi-Broker</h3>
            </div>
            <p className="text-gray-500 leading-relaxed">
              Connect Angel One via API and Zerodha via CSV upload. View all holdings unified in one dashboard.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center">
                <Zap className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold">AI Insights</h3>
            </div>
            <p className="text-gray-500 leading-relaxed">
              Gemini-powered risk assessment, sector analysis, and personalized recommendations for your portfolio.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500/20 to-teal-500/5 flex items-center justify-center">
                <Lock className="h-5 w-5 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold">Secure</h3>
            </div>
            <p className="text-gray-500 leading-relaxed">
              Your credentials are never stored. All portfolio data is encrypted and protected with Clerk authentication.
            </p>
          </div>

        </div>
      </div>

      {/* Stats Section - Minimal */}
      <div className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                2
              </div>
              <div className="text-sm text-gray-500 mt-2">Brokers Supported</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                AI
              </div>
              <div className="text-sm text-gray-500 mt-2">Powered Insights</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent">
                Free
              </div>
              <div className="text-sm text-gray-500 mt-2">Always Free</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg" />
              <span className="font-semibold">FinTrack</span>
            </div>
            <p className="text-sm text-gray-500">
              Built for college project • Powered by Gemini AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
