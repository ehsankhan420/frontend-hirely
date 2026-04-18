"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMe } from "@/lib/api/users";
import { Briefcase, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const nextPath = searchParams.get("next");
  const safeNextPath =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : null;
  const registerHref = nextPath
    ? `/register?next=${encodeURIComponent(nextPath)}`
    : "/register";

  const resolvePostLoginPath = async () => {
    if (safeNextPath) {
      return safeNextPath;
    }

    try {
      const user = await getMe();
      return user.role === "admin" ? "/admin" : "/upload-cv";
    } catch {
      return "/upload-cv";
    }
  };

  useEffect(() => {
    if (searchParams.get("error") === "auth_callback_failed") {
      toast.error("Google sign-in failed. Please try again.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const destination = await resolvePostLoginPath();
    router.push(destination);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    if (safeNextPath) {
      redirectTo.searchParams.set("next", safeNextPath);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2d5c 100%)" }}>

        {/* Ambient blobs */}
        <div style={{
          position: "absolute", width: 500, height: 500,
          background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
          borderRadius: "50%", top: -100, right: -100, filter: "blur(60px)"
        }} />
        <div style={{
          position: "absolute", width: 350, height: 350,
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          borderRadius: "50%", bottom: -50, left: -50, filter: "blur(60px)"
        }} />

        {/* Top — logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(59,130,246,0.4)"
          }}>
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Hirely</span>
        </div>

        {/* Middle — headline */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-white/70"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            100% visa-sponsor verified
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Every job here will sponsor your UK visa.
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Stop wasting applications on employers who can&apos;t help you.
            Hirely only shows jobs from Home-Office-verified sponsors.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { value: "50k+", label: "Verified sponsors" },
              { value: "100%", label: "Sponsorship guaranteed" },
              { value: "Free", label: "To get started" },
            ].map((s) => (
              <div key={s.label} className="text-center"
                style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-sm text-white/30">
          © {new Date().getFullYear()} Hirely · UK Visa Sponsorship Platform
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-800">Hirely</span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1.5">Welcome back</h2>
            <p className="text-slate-500 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: "white",
              border: "1.5px solid #e2e8f0",
              color: "#374151",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = "#cbd5e1")}
            onMouseOut={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all duration-200"
                style={{
                  background: "white", border: "1.5px solid #e2e8f0", color: "#1e293b",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none transition-all duration-200 pr-10"
                  style={{
                    background: "white", border: "1.5px solid #e2e8f0", color: "#1e293b",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{
                background: loading ? "#93c5fd" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
              }}
            >
              {loading ? "Signing in..." : (
                <>Sign in <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href={registerHref} className="text-blue-600 hover:text-blue-700 font-semibold">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
