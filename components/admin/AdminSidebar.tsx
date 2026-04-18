"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";
import {
  LayoutDashboard,
  Briefcase,
  BadgeCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminSidebarProps {
  user: User | null;
}

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/jobs",
    label: "Jobs",
    icon: Briefcase,
    exact: false,
  },
  {
    href: "/admin/sponsors",
    label: "Sponsors",
    icon: BadgeCheck,
    exact: false,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    exact: false,
  },
  {
    href: "/admin/scheduler",
    label: "Scheduler",
    icon: Clock,
    exact: false,
  },
];

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href) && pathname !== "/admin";
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "AD";

  const renderSidebarContent = (mobile = false) => (
    <div
      className="flex flex-col h-full bg-white border-r border-slate-200/80 shadow-md shadow-slate-200/20 overflow-hidden"
      style={{ width: mobile ? 300 : collapsed ? 84 : 300, fontFamily: "'Inter', sans-serif" }}
    >
      <div className={`flex items-center justify-between ${collapsed && !mobile ? "px-0 justify-center py-4" : "px-7 py-8"}`} style={{ minHeight: collapsed && !mobile ? "80px" : "100px" }}>
        <AnimatePresence>
          {(!collapsed || mobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-4 overflow-hidden cursor-pointer"
            >
              <div 
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] shadow-sm transform transition-transform hover:scale-105"
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", boxShadow: "0 6px 16px rgba(59,130,246,0.3)" }}
              >
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div className="overflow-hidden whitespace-nowrap">
                <p className="text-2xl font-extrabold tracking-tight text-slate-800 leading-tight">Hirely</p>
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Workspace</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && !mobile && (
          <div className="w-full flex justify-center py-2 h-[80px] items-center">
            <div 
              className="flex shrink-0 h-12 w-12 items-center justify-center rounded-[14px] shadow-sm cursor-pointer transform transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", boxShadow: "0 6px 16px rgba(59,130,246,0.3)" }}
            >
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        )}

        {mobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="text-slate-400 hover:text-slate-800 transition-colors ml-auto p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          (!collapsed) && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto text-slate-400 hover:text-slate-800 transition-all p-1.5 rounded-lg hover:bg-slate-100 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      <nav className={`flex-1 px-4 overflow-x-hidden overflow-y-auto no-scrollbar ${collapsed && !mobile ? "pt-2 pb-2 space-y-2" : "pt-4 pb-6 space-y-4"}`}>
        <style dangerouslySetInnerHTML={{__html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
        {/* If completely collapsed we can show a right arrow button above the nav items instead */}
        {collapsed && !mobile && (
          <div className="flex justify-center mb-4 w-full mt-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex h-10 w-10 items-center justify-center text-slate-400 hover:text-blue-600 transition-all rounded-[12px] hover:bg-slate-50 shadow-sm border border-slate-200"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block w-full">
              <div
                className={`relative flex items-center gap-4 ${collapsed && !mobile ? "justify-center px-0 py-2.5" : "px-4 py-3.5"} rounded-[14px] cursor-pointer transition-all duration-200 group ${
                  active
                    ? "bg-blue-50 shadow-inner border border-blue-100/50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div
                  className={`relative flex shrink-0 items-center justify-center transition-colors ${
                    active
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-slate-700"
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                </div>

                {(!collapsed || mobile) && (
                  <span
                    className={`text-[15px] font-bold whitespace-nowrap overflow-hidden transition-all ${
                      active ? "text-blue-700" : "text-slate-600 group-hover:text-slate-800 translate-x-0"
                    }`}
                  >
                    {item.label}
                  </span>
                )}

                {collapsed && !mobile && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-[12px] font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-md translate-x-[-5px] group-hover:translate-x-0">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={`border-t border-slate-100 bg-slate-50/50 ${collapsed && !mobile ? "p-3 pb-3" : "p-6 pb-8"}`}>
        {(!collapsed || mobile) ? (
          <div className="flex items-center gap-4 px-3 py-4 rounded-[16px] bg-white border border-slate-200/60 shadow-sm transition-colors cursor-pointer hover:border-slate-300">
            <Avatar className="h-12 w-12 shrink-0 shadow-sm border border-slate-200/60 bg-white">
              <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-blue-50 text-blue-700 text-sm font-bold leading-none">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden flex-1">
              <p className="text-[14px] font-bold text-slate-800 truncate leading-tight">
                {user?.name || "Operations"}
              </p>
              <p className="text-[12px] font-semibold text-slate-500 truncate mt-1">
                {user?.email || "admin@hirely.com"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center shrink-0 w-full mb-2">
            <Avatar className="h-10 w-10 shrink-0 shadow-sm border border-slate-200/60 bg-white cursor-pointer hover:shadow-md transition-shadow">
              <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-blue-50 text-blue-700 text-sm font-bold leading-none">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className={`flex items-center justify-center gap-3 w-full rounded-[14px] font-bold transition-all duration-200 group overflow-hidden ${
            collapsed && !mobile ? "py-2.5 text-[12px] bg-transparent text-slate-400 hover:text-red-500 hover:bg-red-50" : "py-3.5 text-[14px] bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-800 shadow-sm mt-4"
          }`}
        >
          <LogOut className={`h-5 w-5 shrink-0 transition-transform ${collapsed ? "" : "group-hover:-translate-x-0.5 text-slate-400 group-hover:text-slate-600"}`} strokeWidth={2.5} />
          {(!collapsed || mobile) && (
             <span className="whitespace-nowrap">{signingOut ? "Logging off..." : "Log off"}</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 84 : 300 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="hidden md:flex flex-col shrink-0 relative z-20 h-screen sticky top-0 bg-white"
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        {renderSidebarContent(false)}
      </motion.aside>

      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 shadow-sm border border-slate-200 hover:bg-white transition-all focus:outline-none"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 overflow-hidden shadow-2xl bg-slate-50"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
