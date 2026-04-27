"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { uploadCV, confirmCVProfile } from "@/lib/api/users";
import { ParsedCVProfile, User } from "@/types";
import { Upload, CheckCircle2, X, Plus, UserCircle2, Briefcase, Calendar } from "lucide-react";
import { toast } from "sonner";

function parseYearsValue(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return NaN;
}

function formatYears(years: number): string {
  if (!Number.isFinite(years)) return "—";
  const rounded = Math.round(years * 10) / 10;
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
}

function canonicalizeSkill(skill: string): string {
  const cleaned = skill.trim();
  const normalized = cleaned.toLowerCase().replace(/[\/_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (
    normalized === "ui ux"
    || normalized === "ux ui"
    || normalized === "ui ux design"
    || normalized === "ux ui design"
    || normalized === "ui ux designer"
    || normalized === "ux ui designer"
  ) {
    return "UI/UX";
  }
  return cleaned;
}

function normalizeParsedCVProfile(profile: ParsedCVProfile): ParsedCVProfile {
  const skills = Array.from(
    new Set((profile.skills || []).map((skill) => canonicalizeSkill(skill)).filter(Boolean))
  );
  const experienceBreakdown = (profile.experience_breakdown || [])
    .map((item) => ({
      role: (typeof item?.role === "string" ? item.role.trim() : String(item?.role || "")).trim(),
      period: (typeof item?.period === "string" ? item.period.trim() : String(item?.period || "")).trim(),
      years: parseYearsValue(item?.years),
    }))
    // Keep entries that have at least a role name; years=0 or missing period are acceptable
    .filter((item) => item.role && item.role !== "" && item.role !== "undefined");

  const experience =
    typeof profile.experience_years === "number" && Number.isFinite(profile.experience_years)
      ? profile.experience_years
      : typeof profile.experience_years === "string"
        ? parseFloat(profile.experience_years)
        : undefined;

  const fallbackRole = profile.job_title?.trim() || "";
  if (
    experienceBreakdown.length === 0
    && Number.isFinite(experience as number)
    && fallbackRole
  ) {
    experienceBreakdown.push({
      role: fallbackRole,
      period: "Based on CV profile",
      years: experience as number,
    });
  }

  return {
    ...profile,
    job_title: profile.job_title?.trim() || undefined,
    skills,
    experience_years: Number.isFinite(experience as number) ? (experience as number) : undefined,
    experience_breakdown: experienceBreakdown,
  };
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : "";
        }
        return "";
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join("; ");
    }
  }

  const message = (err as { message?: unknown })?.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return fallback;
}

interface CVUploaderProps {
  user: User;
  onProfileUpdated: (user: User) => void;
}

