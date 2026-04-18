"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { uploadCV, confirmCVProfile, getCVProfile } from "@/lib/api/users";
import { ParsedCVProfile } from "@/types";
import {
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Upload,
  X,
  Plus,
  UserCheck,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";

function getApiErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
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
    if (messages.length > 0) return messages.join("; ");
  }
  const message = (err as { message?: unknown })?.message;
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
}

const STEPS = [
  { n: 1, label: "Account created" },
  { n: 2, label: "Upload your CV" },
  { n: 3, label: "Browse jobs" },
];

const FEATURES = [
  {
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    title: "Instant parsing",
    desc: "Your CV is analysed in seconds — no manual entry needed.",
  },
  {
    icon: Shield,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    title: "Private & secure",
    desc: "Your file is stored securely and only accessible by you.",
  },
  {
    icon: Sparkles,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200",
    title: "Better job matches",
    desc: "Jobs are ranked by how well they match your actual profile.",
  },
];

export default function UploadCVPage() {
  const router = useRouter();
  const initializedRef = useRef(false);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [extracted, setExtracted] = useState<ParsedCVProfile | null>(null);
  const [cvSaved, setCvSaved] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "";
      setUserName(name);
      setLoading(false);

      getCVProfile()
        .then((profile) => {
          if (profile?.parsed_cv) {
            setCvSaved(true);
            setExtracted(profile.parsed_cv);
          }
        })
        .catch(() => {});
    });
  }, [router]);

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadCV(file);
      setExtracted(result.extracted);
      toast.success("CV parsed! Review and confirm the fields below.");
    } catch (err: unknown) {
      const msg = getApiErrorMessage(
        err,
        "Could not parse CV. Please try a valid PDF/DOC/DOCX under 5MB."
      );
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  const handleConfirm = async () => {
    if (!extracted) return;
    setConfirming(true);
    try {
      await confirmCVProfile(extracted);
      setCvSaved(true);
      toast.success("Profile saved! Your job matches are now personalised.");
    } catch (err: unknown) {
      const msg = getApiErrorMessage(
        err,
        "Failed to save profile — you can try again later."
      );
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  const removeSkill = (skill: string) => {
    if (!extracted) return;
    setExtracted({
      ...extracted,
      skills: extracted.skills.filter((s) => s !== skill),
    });
  };

  const addSkill = () => {
    if (!newSkill.trim() || !extracted) return;
    if (!extracted.skills.includes(newSkill.trim())) {
      setExtracted({
        ...extracted,
        skills: [...extracted.skills, newSkill.trim()],
      });
    }
    setNewSkill("");
  };

  const handleContinue = () => router.push("/jobs");

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-5 py-3.5 rounded-2xl text-[15px] font-bold text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner";

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-400/10 blur-[120px] -z-10 rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-400/10 blur-[120px] -z-10 rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 overflow-hidden cursor-pointer"
          >
             <div 
               className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] shadow-sm transform transition-transform hover:scale-105"
               style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", boxShadow: "0 6px 16px rgba(59,130,246,0.3)" }}
             >
               <Briefcase className="h-[22px] w-[22px] text-white" />
             </div>
             <span className="text-[22px] font-extrabold tracking-tight text-slate-800 leading-tight">Hirely</span>
          </Link>

          <button
            onClick={handleContinue}
            className="flex items-center gap-2 text-[14px] font-bold text-slate-500 hover:text-slate-900 transition-colors py-2 px-4 rounded-xl hover:bg-slate-200/50"
          >
            Skip for now <ArrowRight className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Step progress */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 mb-16 md:mb-20">
            {STEPS.map((step, i) => {
              const isActive = step.n === 2;
              const isDone = step.n === 1;
              return (
                <div key={step.n} className="flex items-center gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-[14px] transition-all duration-300 ${
                        isDone
                          ? "bg-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)]"
                          : isActive
                          ? "bg-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] border-2 border-blue-100"
                          : "bg-slate-200 text-slate-500 border border-slate-300"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={3} />
                      ) : (
                        step.n
                      )}
                    </div>
                    <span
                      className={`text-[14px] font-bold ${
                        isDone || isActive ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-12 h-1 rounded-full bg-slate-200" />
                  )}
                </div>
              );
            })}
          </motion.div>

          {/* Two-column layout grid */}
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-start">
            {/* Left — copy */}
            <motion.div variants={itemVariants} className="space-y-10 lg:sticky lg:top-32">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-100 bg-indigo-50 text-[12px] font-bold uppercase tracking-widest text-indigo-700 mb-6 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  Personalised matches
                </div>

                <h1 className="text-4xl md:text-[56px] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
                  {userName ? (
                    <>
                      Welcome,{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        {userName.split(" ")[0]}!
                      </span>
                    </>
                  ) : (
                    "Almost there!"
                  )}
                  <br />
                  <span className="text-slate-400 font-bold text-3xl md:text-[40px] mt-2 block">
                    Upload your CV
                  </span>
                </h1>

                <p className="text-slate-500 text-[18px] leading-relaxed font-medium max-w-lg">
                  We'll extract your skills, experience, and title to automatically rank every visa-sponsored job against your profile.
                </p>
              </div>

              <div className="space-y-6 pt-8 border-t border-slate-200/80">
                {FEATURES.map((f, i) => {
                  const Icon = f.icon;
                  // Map legacy colors to new design system classes dynamically
                  const colorMap: Record<string, {text: string, bg: string}> = {
                     "text-amber-600": { text: "text-amber-600", bg: "bg-amber-50" },
                     "text-emerald-600": { text: "text-emerald-600", bg: "bg-emerald-50" },
                     "text-indigo-600": { text: "text-blue-600", bg: "bg-blue-50" }
                  };
                  const styles = colorMap[f.color] || { text: "text-slate-600", bg: "bg-slate-50" };

                  return (
                    <motion.div 
                      key={f.title} 
                      className="flex items-start gap-5 p-4 rounded-[24px] hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all duration-300 group"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                    >
                      <div
                        className={`shrink-0 flex h-14 w-14 items-center justify-center rounded-[16px] transition-transform duration-300 group-hover:scale-110 shadow-sm border border-slate-100 ${styles.bg}`}
                      >
                        <Icon className={`h-6 w-6 ${styles.text}`} strokeWidth={2.5} />
                      </div>
                      <div className="pt-1">
                        <p className="text-[17px] font-extrabold text-slate-800">
                          {f.title}
                        </p>
                        <p className="text-[14px] text-slate-500 mt-1 font-medium leading-relaxed max-w-sm">
                          {f.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right — upload card */}
            <motion.div variants={itemVariants} className="rounded-[32px] border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden relative min-h-[500px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
              <div className="p-8 md:p-12 relative z-10 w-full h-full flex flex-col justify-center">
                  {/* Already saved — no extracted data shown */}
                  {cvSaved && !extracted ? (
                    <motion.div
                      key="already-saved"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-center space-y-8"
                    >
                      <div className="flex justify-center">
                        <div className="h-24 w-24 rounded-[24px] bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-inner mx-auto text-emerald-500">
                          <UserCheck className="h-12 w-12" strokeWidth={2.5} />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
                          Profile Verified!
                        </h2>
                        <p className="text-slate-500 font-medium text-[16px] max-w-xs mx-auto">
                          Your profile is locked in. Let's find some visa-sponsored roles.
                        </p>
                      </div>
                      <div className="space-y-4 pt-4 max-w-md mx-auto">
                        <button
                          onClick={handleContinue}
                          className="w-full flex items-center justify-center gap-3 py-4 rounded-[16px] font-bold text-[16px] text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)]"
                        >
                          <LayoutDashboard className="h-5 w-5" strokeWidth={2.5} />
                          View Job Matches
                        </button>
                        <button
                          onClick={() => setCvSaved(false)}
                          className="w-full text-[14px] font-bold text-slate-400 hover:text-slate-800 transition-colors py-2"
                        >
                          Upload a different CV
                        </button>
                      </div>
                    </motion.div>
                  ) : cvSaved && extracted ? (
                    /* Confirmed summary */
                    <motion.div
                      key="confirmed"
                      className="space-y-8"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <div className="text-center py-2">
                        <div className="h-20 w-20 rounded-[24px] bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-inner mx-auto mb-6 text-emerald-500">
                          <CheckCircle2 className="h-10 w-10" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-[28px] font-extrabold text-slate-900 mb-2">
                          CV profile saved!
                        </h2>
                        <p className="text-slate-500 font-medium text-[15px]">
                          <span className="font-bold text-slate-700">{extracted.skills?.length || 0} skills detected</span>. We're ready to find matches.
                        </p>
                      </div>

                      {/* Summary Grid */}
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50/50 p-6 space-y-4 shadow-inner">
                        {extracted.job_title && (
                          <div className="flex justify-between items-center text-[15px]">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[12px]">Job title</span>
                            <span className="font-extrabold text-slate-800">
                              {extracted.job_title}
                            </span>
                          </div>
                        )}
                        {extracted.experience_years != null && (
                          <div className="flex justify-between items-center text-[15px] pt-3 border-t border-slate-200/60">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[12px]">Experience</span>
                            <span className="font-extrabold text-slate-800">
                              {extracted.experience_years} years
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[15px] pt-3 border-t border-slate-200/60">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[12px]">Skills</span>
                          <span className="font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                            {extracted.skills?.length || 0} skills
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <button
                          onClick={handleContinue}
                          className="w-full flex items-center justify-center gap-2 py-4 rounded-[16px] font-bold text-[16px] text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)]"
                        >
                          View Job Matches <ArrowRight className="h-5 w-5" strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => { setCvSaved(false); setExtracted(null); }}
                          className="w-full text-[14px] font-bold text-slate-400 hover:text-slate-800 transition-colors py-2"
                        >
                          Upload a different CV
                        </button>
                      </div>
                    </motion.div>
                  ) : extracted ? (
                    /* Review extracted fields */
                    <motion.div
                      key="review"
                      className="space-y-8"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div className="border-b border-slate-100 pb-6">
                        <h2 className="text-[28px] font-extrabold text-slate-900 mb-2">
                          Review Extracted Profile
                        </h2>
                        <p className="text-slate-500 font-medium">
                          We've extracted the following from your CV. Edit anything that looks wrong before continuing.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Job Title
                          </label>
                          <input
                            value={extracted?.job_title || ""}
                            onChange={(e) =>
                              extracted && setExtracted({
                                ...extracted,
                                job_title: e.target.value,
                              } as ParsedCVProfile)
                            }
                            placeholder="e.g. Senior Software Engineer"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Years of Experience
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={extracted.experience_years ?? ""}
                            onChange={(e) =>
                              extracted && setExtracted({
                                ...extracted,
                                experience_years: e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              } as ParsedCVProfile)
                            }
                            placeholder="e.g. 4.5"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Extracted Skills <span className="bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-md">{extracted?.skills?.length || 0}</span>
                          </label>
                          <div className="flex flex-wrap gap-2.5 mb-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-200">
                            {(!extracted?.skills || extracted.skills.length === 0) && <span className="text-slate-400 text-sm font-medium italic">No skills extracted automatically</span>}
                            {(extracted?.skills || []).map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-bold shadow-sm border border-slate-200 bg-white text-slate-700 hover:border-slate-300 transition-colors"
                              >
                                {skill}
                                <button
                                  onClick={() => removeSkill(skill)}
                                  className="text-slate-400 hover:text-red-500 transition-colors ml-1 p-0.5 rounded-md hover:bg-red-50"
                                >
                                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-3">
                            <input
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && addSkill()
                              }
                              placeholder="Type a skill & hit Enter"
                              className={inputClass + " flex-1"}
                            />
                            <button
                              onClick={addSkill}
                              className="flex items-center justify-center h-full px-5 rounded-[14px] text-[14px] font-bold text-slate-600 bg-white shadow-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0"
                            >
                              <Plus className="h-5 w-5" strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <button
                          onClick={handleConfirm}
                          disabled={confirming}
                          className="w-full flex items-center justify-center gap-2 py-4 rounded-[16px] font-bold text-[16px] text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {confirming ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5" strokeWidth={3} />
                          )}
                          {confirming ? "Saving Profile..." : "Confirm & Save Profile"}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* Default upload zone */
                    <motion.div
                      key="upload"
                      className="space-y-8 flex flex-col h-full justify-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <div className="text-center">
                        <h2 className="text-[32px] font-extrabold text-slate-900 mb-3 tracking-tight">
                          Upload your CV
                        </h2>
                        <p className="text-slate-500 font-medium text-[16px]">
                          <strong>PDF, DOC, or DOCX</strong> up to 5MB.
                        </p>
                      </div>

                      {/* Drop zone */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        className={`relative group cursor-pointer rounded-[32px] border-2 border-dashed p-10 md:p-14 text-center transition-all duration-300 w-full ${
                          dragOver
                            ? "border-blue-400 bg-blue-50/80 scale-[1.02]"
                            : uploading
                            ? "border-blue-200 bg-slate-50/50"
                            : "border-slate-300 bg-slate-50/80 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-lg hover:shadow-blue-900/5"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        {uploading ? (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                            <Loader2 className="h-14 w-14 animate-spin text-blue-600 mb-6" strokeWidth={2.5} />
                            <p className="text-[18px] font-extrabold text-slate-900">
                              Reading your CV...
                            </p>
                            <p className="text-[14px] text-slate-500 mt-2 font-medium">
                              This won't take long.
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                            <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-[24px] bg-white border border-slate-200 shadow-sm mb-6 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 ease-out group-hover:shadow-[0_8px_30px_rgba(37,99,235,0.12)]">
                              <Upload className="h-10 w-10 text-slate-300 group-hover:text-blue-600 transition-colors duration-300" strokeWidth={2.5} />
                            </div>
                            <p className="text-[18px] font-extrabold text-slate-800 tracking-tight">
                              Drag and drop your CV here
                            </p>
                            <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                              Or click to upload a file
                            </p>
                          </motion.div>
                        )}
                      </div>

                      <div className="pt-4 flex justify-center">
                        <button
                          onClick={handleContinue}
                          className="text-[14px] font-bold text-slate-400 hover:text-slate-800 transition-colors py-2 px-6 rounded-full hover:bg-slate-100"
                        >
                          Skip for now and go to jobs
                        </button>
                      </div>
                    </motion.div>
                  )}
              </div>
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
