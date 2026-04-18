"use client";

import { useState } from "react";
import { Lock, Crown } from "lucide-react";
import { createCheckoutSession } from "@/lib/api/payments";
import { toast } from "sonner";

interface FreemiumGateProps {
  totalCount: number;
  hiddenCount: number;
}

export default function FreemiumGate({ totalCount, hiddenCount }: FreemiumGateProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { checkout_url } = await createCheckoutSession();
      window.location.href = checkout_url;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail;
      toast.error(msg || "Failed to start checkout");
      setLoading(false);
    }
  };

  return (
    <div className="relative mt-8">
      {/* Blurred ghost cards */}
      <div className="space-y-4 select-none pointer-events-none opacity-40 blur-[2px]">
        {Array.from({ length: Math.min(hiddenCount, 3) }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-6"
          >
            <div className="flex gap-3 mb-4">
              <div className="h-6 w-24 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-6 w-32 rounded-full bg-slate-200 animate-pulse" />
            </div>
            <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse mb-3" />
            <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-8 text-center overlow-hidden">
          
          <div className="relative z-10">
            <div className="flex justify-center mb-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100">
                <Lock className="h-8 w-8" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Unlock {hiddenCount} more jobs
            </h3>
            <p className="text-slate-600 mb-8 max-w-sm mx-auto">
              You&apos;ve seen the top 5 of{" "}
              <span className="font-semibold text-slate-900">{totalCount} matching jobs</span>.
              Upgrade to Premium to view the rest and get full AI match scores.
            </p>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full sm:w-auto mx-auto flex items-center justify-center gap-2 py-3.5 px-8 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60"
            >
              <Crown className="h-5 w-5" />
              {loading ? "Redirecting…" : "Upgrade to Premium — £6.99/mo"}
            </button>

            <p className="text-sm text-slate-500 mt-4">
              Cancel anytime · Instant access · All verified sponsors
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
