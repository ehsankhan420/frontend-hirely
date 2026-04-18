"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMe } from "@/lib/api/users";
import { deleteJob } from "@/lib/api/jobs";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import {
  Upload,
  Loader2,
  Trash2,
  Briefcase,
  Search,
  BadgeCheck,
  XCircle,
  Clock,
  Filter,
  ChevronDown,
  X
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";

interface JobRow {
  id: string;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  sponsorship_confirmed: boolean;
  posted_date: string;
}

type CsvRow = Record<string, string>;

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

const HEADER_ALIASES: Record<string, string> = {
  job_title: "title",
  position: "title",
  role: "title",

  company: "company_name",
  employer: "company_name",
  organisation: "company_name",
  organization: "company_name",
  companyname: "company_name",

  city: "location",
  workplace_location: "location",

  job_description: "description",
  details: "description",
  summary: "description",

  apply: "apply_url",
  application_url: "apply_url",
  application_link: "apply_url",
  job_url: "apply_url",
  link: "apply_url",
  url: "apply_url",

  skills: "required_skills",
  required_skill: "required_skills",
  tags: "required_skills",
};

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/\uFEFF/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function canonicalHeader(header: string): string {
  const normalized = normalizeHeader(header);
  return HEADER_ALIASES[normalized] || normalized;
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim().length > 0)) rows.push(row);
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((v) => v.trim().length > 0)) rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => canonicalHeader(h));

  return rows.slice(1).map((values) => {
    const parsedRow: CsvRow = {};
    headers.forEach((h, i) => {
      if (!h) return;
      if (!(h in parsedRow) || !parsedRow[h]) {
        parsedRow[h] = (values[i] || "").trim();
      }
    });
    return parsedRow;
  });
}

function parseBoolean(raw: string): boolean {
  return ["1", "true", "yes", "y"].includes(raw.toLowerCase().trim());
}

function parseOptionalNumber(raw: string): number | null {
  if (!raw || !raw.trim()) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSkills(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const TRACKING_QUERY_PARAMS = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "si",
]);

