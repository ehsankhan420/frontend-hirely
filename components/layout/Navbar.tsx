"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { createCheckoutSession } from "@/lib/api/payments";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@/types";
import { Briefcase, Bookmark, Settings, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface NavbarProps {
  user?: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const { checkout_url } = await createCheckoutSession();
      window.location.href = checkout_url;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail;
      toast.error(msg || "Failed to start checkout");
      setCheckoutLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  const navLinks = [
    { href: "/jobs", label: "Find Jobs" },
    { href: "/my-jobs", label: "My Jobs" },
  ];

  if (user?.role === "admin") {
    navLinks.push({ href: "/admin", label: "Admin" });
  }

  return (
    <header 
      className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all duration-300"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4 lg:px-8">
        
        {/* Logo Section */}
        <Link href={user ? "/jobs" : "/"} className="flex items-center gap-3 overflow-hidden cursor-pointer group">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] shadow-sm"
            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", boxShadow: "0 6px 16px rgba(59,130,246,0.3)" }}
          >
            <Briefcase className="h-5 w-5 text-white" />
          </motion.div>
          <span className="text-[22px] font-extrabold tracking-tight text-slate-800 leading-tight">Hirely</span>
        </Link>

        {/* Desktop Nav Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href !== "/jobs" && pathname.startsWith(link.href) && link.href !== "/");
              return (
                <Link key={link.href} href={link.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-4 py-2.5 rounded-[12px] font-bold text-[14px] transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                      active
                        ? "bg-blue-50 shadow-inner border border-blue-100/50 text-blue-700" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
                    }`}
                  >
                    {link.label}
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Section (User Actions) */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              
              {/* Badges & Upgrade Button */}
              <div className="hidden sm:flex items-center gap-3">
                {user.role === "free" && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold text-[13px] shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                  >
                    {checkoutLoading ? "Redirecting..." : "Upgrade — £6.99/mo"}
                  </motion.button>
                )}
                {user.role === "premium" && (
                  <div className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100/50 shadow-inner rounded-[10px] font-bold text-[12px] uppercase tracking-wider">
                    Premium
                  </div>
                )}
                {user.role === "admin" && (
                  <div className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-100/50 shadow-inner rounded-[10px] font-bold text-[12px] uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </div>
                )}
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block mx-1" />

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="focus:outline-none rounded-full"
                  >
                    <Avatar className="h-10 w-10 shrink-0 shadow-sm border border-slate-200/60 bg-white hover:shadow-md transition-all">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-blue-50 text-blue-700 text-sm font-bold leading-none">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-[16px] p-2 border-slate-200 shadow-xl" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <div className="px-3 py-2.5 mb-1 bg-slate-50 rounded-[10px] border border-slate-100">
                    <p className="text-[14px] font-bold text-slate-800 leading-tight truncate">{user.name || "User"}</p>
                    <p className="text-[12px] font-semibold text-slate-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  
                  <DropdownMenuItem asChild className="rounded-[10px] cursor-pointer focus:bg-blue-50 focus:text-blue-700 py-2.5 mt-1 font-semibold text-slate-600 text-[13px]">
                    <Link href="/profile" className="flex items-center">
                      <Settings className="mr-2.5 h-4 w-4" />
                      Profile & CV
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild className="rounded-[10px] cursor-pointer focus:bg-blue-50 focus:text-blue-700 py-2.5 font-semibold text-slate-600 text-[13px]">
                    <Link href="/my-jobs" className="flex items-center">
                      <Bookmark className="mr-2.5 h-4 w-4" />
                      My Jobs
                    </Link>
                  </DropdownMenuItem>
                  
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild className="rounded-[10px] cursor-pointer focus:bg-purple-50 focus:text-purple-700 py-2.5 font-semibold text-slate-600 text-[13px]">
                      <Link href="/admin" className="flex items-center">
                        <ShieldCheck className="mr-2.5 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator className="my-1.5" />
                  
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={loading}
                    className="rounded-[10px] cursor-pointer focus:bg-red-50 focus:text-red-600 py-2.5 font-bold text-red-500 text-[13px]"
                  >
                    <LogOut className="mr-2.5 h-4 w-4" strokeWidth={2.5} />
                    {loading ? "Signing out..." : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          ) : (
            /* Unauthenticated State */
            <div className="flex items-center gap-3">
              <Link href="/login">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-[12px] text-[14px] transition-colors"
                >
                  Sign in
                </motion.button>
              </Link>
              <Link href="/register">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold text-[14px] shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all flex items-center"
                >
                  Get started
                </motion.button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
