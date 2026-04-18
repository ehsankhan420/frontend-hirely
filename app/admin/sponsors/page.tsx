"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMe } from "@/lib/api/users";
import { createClient } from "@/lib/supabase/client";
import { User, SponsorLicence } from "@/types";
import {
  BadgeCheck,
  Upload,
  Loader2,
  Search,
  ExternalLink,
  CheckCircle,
  Building2,
  MapPin,
  Route,
  RefreshCw,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";

type SponsorImportRow = {
  organisation_name: string;
  town: string | null;
  county: string | null;
  type_rating: string | null;
  route: string | null;
};

const COLUMN_ALIASES: Record<string, keyof SponsorImportRow> = {
  "organisation name": "organisation_name",
  organisation_name: "organisation_name",
  "town/city": "town",
  town: "town",
  county: "county",
  "type & rating": "type_rating",
  type_rating: "type_rating",
  route: "route",
};

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

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i += 1; }
      else { inQuotes = !inQuotes; }
      continue;
    }
    if (char === "," && !inQuotes) { fields.push(current.trim()); current = ""; continue; }
    current += char;
  }
  fields.push(current.trim());
  return fields;
}

function normalizeCell(value: string | undefined): string | null {
  const normalized = (value || "").trim();
  if (!normalized || normalized.toLowerCase() === "nan") return null;
  return normalized;
}

function parseSponsorCsv(text: string): SponsorImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const rawHeaders = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const mappedHeaders = rawHeaders.map((h) => COLUMN_ALIASES[h]);
  const orgIdx = mappedHeaders.findIndex((v) => v === "organisation_name");
  if (orgIdx < 0) throw new Error("Missing required column: Organisation Name.");

  const deduped = new Map<string, SponsorImportRow>();
  lines.slice(1).forEach((line) => {
    const values = parseCsvLine(line);
    const row: SponsorImportRow = { organisation_name: "", town: null, county: null, type_rating: null, route: null };
    mappedHeaders.forEach((key, i) => {
      if (!key) return;
      if (key === "organisation_name") row.organisation_name = values[i]?.trim() || "";
      else row[key] = normalizeCell(values[i]);
    });
    if (!row.organisation_name) return;
    deduped.set(row.organisation_name.toLowerCase(), row);
  });
  return Array.from(deduped.values());
}