function normalizeApplyUrl(raw: string): string {
  const value = (raw || "").trim();
  if (!value) return "";

  try {
    const hasScheme = /^[a-z][a-z\d+\-.]*:\/\//i.test(value);
    const parsed = new URL(hasScheme ? value : `https://${value}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return value;
    }

    const protocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();
    const shouldKeepPort =
      parsed.port &&
      !(
        (protocol === "http:" && parsed.port === "80") ||
        (protocol === "https:" && parsed.port === "443")
      );
    const origin = `${protocol}//${hostname}${shouldKeepPort ? `:${parsed.port}` : ""}`;

    const pathname =
      parsed.pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

    const filteredParams: Array<[string, string]> = [];
    parsed.searchParams.forEach((paramValue, paramKey) => {
      const lowerKey = paramKey.toLowerCase();
      if (lowerKey.startsWith("utm_")) return;
      if (TRACKING_QUERY_PARAMS.has(lowerKey)) return;
      filteredParams.push([paramKey, paramValue]);
    });

    filteredParams.sort(([a], [b]) => a.localeCompare(b));
    const query = filteredParams.length
      ? `?${new URLSearchParams(filteredParams).toString()}`
      : "";

    return `${origin}${pathname}${query}`;
  } catch {
    return value;
  }
}

function normalizeDedupeText(raw: string): string {
  return (raw || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .trim();
}

function buildJobIdentityKey(title: string, companyName: string, location: string): string {
  return [
    normalizeDedupeText(title),
    normalizeDedupeText(companyName),
    normalizeDedupeText(location),
  ].join("|");
}

const JOB_TYPE_COLORS: Record<string, string> = {
  "full-time": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "part-time": "text-sky-700 bg-sky-50 border-sky-200",
  contract: "text-amber-700 bg-amber-50 border-amber-200",
  remote: "text-violet-700 bg-violet-50 border-violet-200",
};

export default function AdminJobsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadJobs = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("id,title,company_name,location,job_type,sponsorship_confirmed,posted_date")
      .eq("is_active", true)
      .order("posted_date", { ascending: false })
      .limit(500);
    if (error) throw error;
    setJobs((data || []) as JobRow[]);
  };

  useEffect(() => {
    Promise.all([getMe(), loadJobs()])
      .then(([userData]) => setUser(userData))
      .catch(() => toast.error("Failed to load jobs"))
      .finally(() => setLoading(false));
  }, []);

  const handleBulkUpload = async (file: File) => {
    setUploading(true);
    try {
      if (!file.name.toLowerCase().endsWith(".csv"))
        throw new Error("Only CSV files are supported.");
      const rows = parseCsv(await file.text());
      const required = ["title", "company_name", "location", "description", "apply_url"];
      if (rows.length === 0) throw new Error("CSV is empty or invalid.");
      const missingColumns = required.filter((c) => !(c in rows[0]));
      if (missingColumns.length > 0)
        throw new Error(`Missing columns: ${missingColumns.join(", ")}`);

      const supabase = createClient();
      let imported = 0;
      let skippedIncomplete = 0;
      let skippedDuplicate = 0;
      const errors: string[] = [];

      const existingApplyUrls = new Set<string>();
      const existingIdentityKeys = new Set<string>();

      const pageSize = 1000;
      for (let start = 0; ; start += pageSize) {
        const { data, error } = await supabase
          .from("jobs")
          .select("apply_url,title,company_name,location")
          .range(start, start + pageSize - 1);

        if (error) throw error;

        for (const job of data || []) {
          const normalized = normalizeApplyUrl(job.apply_url || "");
          if (normalized) existingApplyUrls.add(normalized);

          const identityKey = buildJobIdentityKey(
            job.title || "",
            job.company_name || "",
            job.location || ""
          );
          if (identityKey !== "||") existingIdentityKeys.add(identityKey);
        }

        if (!data || data.length < pageSize) break;
      }

      const seenInFile = new Set<string>();
      const seenInFileIdentityKeys = new Set<string>();

      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const normalizedApplyUrl = normalizeApplyUrl(row.apply_url || "");
        if (!row.title || !row.company_name || !row.location || !normalizedApplyUrl) {
          skippedIncomplete += 1;
          continue;
        }

        const title = row.title.trim();
        const companyName = row.company_name.trim();
        const location = row.location.replace(/\s+/g, " ").trim();
        const identityKey = buildJobIdentityKey(title, companyName, location);

        if (
          seenInFile.has(normalizedApplyUrl) ||
          existingApplyUrls.has(normalizedApplyUrl) ||
          seenInFileIdentityKeys.has(identityKey) ||
          existingIdentityKeys.has(identityKey)
        ) {
          skippedDuplicate += 1;
          continue;
        }
        seenInFile.add(normalizedApplyUrl);
        seenInFileIdentityKeys.add(identityKey);

        const description =
          row.description?.trim() ||
          `Imported listing for ${title} at ${companyName}.`;

        const payload = {
          title,
          company_name: companyName,
          location,
          job_type: (row.job_type || "full-time").trim().toLowerCase(),
          salary_min: parseOptionalNumber(row.salary_min),
          salary_max: parseOptionalNumber(row.salary_max),
          description,
          required_skills: parseSkills(row.required_skills || ""),
          apply_url: normalizedApplyUrl,
          seniority_level: (row.seniority_level || "mid").trim().toLowerCase(),
          sponsorship_confirmed: parseBoolean(row.sponsorship_confirmed || "false"),
          is_active: true,
        };
        const { error } = await supabase.from("jobs").insert(payload);
        if (error) errors.push(`Row ${i + 2}: ${error.message}`);
        else {
          imported += 1;
          existingApplyUrls.add(normalizedApplyUrl);
          existingIdentityKeys.add(identityKey);
        }
      }

      await loadJobs();
      const skippedSummary = [
        skippedIncomplete ? `${skippedIncomplete} incomplete` : "",
        skippedDuplicate ? `${skippedDuplicate} duplicate` : "",
      ]
        .filter(Boolean)
        .join(", ");

      toast.success(
        `Imported ${imported} jobs${
          skippedSummary ? `, skipped ${skippedSummary}` : ""
        }${errors.length ? `, ${errors.length} failed` : ""}`
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bulk upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeactivate = async (jobId: string) => {
    setDeletingId(jobId);
    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast.success("Job removed");
    } catch {
      toast.error("Failed to remove job");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = jobs.filter(
    (j) => {
      const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || 
                          j.company_name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || j.job_type === typeFilter;
      return matchSearch && matchType;
    }
  ).sort((a, b) => {
    const timeA = new Date(a.posted_date).getTime();
    const timeB = new Date(b.posted_date).getTime();
    return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
  });

  return (
    <AdminLayout user={user}>
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
                Job <span className="text-blue-100">Management</span>
              </h1>
              <p className="text-white/90 mt-1 font-medium max-w-lg leading-relaxed text-[15px]">
                 {loading ? "Loading system data..." : `Managing ${jobs.length} total active job listings.`}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 shrink-0 mt-2 md:mt-0">
               <input
                 ref={fileInputRef}
                 type="file"
                 accept=".csv"
                 className="hidden"
                 onChange={(e) => {
                   const f = e.target.files?.[0];
                   if (f) handleBulkUpload(f);
                   e.target.value = "";
                 }}
               />
               <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-white hover:bg-slate-50 text-blue-600 rounded-xl h-11 px-6 shadow-[0_4px_14px_rgba(255,255,255,0.2)] font-bold transition-all border-none"
               >
                 {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                 {uploading ? "Importing Data..." : "Upload CSV"}
               </Button>
            </div>
          </div>
          {/* Soft background accents */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
        </motion.div>

        {/* Database Search & Controls */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 pt-4">
           <div className="w-full lg:w-auto">
             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">All Jobs</span>
             <div className="relative w-full lg:w-[340px]">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
               <Input
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search jobs by title or company..."
                 className="pl-11 h-12 bg-white border border-slate-200/80 text-slate-800 placeholder:text-slate-400 focus-visible:ring-blue-500 rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-[15px] font-medium transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
               />
             </div>
           </div>

           <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] h-12 bg-white border border-slate-200/80 text-slate-700 text-[13px] font-bold rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-0">
                  <SelectValue placeholder="All Job Types" />
                </SelectTrigger>
                <SelectContent className="rounded-[16px] border-slate-200 shadow-xl p-1 bg-white border border-slate-100">
                  <SelectItem value="all" className="rounded-[10px] cursor-pointer font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-700 text-[13px] py-2">All Job Types</SelectItem>
                  <SelectItem value="full-time" className="rounded-[10px] cursor-pointer font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-700 text-[13px] py-2">Full-Time</SelectItem>
                  <SelectItem value="part-time" className="rounded-[10px] cursor-pointer font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-700 text-[13px] py-2">Part-Time</SelectItem>
                  <SelectItem value="contract" className="rounded-[10px] cursor-pointer font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-700 text-[13px] py-2">Contract</SelectItem>
                  <SelectItem value="remote" className="rounded-[10px] cursor-pointer font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-700 text-[13px] py-2">Remote</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Sort Order Filter */}
              <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                <SelectTrigger className="w-[140px] h-12 bg-white border border-slate-200/80 text-slate-700 text-[13px] font-bold rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-0">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="rounded-[16px] border-slate-200 shadow-xl p-1 bg-white border border-slate-100">
                  <SelectItem value="desc" className="rounded-[10px] cursor-pointer font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-700 text-[13px] py-2">Newest First</SelectItem>
                  <SelectItem value="asc" className="rounded-[10px] cursor-pointer font-bold text-slate-600 focus:bg-blue-50 focus:text-blue-700 text-[13px] py-2">Oldest First</SelectItem>
                </SelectContent>
              </Select>

               {/* Clear Filters */}
               {(typeFilter !== 'all' || search !== '' || sortOrder !== 'desc') && (
                   <button 
                       onClick={() => { setSearch(''); setTypeFilter('all'); setSortOrder('desc'); }}
                       className="h-12 px-4 rounded-[14px] text-[13px] font-extrabold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-2 border border-transparent hover:border-rose-100"
                   >
                       <X className="w-4 h-4" /> Clear
                   </button>
               )}
           </div>
        </motion.div>

        {/* Modern Bento Table */}
        <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden relative">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600" />
                <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Loading Jobs...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {["Job Title", "Company", "Location", "Type", "Sponsorship", "Posted", "Controls"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`px-7 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ${i === 6 ? 'text-right' : ''}`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-7 py-5">
                        <span className="text-[15px] font-bold text-slate-800 line-clamp-2">
                          {job.title}
                        </span>
                      </td>
                      <td className="px-7 py-5">
                        <div className="flex items-center gap-3">
                           <div className="flex-shrink-0 w-8 h-8 rounded-[8px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[13px]">
                               {job.company_name.charAt(0).toUpperCase()}
                           </div>
                           <span className="text-sm font-semibold text-slate-600 truncate max-w-[200px]">
                             {job.company_name}
                           </span>
                        </div>
                      </td>
                      <td className="px-7 py-5">
                        <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                          {job.location}
                        </span>
                      </td>
                      <td className="px-7 py-5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-[8px] text-[11px] font-bold border capitalize whitespace-nowrap ${
                            JOB_TYPE_COLORS[job.job_type] ||
                            "text-slate-700 bg-slate-100 border-slate-200"
                          }`}
                        >
                          {job.job_type}
                        </span>
                      </td>
                      <td className="px-7 py-5">
                        {job.sponsorship_confirmed ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-bold border text-emerald-700 bg-emerald-50 border-emerald-200 whitespace-nowrap shadow-sm">
                            <BadgeCheck className="h-4 w-4" /> Allowed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-bold border text-slate-600 bg-slate-50 border-slate-200 whitespace-nowrap shadow-sm">
                            <XCircle className="h-4 w-4" /> Unknown
                          </span>
                        )}
                      </td>
                      <td className="px-7 py-5">
                         <div className="flex items-center gap-2">
                           <Clock className="w-3.5 h-3.5 text-slate-400" />
                           <span className="text-[13px] font-semibold text-slate-500 whitespace-nowrap tracking-tight">
                             {formatDate(job.posted_date)}
                           </span>
                         </div>
                      </td>
                      <td className="px-7 py-5 text-right">
                        <button
                          onClick={() => handleDeactivate(job.id)}
                          disabled={deletingId === job.id}
                          className="p-2.5 rounded-[10px] text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors shadow-sm"
                          title="Remove Job"
                        >
                          {deletingId === job.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-20">
                          <div className="inline-flex w-16 h-16 bg-slate-50 rounded-[16px] border border-slate-100 items-center justify-center mb-4 shadow-inner">
                              <Briefcase className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-slate-500 font-bold text-[15px]">{search ? "No jobs match your search." : "There are currently no active jobs."}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
        
        {/* Footer info */}
        {!loading && filtered.length > 0 && (
          <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 text-right px-2">
            Showing {filtered.length} jobs
          </p>
        )}
      </motion.div>
    </AdminLayout>
  );
}
