"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMe } from "@/lib/api/users";
import { User } from "@/types";
import {
  Clock,
  Settings,
  Activity,
  CalendarDays,
  PlayCircle,
  StopCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { motion, Variants } from "framer-motion";
import AdminLayout from "@/components/admin/AdminLayout";

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

// Ensure this matches backend expected config
interface SchedulerConfig {
  enabled: boolean;
  schedule_windows_start: string[];
  duration_seconds: number;
  max_jobs_per_skill: number;
  enabled_sources: string[];
  sleep_between_jobs_min: number;
  sleep_between_jobs_max: number;
  sleep_between_skills_min: number;
  sleep_between_skills_max: number;
  log_retention_days: number;
  proxies: string[];
}

interface SchedulerStatus {
  is_running: boolean;
  is_enabled: boolean;
  linkedin_next_index: number;
  indeed_next_index: number;
  upcoming_runs: Array<{ id: string; next_run: string }>;
  history: Array<{
    start: string;
    end: string;
    duration: string;
    results: {
      linkedin_scraped?: number;
      indeed_scraped?: number;
      ingestion?: string;
    };
    status: string;
    sources?: string[];
    keywords?: string[];
  }>;
}

const PIPELINE_API_KEY = process.env.NEXT_PUBLIC_PIPELINE_API_KEY || "change-me-to-a-random-secret";
const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_URL = configuredApiUrl || (isLocalHost ? "http://localhost:8000" : "");

export default function AdminSchedulerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [manualKeywords, setManualKeywords] = useState("");
  const [manualSources, setManualSources] = useState<string[]>(["linkedin", "indeed"]);

  const [config, setConfig] = useState<SchedulerConfig | null>(null);
  const [status, setStatus] = useState<SchedulerStatus | null>(null);

  const fetchData = async () => {
    if (!API_URL) {
      toast.error("Backend API URL is not configured. Set NEXT_PUBLIC_API_URL in Netlify.");
      return;
    }

    try {
      const headers = { "X-API-Key": PIPELINE_API_KEY, "Content-Type": "application/json" };
      
      const [configRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/api/pipeline/scheduler/config`, { headers }),
        fetch(`${API_URL}/api/pipeline/scheduler/status`, { headers })
      ]);

      if (configRes.ok && statusRes.ok) {
        setConfig(await configRes.json());
        setStatus(await statusRes.json());
      } else {
        toast.error("Failed to fetch scheduler data. Check API key.");
      }
    } catch {
      toast.error("Error communicating with backend.");
    }
  };

  useEffect(() => {
    getMe().then(u => {
      setUser(u);
      fetchData().finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  const handleSaveConfig = async () => {
    if (!config) return;
    if (!API_URL) {
      toast.error("Backend API URL is not configured.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pipeline/scheduler/config`, {
        method: "PUT",
        headers: { "X-API-Key": PIPELINE_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        toast.success("Scheduler configuration saved");
        await fetchData();
      } else {
        toast.error("Failed to save configuration");
      }
    } catch {
      toast.error("Error communicating with backend");
    } finally {
      setSaving(false);
    }
  };

  const handleTrigger = async (sourcesOverride?: string[]) => {
    if (!API_URL) {
      toast.error("Backend API URL is not configured.");
      return;
    }
    setTriggering(true);
    try {
      const keywords = manualKeywords
        .split(/[,\n]/)
        .map((k) => k.trim())
        .filter(Boolean);

      const sources = sourcesOverride || manualSources;

      const res = await fetch(`${API_URL}/api/pipeline/scheduler/trigger`, {
        method: "POST",
        headers: { "X-API-Key": PIPELINE_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          sources,
          keywords,
        }),
      });
      if (res.ok) {
        toast.success(
          `Scrapers triggered (${sources.join(", ")}) using ${
            keywords.length ? `${keywords.length} custom keyword(s)` : "skills.json keywords"
          }.`
        );
        setTimeout(() => fetchData(), 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.detail || "Failed to trigger scraper");
      }
    } catch {
      toast.error("Error triggering scraper");
    } finally {
      setTriggering(false);
    }
  };

  const handleStop = async () => {
    if (!API_URL) {
      toast.error("Backend API URL is not configured.");
      return;
    }
    setStopping(true);
    try {
      const res = await fetch(`${API_URL}/api/pipeline/scheduler/stop`, {
        method: "POST",
        headers: { "X-API-Key": PIPELINE_API_KEY },
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(payload?.detail || "Failed to stop scraper cycle");
        return;
      }

      if (payload?.status === "idle") {
        toast.message("No active scraper cycle to stop.");
        await fetchData();
        return;
      }

      toast.success("Stop signal sent. Waiting for cycle to halt...");

      for (let i = 0; i < 12; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await fetchData();
      }
    } catch {
      toast.error("Error while stopping scraper cycle");
    } finally {
      setStopping(false);
    }
  };

  return (
    <AdminLayout user={user}>
      {loading || !config || !status ? (
        <div className="flex justify-center items-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600" />
            <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Loading System...</span>
          </div>
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
                  Scraper <span className="text-blue-100">Scheduler</span>
                </h1>
                <p className="text-white/90 mt-1 font-medium max-w-lg leading-relaxed text-[15px]">
                  Automate job aggregation securely running in the background.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 shrink-0 mt-2 md:mt-0">
                {status.is_running && (
                  <Button
                    onClick={handleStop}
                    disabled={stopping}
                    className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-11 px-6 shadow-[0_4px_14px_rgba(244,63,94,0.3)] font-bold transition-all border-none"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    {stopping ? "Stopping..." : "Stop Scraping"}
                  </Button>
                )}
                <Button 
                    onClick={() => handleTrigger()} 
                    disabled={triggering || status.is_running || manualSources.length === 0}
                    className="bg-white hover:bg-slate-50 text-blue-600 rounded-xl h-11 px-6 shadow-[0_4px_14px_rgba(255,255,255,0.2)] font-bold transition-all border-none"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {status.is_running ? "Processing..." : "Run Selected Now"}
                </Button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 pt-4">
            
            {/* Status Panel */}
            <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-8">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-800">
                <Activity className="w-5 h-5 text-blue-500" />
                Current Status
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[14px] font-bold text-slate-600">Scheduler State</span>
                  <span className={`px-3 py-1.5 flex items-center gap-1.5 rounded-xl text-[12px] font-bold shadow-sm border ${status.is_enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {status.is_enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {status.is_enabled ? "Active" : "Disabled"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[14px] font-bold text-slate-600">Background Process</span>
                  <span className={`px-3 py-1.5 flex items-center gap-1.5 rounded-xl text-[12px] font-bold shadow-sm border ${status.is_running ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {status.is_running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    {status.is_running ? "Processing" : "Idle"}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[14px] font-bold text-slate-600">Rotation Progress</span>
                  <div className="text-right flex flex-col gap-0.5">
                    <p className="text-[13px] font-semibold text-slate-500">LinkedIn Skill Index: <span className="text-blue-600 bg-blue-50 px-1.5 rounded-md">{status.linkedin_next_index}</span></p>
                    <p className="text-[13px] font-semibold text-slate-500">Indeed Skill Index: <span className="text-blue-600 bg-blue-50 px-1.5 rounded-md">{status.indeed_next_index}</span></p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl">
                  <span className="text-[14px] font-bold flex items-center gap-2 text-blue-700 mb-3">
                    <CalendarDays className="w-4 h-4" /> Upcoming Scheduled Runs
                  </span>
                  {status.upcoming_runs.length > 0 ? (
                    <div className="space-y-2">
                       <div className="text-[13px] font-semibold text-blue-700 bg-white px-3 py-2 rounded-xl shadow-sm border border-blue-100/60 flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                         {new Date(status.upcoming_runs[0].next_run).toLocaleString()}
                       </div>
                    </div>
                  ) : (
                    <span className="text-[13px] font-semibold text-slate-500">No scheduled runs configured</span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Manual Controls */}
            <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-8">
              <h2 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
                 <PlayCircle className="w-5 h-5 text-blue-500" />
                 Manual Run Controls
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Sources to run</label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (manualSources.includes("linkedin")) setManualSources((prev) => prev.filter((s) => s !== "linkedin"));
                        else setManualSources((prev) => Array.from(new Set([...prev, "linkedin"])));
                      }}
                      className={`flex items-center gap-2.5 text-[14px] font-bold px-4 py-2 border rounded-xl cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${manualSources.includes("linkedin") ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      <div className={`w-4 h-4 rounded-[5px] flex items-center justify-center transition-colors border ${manualSources.includes("linkedin") ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"}`}>
                        {manualSources.includes("linkedin") && <Check className="w-3 h-3" strokeWidth={4} />}
                      </div>
                      LinkedIn Pipeline
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (manualSources.includes("indeed")) setManualSources((prev) => prev.filter((s) => s !== "indeed"));
                        else setManualSources((prev) => Array.from(new Set([...prev, "indeed"])));
                      }}
                      className={`flex items-center gap-2.5 text-[14px] font-bold px-4 py-2 border rounded-xl cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${manualSources.includes("indeed") ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      <div className={`w-4 h-4 rounded-[5px] flex items-center justify-center transition-colors border ${manualSources.includes("indeed") ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"}`}>
                        {manualSources.includes("indeed") && <Check className="w-3 h-3" strokeWidth={4} />}
                      </div>
                      Indeed Pipeline
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Custom keywords (optional)</label>
                  <textarea
                    className="w-full flex min-h-[100px] rounded-[14px] border border-slate-200/80 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                    placeholder="python developer, data engineer, react&#10;(leave blank to use internal skills.json registry)"
                    value={manualKeywords}
                    onChange={(e) => setManualKeywords(e.target.value)}
                  />
                  <span className="text-[12px] font-semibold text-slate-400 mt-2 block">
                    Comma or newline separated. Blank uses the default skills rotation.
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={() => handleTrigger()}
                    disabled={triggering || status.is_running || stopping || manualSources.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 rounded-xl font-bold shadow-sm w-full"
                  >
                    {triggering ? "Starting Manual Run..." : "Execute Override Mode"}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Config Panel */}
            <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-8 md:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Settings className="w-5 h-5 text-slate-500" />
                  Global Configuration
                </h2>
                <Button onClick={handleSaveConfig} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 font-bold shadow-[0_4px_14px_rgba(37,99,235,0.2)]">
                  {saving ? "Saving..." : "Save Config Data"}
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[16px] md:col-span-2">
                  <div>
                     <label className="text-[15px] font-bold text-slate-800 block">Enable Automated Daily Scraper</label>
                     <span className="text-[13px] font-medium text-slate-500">Master toggle for the background cron scheduler.</span>
                  </div>
                  <button 
                     type="button"
                     onClick={() => setConfig({...config, enabled: !config.enabled})}
                     className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${config.enabled ? "bg-blue-600" : "bg-slate-200"}`}
                  >
                     <div className={`absolute top-[2px] left-[2px] bg-white h-5 w-5 rounded-full shadow-sm transition-transform ${config.enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                
                <div>
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Schedule Windows (HH:MM)</label>
                  <Input 
                    value={config.schedule_windows_start.join(", ")} 
                    onChange={e => setConfig({...config, schedule_windows_start: e.target.value.split(",").map(s => s.trim())})}
                    placeholder="01:00, 06:00, 21:00"
                    className="h-11 bg-white border border-slate-200/80 rounded-[14px] text-[14px] font-bold shadow-sm focus-visible:ring-blue-500"
                  />
                  <span className="text-[12px] font-semibold text-slate-400 mt-1.5 block">Comma separated times in 24hr format</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Max Duration (s)</label>
                    <Input 
                        type="number" 
                        value={config.duration_seconds} 
                        onChange={e => setConfig({...config, duration_seconds: parseInt(e.target.value)})}
                        className="h-11 bg-white border border-slate-200/80 rounded-[14px] text-[14px] font-bold shadow-sm focus-visible:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Jobs Per Skill</label>
                    <Input 
                        type="number" 
                        value={config.max_jobs_per_skill} 
                        onChange={e => setConfig({...config, max_jobs_per_skill: parseInt(e.target.value)})}
                        className="h-11 bg-white border border-slate-200/80 rounded-[14px] text-[14px] font-bold shadow-sm focus-visible:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-widest flex justify-between items-center mb-2">
                    <span>Proxy Network Nodes (IP Whitelist)</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[11px]">{config.proxies?.length || 0} nodes live</span>
                  </label>
                  <textarea 
                    className="w-full flex min-h-[100px] rounded-[14px] border border-slate-200/80 bg-slate-50/50 px-4 py-3 text-[14px] font-medium text-slate-800 shadow-inner placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors tracking-widest font-mono"
                    placeholder="http://192.168.1.1:8000"
                    value={(config.proxies || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      const ips = lines.map(line => line.trim()).filter(line => line !== "");
                      setConfig({...config, proxies: ips});
                    }}
                    rows={4}
                  />
                  <span className="text-[12px] font-semibold text-slate-400 mt-2 block">Format: http://ip:port. Enter one per line. Clear to use fallback localhost node.</span>
                </div>
              </div>
            </motion.div>

            {/* Run History */}
            <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] md:col-span-2 overflow-hidden relative pb-4">
               <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-center">
                 <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    Run History Logging
                 </h2>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                       {["Timestamp", "Sourcing Scope", "Execution Time", "Data Harvested", "Pipeline End State"].map(
                         (h, i) => (
                           <th
                             key={h}
                             className={`px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ${i === 4 ? 'text-right' : ''}`}
                           >
                             {h}
                           </th>
                         )
                       )}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {status.history.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <div className="inline-flex w-16 h-16 bg-slate-50 rounded-[16px] border border-slate-100 items-center justify-center mb-4 shadow-inner">
                                <Clock className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-bold text-[15px]">No execution records found in log.</p>
                          </td>
                        </tr>
                      ) : (
                        status.history.map((run, i) => (
                          <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-8 py-6">
                               <div className="flex flex-col gap-0.5">
                                 <span className="text-[14px] font-bold text-slate-800">
                                   {new Date(run.start).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
                                 </span>
                                 <span className="text-[13px] font-semibold text-slate-500">
                                   {new Date(run.start).toLocaleTimeString("en-GB")}
                                 </span>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-1.5">
                                <span
                                  className={`inline-flex w-fit items-center rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-sm border ${
                                    (run.keywords?.length || 0) > 0
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {(run.keywords?.length || 0) > 0 ? "Custom Keywords" : "Registry Defaults"}
                                </span>
                                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">
                                  {(run.sources && run.sources.length > 0 ? run.sources : ["linkedin", "indeed"]).join(", ")}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                               <span className="text-[14px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{run.duration.split(".")[0]}</span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex gap-3">
                                 <div className="flex flex-col items-center p-2 rounded-xl border border-slate-100 bg-white shadow-sm min-w-[60px]">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">LI</span>
                                    <span className="text-[15px] font-extrabold text-blue-600">{run.results.linkedin_scraped || 0}</span>
                                 </div>
                                 <div className="flex flex-col items-center p-2 rounded-xl border border-slate-100 bg-white shadow-sm min-w-[60px]">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">IN</span>
                                    <span className="text-[15px] font-extrabold text-emerald-600">{run.results.indeed_scraped || 0}</span>
                                 </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-bold border shadow-sm ${
                                run.status === 'success'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : run.status === 'cancelled'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                <span className={`w-2 h-2 rounded-full shadow-inner ${
                                  run.status === 'success' ? 'bg-emerald-500' : run.status === 'cancelled' ? 'bg-amber-500' : 'bg-red-500' 
                                }`} />
                                {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                   </tbody>
                 </table>
               </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AdminLayout>
  );
}
