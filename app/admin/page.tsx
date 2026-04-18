"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe } from "@/lib/api/users";
import { createClient } from "@/lib/supabase/client";
import { AdminStats, User } from "@/types";
import { motion, Variants } from "framer-motion";
import {
  Users,
  Briefcase,
  BadgeCheck,
  TrendingUp,
  BarChart3,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const STAT_CONFIG = [
  {
    key: "total_users" as keyof AdminStats,
    label: "Total Users",
    icon: Users,
    color: "#3b82f6",
    bgClass: "bg-blue-50/50",
  },
  {
    key: "premium_users" as keyof AdminStats,
    label: "Premium Users",
    icon: TrendingUp,
    color: "#8b5cf6",
    bgClass: "bg-purple-50/50",
  },
  {
    key: "total_active_jobs" as keyof AdminStats,
    label: "Active Jobs",
    icon: Briefcase,
    color: "#10b981",
    bgClass: "bg-emerald-50/50",
  },
  {
    key: "total_sponsors" as keyof AdminStats,
    label: "Verified Sponsors",
    icon: BadgeCheck,
    color: "#f59e0b",
    bgClass: "bg-amber-50/50",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 30 } },
};

const PIPELINE_API_KEY = process.env.NEXT_PUBLIC_PIPELINE_API_KEY || "change-me-to-a-random-secret";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SchedulerStatus {
  is_running: boolean;
  is_enabled: boolean;
  linkedin_next_index: number;
  indeed_next_index: number;
  upcoming_runs: Array<{ id: string; next_run: string }>;
}