export default function CVUploader({ user, onProfileUpdated }: CVUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [extracted, setExtracted] = useState<ParsedCVProfile | null>(
    user.parsed_cv ? normalizeParsedCVProfile(user.parsed_cv) : null
  );
  const hasFreshUploadRef = useRef(false);
  const [newSkill, setNewSkill] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasFreshUploadRef.current) return;
    setExtracted(user.parsed_cv ? normalizeParsedCVProfile(user.parsed_cv) : null);
  }, [user.parsed_cv]);

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadCV(file);
      hasFreshUploadRef.current = true;
      setExtracted(normalizeParsedCVProfile(result.extracted));
      toast.success("CV parsed! Check out the extracted fields below.");
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Failed to parse CV");
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleConfirm = async () => {
    if (!extracted) return;
    setConfirming(true);
    try {
      const updatedUser = await confirmCVProfile(extracted);
      onProfileUpdated(updatedUser);
      toast.success("CV profile seamlessly saved. Your job matches are now fully personalized.");
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Failed to save profile");
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  const removeSkill = (skill: string) => {
    if (!extracted) return;
    setExtracted({ ...extracted, skills: extracted.skills.filter((s) => s !== skill) });
  };

  const addSkill = () => {
    if (!newSkill.trim() || !extracted) return;
    if (!extracted.skills.includes(newSkill.trim())) {
      setExtracted({ ...extracted, skills: [...extracted.skills, newSkill.trim()] });
    }
    setNewSkill("");
  };

  return (
    <div className="space-y-6">
      {/* Existing profile indicator */}
      {user.parsed_cv && !extracted && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 text-sm text-green-700 bg-green-50/50 backdrop-blur-sm border border-green-200/50 rounded-[16px] p-4 font-medium shadow-sm"
        >
          <div className="p-1 rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          </div>
          <span>
            CV profile active — {" "}
            <span className="font-bold">{user.parsed_cv.skills?.length || 0} skills</span> detected.
            Upload a new CV to refresh your matches.
          </span>
        </motion.div>
      )}

      {/* Upload Zone */}
      <motion.div
        whileHover={{ scale: 1.01, borderColor: "#3b82f6", backgroundColor: "rgba(239, 246, 255, 0.5)" }}
        whileTap={{ scale: 0.99 }}
        className="relative overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[20px] p-10 text-center cursor-pointer transition-colors duration-300"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="absolute inset-0 bg-blue-50 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-white shadow-sm border border-slate-100 rounded-[18px] flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Upload className="h-7 w-7 text-blue-500" />
          </div>
          <p className="text-[17px] font-bold tracking-tight text-slate-800 mb-1">
            Drag & drop your latest CV
          </p>
          <p className="text-[13px] font-medium text-slate-400">
            Or click to browse (PDF, DOCX up to 5MB)
          </p>

          <AnimatePresence>
            {uploading && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 text-[14px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 shadow-sm">
                  <div className="h-3 w-3 rounded-full bg-blue-500 animate-ping" />
                  Extracting semantic data...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Extracted Fields Editor */}
      <AnimatePresence>
        {extracted && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="rounded-[24px] border border-blue-100/60 bg-gradient-to-br from-blue-50/30 to-white backdrop-blur-xl shadow-[0_8px_40px_rgb(59,130,246,0.06)] overflow-hidden p-6 md:p-8 space-y-8"
          >
            <div className="flex items-center gap-3 pb-6 border-b border-blue-100/50">
              <div className="p-2.5 rounded-[12px] bg-blue-600 text-white shadow-[0_4px_14px_rgb(59,130,246,0.4)]">
                <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <h2 className="text-[19px] font-extrabold text-slate-800 tracking-tight">Review Extracted Profile</h2>
            </div>
            
            {/* Job Title & Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="job-title" className="text-[13px] font-bold tracking-wide text-slate-500 uppercase flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4" /> Current Role
                </Label>
                <Input
                  id="job-title"
                  value={extracted.job_title || ""}
                  onChange={(e) => setExtracted({ ...extracted, job_title: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  className="h-12 rounded-[14px] text-[15px] font-medium border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience" className="text-[13px] font-bold tracking-wide text-slate-500 uppercase flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Total Years
                </Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={extracted.experience_years ?? ""}
                  onChange={(e) =>
                    setExtracted({
                      ...extracted,
                      experience_years: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="e.g. 4.5"
                  className="h-12 rounded-[14px] text-[15px] font-medium border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300"
                />
              </div>
            </div>

            {/* Experience by Role Breakdown */}
            {(extracted.experience_breakdown?.length || 0) > 0 && (
              <div className="space-y-3 pt-2">
                <Label className="text-[13px] font-bold tracking-wide text-slate-500 uppercase flex items-center gap-2 mb-3">
                  <Briefcase className="h-4 w-4" /> Component Experience
                </Label>
                <div className="space-y-2.5">
                  {(extracted.experience_breakdown || []).map((entry, index) => (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      key={`${entry.role}-${entry.period}-${index}`}
                      className="rounded-[16px] border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-[15px] font-bold text-slate-800 break-words block">{entry.role}</span>
                        {entry.period && <p className="text-[13px] font-medium text-slate-400 mt-0.5">{entry.period}</p>}
                      </div>
                      
                      {Number.isFinite(entry.years) && (
                        <div className="bg-slate-50 border border-slate-100 rounded-[10px] px-3 py-1.5 shrink-0 self-start sm:self-auto">
                          <span className="text-[14px] font-extrabold text-blue-700 whitespace-nowrap">{formatYears(entry.years)} yrs</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px w-full bg-slate-200/60" />

            {/* Skills Array */}
            <div className="space-y-3">
              <Label className="text-[13px] font-bold tracking-wide text-slate-500 uppercase flex items-center gap-2 mb-3">
                Identified Skills <span className="bg-slate-200 text-slate-600 px-2 rounded-full text-[11px] leading-tight flex items-center h-5">{extracted.skills.length}</span>
              </Label>
              <div className="flex flex-wrap gap-2.5 mb-4">
                <AnimatePresence>
                  {extracted.skills.map((skill) => (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0, width: 0, padding: 0, margin: 0 }}
                      key={skill}
                    >
                      <Badge
                        variant="secondary"
                        className="rounded-[10px] px-3 py-1.5 bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-100 font-bold tracking-wide text-[13px] shadow-sm flex items-center gap-1 transition-colors"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 p-0.5 rounded-full hover:bg-indigo-200 text-indigo-400 hover:text-indigo-800 transition-colors"
                        >
                          <X className="h-3 w-3" strokeWidth={3} />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Add Custom Skill */}
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="e.g. NextJS"
                  className="h-10 rounded-[12px] flex-1 text-[14px] font-medium border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-slate-300"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addSkill}
                  className="h-10 px-4 rounded-[12px] border border-slate-200 bg-white text-slate-700 font-bold text-[14px] shadow-sm hover:shadow-md hover:bg-slate-50 transition-all flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" strokeWidth={3} />
                  Add
                </motion.button>
              </div>
            </div>

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-[16px] font-extrabold text-[16px] shadow-[0_8px_30px_rgba(37,99,235,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
                {confirming ? "Finalising Profile..." : "Lock in My Semantic Profile"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