export default function AdminSponsorsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sponsors, setSponsors] = useState<SponsorLicence[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    errors?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSponsors = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sponsor_licences")
      .select("*")
      .eq("is_active", true)
      .order("organisation_name", { ascending: true })
      .limit(1000);
    if (error) throw error;
    setSponsors((data || []) as SponsorLicence[]);
  };

  useEffect(() => {
    Promise.all([getMe(), loadSponsors()])
      .then(([userData]) => setUser(userData))
      .catch(() => toast.error("Failed to load sponsors"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      if (!file.name.toLowerCase().endsWith(".csv"))
        throw new Error("Only CSV files are supported.");
      const parsedRows = parseSponsorCsv(await file.text());
      if (parsedRows.length === 0)
        throw new Error("No valid sponsor rows found in CSV.");

      const today = new Date().toISOString().slice(0, 10);
      const supabase = createClient();
      let imported = 0;
      let updated = 0;
      const errors: string[] = [];

      for (let i = 0; i < parsedRows.length; i += 1) {
        const row = parsedRows[i];
        const { data: existing, error: existingError } = await supabase
          .from("sponsor_licences")
          .select("id")
          .ilike("organisation_name", row.organisation_name)
          .limit(1)
          .maybeSingle();

        if (existingError) { errors.push(`Row ${i + 2}: ${existingError.message}`); continue; }

        const payload = {
          organisation_name: row.organisation_name,
          town: row.town,
          county: row.county,
          type_rating: row.type_rating,
          route: row.route,
          is_active: true,
          last_updated: today,
        };

        if (existing?.id) {
          const { error } = await supabase.from("sponsor_licences").update(payload).eq("id", existing.id);
          if (error) errors.push(`Row ${i + 2}: ${error.message}`);
          else updated += 1;
        } else {
          const { error } = await supabase.from("sponsor_licences").insert(payload);
          if (error) errors.push(`Row ${i + 2}: ${error.message}`);
          else imported += 1;
        }
      }

      setImportResult({ imported, updated, errors });
      toast.success(`Import complete: ${imported} new, ${updated} updated`);
      await loadSponsors();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const filtered = sponsors.filter((s) =>
    s.organisation_name.toLowerCase().includes(search.toLowerCase())
  );

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
                Sponsor <span className="text-blue-100">Registry</span>
              </h1>
              <p className="text-white/90 mt-1 font-medium max-w-lg leading-relaxed text-[15px]">
                 {loading ? "Loading sponsor metrics..." : `Managing ${sponsors.length} validated Home Office sponsor licences.`}
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
                   if (f) handleUpload(f);
                   e.target.value = "";
                 }}
               />
               <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-white hover:bg-slate-50 text-blue-600 rounded-xl h-11 px-6 shadow-[0_4px_14px_rgba(255,255,255,0.2)] font-bold transition-all border-none"
               >
                 {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                 {uploading ? "Importing Data..." : "Upload Register CSV"}
               </Button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
        </motion.div>

        {/* Global Toolbar */}
        <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 pt-4">
           {/* Left side: Search & Stats */}
           <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 w-full xl:w-auto">
             <div className="relative w-full lg:w-[340px] shrink-0">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
               <Input
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search sponsors by name..."
                 className="pl-11 h-12 bg-white border border-slate-200/80 text-slate-800 placeholder:text-slate-400 focus-visible:ring-blue-500 rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-[15px] font-medium transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] w-full"
               />
             </div>
             {importResult && (
               <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-[12px] border border-emerald-100 font-semibold text-sm whitespace-nowrap">
                 <CheckCircle className="h-4 w-4" />
                 {importResult.imported} new, {importResult.updated} updated
               </div>
             )}
           </div>

           {/* Right side: Instructions */}
           <div className="flex items-center gap-3 shrink-0 mt-4 xl:mt-0">
             <a
               href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center gap-2 h-12 px-4 rounded-[14px] text-[13px] font-bold text-sky-600 bg-sky-50 border border-transparent hover:border-sky-200 hover:bg-sky-100 transition-colors shadow-sm"
             >
               <ExternalLink className="h-4 w-4" /> Sync Home Office Direct Link
             </a>
           </div>
        </motion.div>

        {/* Modern Bento Table */}
        <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden relative">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600" />
                <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Loading Registry...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {["Organisation", "Location", "Route", "Status", "Updated"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-7 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-7 py-5">
                        <div className="flex items-center gap-3">
                           <div className="flex-shrink-0 w-8 h-8 rounded-[8px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                               <Building2 className="w-4 h-4" />
                           </div>
                           <span className="text-[15px] font-bold text-slate-800 line-clamp-1 max-w-[300px]">
                             {s.organisation_name}
                           </span>
                        </div>
                      </td>
                      <td className="px-7 py-5">
                        <div className="flex items-center gap-2">
                           <MapPin className="w-3.5 h-3.5 text-slate-400" />
                           <span className="text-[13px] font-semibold text-slate-500 whitespace-nowrap tracking-tight">
                             {[s.town, s.county].filter(Boolean).join(", ") || "UK Based"}
                           </span>
                        </div>
                      </td>
                      <td className="px-7 py-5">
                        <div className="flex items-center gap-2">
                           <Route className="w-3.5 h-3.5 text-slate-400" />
                           <span className="text-[13px] font-semibold text-slate-500 whitespace-nowrap">
                             {s.route || "Global Route"}
                           </span>
                        </div>
                      </td>
                      <td className="px-7 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-bold border whitespace-nowrap shadow-sm ${
                            s.is_active
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                              : "text-rose-700 bg-rose-50 border-rose-200"
                          }`}
                        >
                          <BadgeCheck className="h-4 w-4" />
                          {s.is_active ? "Verified" : "Archived"}
                        </span>
                      </td>
                      <td className="px-7 py-5">
                         <div className="flex items-center gap-2">
                           <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                           <span className="text-[13px] font-semibold text-slate-500 whitespace-nowrap tracking-tight">
                             {s.last_updated || "—"}
                           </span>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-20">
                          <div className="inline-flex w-16 h-16 bg-slate-50 rounded-[16px] border border-slate-100 items-center justify-center mb-4 shadow-inner">
                              <BadgeCheck className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-slate-500 font-bold text-[15px]">
                              {search ? "No sponsors match your search." : "No sponsors found. Please upload a register CSV."}
                          </p>
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
            Showing {filtered.length} total sponsors
          </p>
        )}
      </motion.div>
    </AdminLayout>
  );
}