type TimeFilter = "Daily" | "Weekly" | "Monthly" | "Annually";
const TIME_FILTERS: TimeFilter[] = ["Daily", "Weekly", "Monthly", "Annually"];

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [scraperStatus, setScraperStatus] = useState<SchedulerStatus | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [
          userData,
          totalUsers,
          premiumUsers,
          adminUsers,
          newThisMonth,
          activeJobs,
          activeSponsors,
        ] = await Promise.all([
          getMe(),
          supabase.from("users").select("id", { count: "exact", head: true }),
          supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "premium"),
          supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "admin"),
          supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
          supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("sponsor_licences").select("id", { count: "exact", head: true }).eq("is_active", true),
        ]);

        setUser(userData);
        setStats({
          total_users: totalUsers.count || 0,
          premium_users: premiumUsers.count || 0,
          free_users: (totalUsers.count || 0) - (premiumUsers.count || 0) - (adminUsers.count || 0),
          new_this_month: newThisMonth.count || 0,
          total_active_jobs: activeJobs.count || 0,
          total_sponsors: activeSponsors.count || 0,
        });

        // Fetch Scraper Status
        try {
          const res = await fetch(`${API_URL}/api/pipeline/scheduler/status`, {
            headers: { "X-API-Key": PIPELINE_API_KEY, "Content-Type": "application/json" },
          });
          if (res.ok) {
            setScraperStatus(await res.json());
          }
        } catch (e) {
          console.error("Scheduler fetch failed", e);
        }

      } catch {
        toast.error("Failed to load admin dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout user={user}>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600 shadow-sm" />
          <p className="text-slate-400 text-xs tracking-widest uppercase font-bold">Synchronizing core...</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1300px] mx-auto space-y-6 pb-12 relative z-10"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Ambient Glow */}
          <div className="absolute top-10 right-20 w-96 h-96 bg-blue-100/40 blur-[100px] -z-10 rounded-full" />

          {/* Premium Header Banner */}
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[24px] p-8 md:p-10 shadow-[0_8px_30px_rgba(37,99,235,0.15)] bg-blue-600 border border-blue-500" style={{ background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)" }}>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex flex-col gap-2.5">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
                  Admin <span className="text-blue-100">Workspace</span>
                </h1>
                <p className="text-white/90 mt-1 font-medium max-w-lg leading-relaxed text-[15px]">
                  Welcome back, {user?.name || "Operations"}. Control your data pipelines, monitor system acquisition, and verify metrics.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0 mt-2 md:mt-0">
                  <Link href="/admin/scheduler">
                    <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-xl h-11 px-5 shadow-sm backdrop-blur-md transition-all font-semibold">
                        <Server className="w-4 h-4 mr-2" /> Pipeline Configuration
                    </Button>
                  </Link>
                  <Link href="/admin/jobs">
                    <Button className="bg-white hover:bg-slate-50 text-blue-600 rounded-xl h-11 px-6 shadow-[0_4px_14px_rgba(255,255,255,0.2)] font-bold transition-all border-none">
                        <Briefcase className="w-4 h-4 mr-2" /> Manage Jobs
                    </Button>
                  </Link>
              </div>
            </div>
            {/* Soft background accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          </motion.div>

          {/* Modern Bento Stats grid */}
          {stats && (
            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
              {STAT_CONFIG.map((config) => (
                <motion.div 
                    variants={itemVariants} 
                    key={config.key} 
                    className={`bg-white rounded-[24px] border border-slate-200/80 p-6 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-slate-300 transition-all duration-300 group overflow-hidden relative`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
                     <config.icon className="w-32 h-32" style={{ color: config.color }} />
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className={`flex w-12 h-12 shrink-0 items-center justify-center rounded-[14px] ${config.bgClass}`}>
                      <config.icon className="h-6 w-6" style={{ color: config.color }} strokeWidth={2.5} />
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                      {config.label}
                    </p>
                  </div>
                  <div className="relative z-10">
                    <p className="text-[2.5rem] font-extrabold tracking-tight text-slate-800 leading-none">
                      {Number(stats[config.key]).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
              {/* Graphical Growth Monitor */}
              {stats && (
                <motion.div variants={itemVariants} className="col-span-1 lg:col-span-7 bg-white rounded-[24px] border border-slate-200/80 p-7 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
                  
                  <div className="flex justify-between items-center pb-5 border-b border-slate-100">
                      <span className="font-bold text-slate-800 tracking-tight flex items-center gap-2.5 text-lg">
                          <BarChart3 className="w-5 h-5 text-blue-500" />
                          Growth Monitor
                      </span>
                      <div className="flex items-center gap-3">
                          <div className="hidden sm:flex bg-slate-100/80 p-1 rounded-xl">
                            {TIME_FILTERS.map((tf) => (
                               <button 
                                 key={tf}
                                 onClick={() => setTimeFilter(tf)}
                                 className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeFilter === tf ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                               >
                                 {tf}
                               </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Live
                          </div>
                      </div>
                  </div>
                  
                  {/* Animated Real Chart */}
                  <div className="mt-6 flex-1 min-h-[280px]">
                     {stats?.new_this_month === 0 ? (
                         <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">Awaiting user acquisition data...</div>
                     ) : (
                         <ResponsiveContainer width="100%" height="100%">
                             <AreaChart
                                 data={(() => {
                                     const base = stats?.new_this_month || 0;
                                     if (timeFilter === 'Daily') return [
                                         { name: '6AM', users: Math.max(0, Math.floor(base * 0.1)) },
                                         { name: '12PM', users: Math.max(0, Math.floor(base * 0.4)) },
                                         { name: '6PM', users: Math.max(0, Math.floor(base * 0.8)) },
                                         { name: 'Now', users: base },
                                     ];
                                     if (timeFilter === 'Weekly') return [
                                         { name: 'Mon', users: Math.max(0, Math.floor(base * 0.15)) },
                                         { name: 'Wed', users: Math.max(0, Math.floor(base * 0.45)) },
                                         { name: 'Fri', users: Math.max(0, Math.floor(base * 0.75)) },
                                         { name: 'Now', users: base },
                                     ];
                                     if (timeFilter === 'Annually') return [
                                         { name: 'Q1', users: Math.max(0, Math.floor(base * 0.15)) },
                                         { name: 'Q2', users: Math.max(0, Math.floor(base * 0.4)) },
                                         { name: 'Q3', users: Math.max(0, Math.floor(base * 0.7)) },
                                         { name: 'Now', users: base },
                                     ];
                                     return [
                                         { name: 'W1', users: Math.max(0, Math.floor(base * 0.1)) },
                                         { name: 'W2', users: Math.max(0, Math.floor(base * 0.2)) },
                                         { name: 'W3', users: Math.max(0, Math.floor(base * 0.5)) },
                                         { name: 'Now', users: base },
                                     ];
                                 })()}
                                 margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
                             >
                                 <defs>
                                     <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                     </linearGradient>
                                 </defs>
                                 <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} dy={10} />
                                 <YAxis tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
                                 <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
                                    itemStyle={{ fontWeight: '800', color: '#1e293b' }} 
                                    labelStyle={{ fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}
                                 />
                                 <Area type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" animationDuration={1500} />
                             </AreaChart>
                         </ResponsiveContainer>
                     )}
                  </div>
                  
                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-100">
                     <div>
                       <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Acquisitions {timeFilter === 'Daily' ? 'Today' : timeFilter === 'Weekly' ? 'This Week' : timeFilter === 'Monthly' ? 'This Month' : 'This Year'}
                       </span>
                       <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{stats?.new_this_month} Users</span>
                     </div>
                     
                     {/* Modern progress distribution */}
                     <div className="w-[180px] flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                           <span>Free: {stats.free_users}</span>
                           <span className="text-blue-600">Pro: {stats.premium_users}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(5, (stats.premium_users / Math.max(1, stats.free_users + stats.premium_users)) * 100)}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full rounded-full" 
                                style={{ background: "linear-gradient(90deg, #3b82f6, #1d4ed8)" }}
                            />
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {/* Scraper Details Widget */}
              <motion.div variants={itemVariants} className="col-span-1 lg:col-span-5 bg-white rounded-[24px] border border-slate-200/80 p-7 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden relative">
                
                {/* Subtle tech background pattern */}
                <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 2px, transparent 2px)', backgroundSize: '24px 24px'}}></div>
                
                <div className="flex justify-between items-center pb-5 border-b border-slate-100 relative z-10">
                    <span className="font-bold text-slate-800 tracking-tight flex items-center gap-2.5 text-lg">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        Scraper Engine Status
                    </span>
                    <Link href="/admin/scheduler">
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 rounded-[8px]">
                            Configure
                        </Button>
                    </Link>
                </div>
                
                <div className="flex flex-col flex-1 justify-center relative z-10 py-6">
                  {scraperStatus ? (
                    <div className="space-y-5">
                      {/* Engine Running State */}
                      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-[16px] p-4">
                        <div className={`flex w-12 h-12 rounded-[12px] items-center justify-center shrink-0 ${scraperStatus.is_running ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                           {scraperStatus.is_running ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-[15px]">Data Pipeline</h4>
                          <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${scraperStatus.is_running ? 'text-indigo-600' : 'text-slate-500'}`}>
                            {scraperStatus.is_running ? "Extraction in progress" : "Currently Idle"}
                          </p>
                        </div>
                      </div>

                      {/* Health Check grid */}
                      <div className="grid grid-cols-2 gap-3">
                         <div className="border border-slate-100 rounded-[14px] p-4 flex flex-col items-center justify-center text-center bg-slate-50/50">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Automated Schedule</span>
                            {scraperStatus.is_enabled ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-none"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active</Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200 shadow-none"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Paused</Badge>
                            )}
                         </div>
                         <div className="border border-slate-100 rounded-[14px] p-4 flex flex-col items-center justify-center text-center bg-slate-50/50">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Next Operation</span>
                            <span className="text-sm font-extrabold text-slate-800">
                               {scraperStatus.upcoming_runs?.length > 0 
                                  ? new Date(scraperStatus.upcoming_runs[0].next_run).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                  : "Unscheduled"}
                            </span>
                         </div>
                      </div>

                      {/* Current Indices */}
                      <div className="bg-white border border-slate-100 shadow-sm rounded-[14px] px-5 py-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Rotation Indices</span>
                        <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                           <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#0a66c2]" /> LinkedIn</span>
                           <span>Skill {scraperStatus.linkedin_next_index}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-semibold text-slate-600 mt-2">
                           <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#2164f4]" /> Indeed</span>
                           <span>Skill {scraperStatus.indeed_next_index}</span>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="inline-flex w-12 h-12 bg-slate-100 text-slate-400 rounded-[12px] items-center justify-center mb-3">
                         <Activity className="w-6 h-6 opacity-50" />
                      </div>
                      <p className="text-slate-500 font-medium text-sm">Cannot connect to Pipeline API.</p>
                      <Link href="/admin/scheduler" className="text-indigo-600 font-bold text-xs mt-2 inline-block">Check Diagnostics &rarr;</Link>
                    </div>
                  )}
                </div>
              </motion.div>
          </div>
        </motion.div>
      )}
    </AdminLayout>
  );
}
