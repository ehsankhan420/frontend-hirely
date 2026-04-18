"use client";

import Link from "next/link";
import { useState } from "react";
import MatchScoreBadge from "./MatchScoreBadge";
import { JobWithMatch } from "@/types";
import { formatSalary, formatDate, getJobTypeBadge } from "@/lib/utils";
import {
  MapPin,
  Building2,
  Bookmark,
  BookmarkCheck,
  Clock,
  ArrowUpRight,
  BadgeCheck,
  DollarSign,
} from "lucide-react";
import { saveJob, unsaveJob, unsaveJobByJobId } from "@/lib/api/savedJobs";
import { toast } from "sonner";

interface JobCardProps {
  job: JobWithMatch;
  savedJobId?: string;
  onSaveToggle?: (jobId: string, saved: boolean) => void;
}

const JOB_TYPE_COLORS: Record<string, string> = {
  "full-time": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "part-time": "text-sky-700 bg-sky-50 border-sky-200",
  contract: "text-amber-700 bg-amber-50 border-amber-200",
  remote: "text-indigo-700 bg-indigo-50 border-indigo-200",
};

export default function JobCard({ job, savedJobId, onSaveToggle }: JobCardProps) {
  const [isSaved, setIsSaved] = useState(job.is_saved);
  const [currentSavedId, setCurrentSavedId] = useState(savedJobId);
  const [saving, setSaving] = useState(false);

  const skillsCoverage = job.required_skills.length
    ? Math.round((job.matched_skills.length / job.required_skills.length) * 100)
    : 0;

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      if (isSaved) {
        if (currentSavedId) await unsaveJob(currentSavedId);
        else await unsaveJobByJobId(job.id);
        setIsSaved(false);
        setCurrentSavedId(undefined);
        toast.success("Job removed from saved");
        onSaveToggle?.(job.id, false);
      } else {
        const saved = await saveJob(job.id);
        setIsSaved(true);
        setCurrentSavedId(saved.id);
        toast.success("Job saved!");
        onSaveToggle?.(job.id, true);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to update saved jobs";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const scoreColor =
    job.match_score >= 70
      ? "bg-emerald-500"
      : job.match_score >= 50
      ? "bg-amber-500"
      : "bg-slate-400";

  return (
    <Link href={`/jobs/${job.id}`} className="block h-full">
      <div className="group relative h-full bg-white/80 backdrop-blur-xl rounded-[24px] border border-slate-200/80 overflow-hidden cursor-pointer transition-all duration-300 hover:border-blue-400 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] flex flex-col hover:-translate-y-1">
        {/* Score accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${scoreColor} opacity-90 transition-all duration-300 group-hover:h-2 group-hover:opacity-100 z-10`} />

        {/* Top row: badges + save */}
        <div className="relative flex items-center justify-between px-6 pt-6 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <MatchScoreBadge score={job.match_score} size="sm" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border text-sky-700 bg-sky-50 border-sky-200">
              <BadgeCheck className="h-3.5 w-3.5" />
              Sponsor Verified
            </span>
          </div>
          <button
            onClick={handleSaveToggle}
            disabled={saving}
            className={`p-2 rounded-[12px] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none ${
              isSaved
                ? "text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                : "text-slate-400 border border-transparent hover:border-slate-200 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 flex-1 flex flex-col">
          <h3 className="text-[20px] font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
            {job.title}
          </h3>

          <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[14.5px] font-medium text-slate-600">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Building2 className="h-4 w-4 text-slate-400" />
              {job.company_name}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" />
              {job.location}
            </span>
          </div>

          {/* Chips row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-[10px] text-[12px] font-bold border capitalize ${
                JOB_TYPE_COLORS[job.job_type] ||
                "text-slate-700 bg-slate-100 border-slate-200"
              }`}
            >
              {getJobTypeBadge(job.job_type)}
            </span>
            {(job.salary_min || job.salary_max) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-[10px] text-[12px] font-bold border text-emerald-700 bg-emerald-50 border-emerald-200">
                <DollarSign className="h-3.5 w-3.5" />
                {formatSalary(job.salary_min, job.salary_max)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 font-bold ml-auto">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(job.posted_date)}
            </span>
          </div>

          {/* Spacer to push skills/footer to bottom */}
          <div className="flex-1" />

          {/* Skills coverage divider */}
          {job.required_skills.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between text-[12px] mb-2.5">
                <span className="font-bold uppercase tracking-widest text-slate-400">Skills match</span>
                <span className="font-extrabold text-slate-700">
                  {job.matched_skills.length}/{job.required_skills.length}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${scoreColor}`}
                  style={{ width: `${skillsCoverage}%` }}
                />
              </div>

              {/* Matched skills chips */}
              {job.matched_skills.length > 0 && (
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {job.matched_skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-bold tracking-wide text-slate-700 bg-slate-50 border border-slate-200 shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.matched_skills.length > 4 && (
                    <span className="inline-flex items-center px-2 py-1 text-[11px] font-bold text-slate-400">
                      +{job.matched_skills.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Subtext view */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[14px] font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
            View full details
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </Link>
  );
}
