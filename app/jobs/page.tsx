"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import JobCard from "@/components/jobs/JobCard";
import JobFiltersPanel from "@/components/jobs/JobFilters";
import ScraperSourceToggle from "@/components/jobs/ScraperSourceToggle";
import FreemiumGate from "@/components/jobs/FreemiumGate";
import { getJobs } from "@/lib/api/jobs";
import { getMe } from "@/lib/api/users";
import { JobListResponse, JobFilters, User } from "@/types";
import { getJobTypeBadge } from "@/lib/utils";
import {
  Briefcase,
  Sparkles,
  Target,
  Filter,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, Variants } from "framer-motion";

function StatPill({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string | number;
  accentColor: string;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/80 p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all duration-300 flex flex-col border-b-4 hover:-translate-y-1" style={{ borderBottomColor: accentColor }}>
      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-1">
        {label}
      </p>
      <p className="text-[32px] font-black tracking-tight text-slate-800">{value}</p>
    </div>
  );
}

export default function JobsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [jobData, setJobData] = useState<JobListResponse | null>(null);
  const [filters, setFilters] = useState<JobFilters>({ sort: "match" });
  const [loading, setLoading] = useState(true);
  const [scraperSource, setScraperSource] = useState<"linkedin" | "indeed" | undefined>(undefined);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {});
  }, []);

  const fetchJobs = useCallback(async (currentFilters: JobFilters) => {
    setLoading(true);
    try {
      const data = await getJobs(currentFilters);
      setJobData(data);
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;
      toast.error(msg || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const updatedFilters = { ...filters, scraper_source: scraperSource };
    fetchJobs(updatedFilters);
  }, [filters, scraperSource, fetchJobs]);

  const handleFiltersChange = (newFilters: JobFilters) =>
    setFilters(newFilters);

  const handleScraperSourceChange = (source: "linkedin" | "indeed" | "all") => {
    if (source === "all") {
      setScraperSource(undefined);
    } else {
      setScraperSource(source);
    }
  };

  const hiddenCount = jobData
    ? jobData.total_count - jobData.returned_count
    : 0;

  const visibleJobs = jobData?.jobs || [];
  
  // Calculate stats from visible results (what user sees)
  const topMatchCount = visibleJobs.filter((j) => j.match_score >= 70).length;
  const avgMatchScore = visibleJobs.length
    ? Math.round(
        visibleJobs.reduce((acc, j) => acc + j.match_score, 0) /
          visibleJobs.length
      )
    : 0;

  // Calculate LinkedIn and Indeed counts from visible jobs
  const linkedinCount = visibleJobs.filter(j => j.scraper_source === 'linkedin').length;
  const indeedCount = visibleJobs.filter(j => j.scraper_source === 'indeed').length;

  const activeFilters = [
    filters.search ? `Search: ${filters.search}` : null,
    filters.location ? `Location: ${filters.location}` : null,
    filters.job_type ? `Type: ${getJobTypeBadge(filters.job_type)}` : null,
    filters.salary_min
      ? `Min: £${(filters.salary_min / 1000).toFixed(0)}k`
      : null,
    filters.salary_max
      ? `Max: £${(filters.salary_max / 1000).toFixed(0)}k`
      : null,
  ].filter(Boolean) as string[];

  const sortLabel =
    filters.sort === "salary"
      ? "Highest salary"
      : filters.sort === "recent"
      ? "Most recent"
      : "Best match";

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden">
      {/* Ambient meshes */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-400/10 blur-[120px] -z-10 rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-400/10 blur-[120px] -z-10 rounded-full pointer-events-none" />

      <div className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/50">
        <Navbar user={user} />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">
        
        {/* Full Header Block - Premium Light Theme */}
        <motion.section variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden relative">
          
          {/* Ambient light blobs for texture */}
          <div className="absolute top-[-100px] right-[-50px] w-80 h-80 bg-blue-100/50 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="p-8 sm:p-10 border-b border-slate-100 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200/60 text-[11px] font-bold text-slate-600 mb-5 tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              INTELLIGENT MATCHING
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Sponsorship jobs, <br className="hidden md:block" />
              <span style={{ color: "transparent", backgroundClip: "text", backgroundImage: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>scored for you.</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-slate-500 max-w-2xl font-medium leading-relaxed">
              Every role is pre-filtered to active UK sponsor licence holders
              and semanticly ranked against your CV profile to save your time.
            </p>

            {/* Weighting badges */}
            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              {[
                { label: "Job Title", weight: 40, border: "#c7d2fe", bg: "#eef2ff", text: "#4338ca" },
                { label: "Skills", weight: 40, border: "#bae6fd", bg: "#f0f9ff", text: "#0369a1" },
                { label: "Location", weight: 10, border: "#fde68a", bg: "#fffbeb", text: "#b45309" },
                { label: "Experience", weight: 10, border: "#a7f3d0", bg: "#ecfdf5", text: "#047857" },
              ].map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-bold tracking-wide border shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  style={{ borderColor: item.border, backgroundColor: item.bg, color: item.text }}
                >
                  <Target className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {item.label} {item.weight}%
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-50/80 p-8 sm:p-10 relative z-10">
            <JobFiltersPanel
              onFiltersChange={handleFiltersChange}
              currentFilters={filters}
            />

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-2">Active filters:</span>
                <AnimatePresence>
                  {activeFilters.map((label) => (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      key={label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm"
                    >
                      {label}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Real-time stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatPill
            label="Total Matches"
            value={jobData?.total_count || 0}
            accentColor="#94a3b8"
          />
          <StatPill
            label="Top >70%"
            value={topMatchCount}
            accentColor="#10b981"
          />
          <StatPill
            label="Avg Score"
            value={jobData ? `${avgMatchScore}%` : 0}
            accentColor="#3b82f6"
          />
          <StatPill
            label="Visible Results"
            value={jobData?.returned_count || 0}
            accentColor="#6366f1"
          />
        </motion.div>

        {/* Results layout */}
        <motion.div variants={itemVariants} className="space-y-6 pt-2">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-blue-600" />
                {jobData?.total_count || 0} matching jobs
                {jobData?.is_limited && (
                  <span className="ml-2 px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                    Free tier filter
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white border border-slate-200 text-[13px] font-bold text-slate-600 shadow-sm shadow-slate-200/50">
                <Filter className="h-4 w-4 text-slate-400" />
                {sortLabel}
              </div>
            </div>

            {/* Scraper Source Toggle */}
            {(linkedinCount > 0 || indeedCount > 0) && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                <ScraperSourceToggle
                  linkedinCount={linkedinCount}
                  indeedCount={indeedCount}
                  onSourceChange={handleScraperSourceChange}
                  isLoading={loading}
                />
              </motion.div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-slate-500 text-sm font-semibold tracking-wide">Computing match vectors...</p>
            </div>
          ) : visibleJobs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center shadow-sm">
              <div 
                className="flex h-16 w-16 items-center justify-center rounded-[16px] mx-auto mb-5 text-white"
                style={{ background: "linear-gradient(135deg, #94a3b8, #cbd5e1)" }}
              >
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
                No jobs matched
              </h3>
              <p className="text-slate-500 max-w-md mx-auto font-medium text-[15px]">
                Try broadening location, reducing salary constraints, or removing
                keywords to see more sponsorship roles.
              </p>
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {visibleJobs.map((job) => (
                <motion.div variants={itemVariants} key={job.id}>
                  <JobCard job={job} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {jobData?.is_limited && hiddenCount > 0 && !loading && (
            <div className="pt-6">
                <FreemiumGate
                totalCount={jobData.total_count}
                hiddenCount={hiddenCount}
                />
            </div>
          )}
        </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
