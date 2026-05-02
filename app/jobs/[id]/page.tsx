"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import MatchScoreBadge from "@/components/jobs/MatchScoreBadge";
import { getJob, getMatchBreakdown } from "@/lib/api/jobs";
import { saveJob, unsaveJob, unsaveJobByJobId } from "@/lib/api/savedJobs";
import { getMe } from "@/lib/api/users";
import { JobWithMatch, MatchBreakdown, User } from "@/types";
import { formatSalary, formatDate, getJobTypeBadge } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  CheckCircle2,
  XCircle,
  CircleAlert,
  Gauge,
  Target,
  Trophy,
  BadgeCheck,
  Sparkles,
  DollarSign,
  Layers,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

function scoreTextColor(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 75) return "text-emerald-700";
  if (pct >= 40) return "text-amber-700";
  return "text-slate-500";
}

function scoreBgColor(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-slate-400";
}

function normalizeSkillToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of skills) {
    const skill = (raw || "").trim();
    if (!skill) continue;
    const key = normalizeSkillToken(skill);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(skill);
  }
  return out;
}

const JOB_TYPE_COLORS: Record<string, string> = {
  "full-time": "text-emerald-700 bg-emerald-50 border-emerald-200",
  "part-time": "text-sky-700 bg-sky-50 border-sky-200",
  contract: "text-amber-700 bg-amber-50 border-amber-200",
  remote: "text-indigo-700 bg-indigo-50 border-indigo-200",
};

// ─── Animated score bar ─────────────────────────────────────────────────────────
function ScoreBar({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  const pct = (score / max) * 100;
  const textColor = scoreTextColor(score, max);
  const bgColor = scoreBgColor(score, max);

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className={`font-semibold ${textColor}`}>
          {score}
          <span className="text-slate-400 font-normal">/{max}</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          style={{ width: `${pct}%` }}
          className={`h-full rounded-full transition-all duration-700 ${bgColor}`}
        />
      </div>
    </div>
  );
}

// ─── Glass section card ─────────────────────────────────────────────────────────
function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">{title}</h2>
    </div>
  );
}

// ─── Smart Job Description Formatter ──────────────────────────────────────────
function JobDescriptionFormatter({ text, companyName }: { text: string; companyName?: string }) {
  if (!text) return null;

  const baseHeaders = [
    "About the Role",
    "About Us",
    "Key Responsibilities",
    "Responsibilities",
    "What You'll Do",
    "What You Will Do",
    "Requirements",
    "Qualifications",
    "Required Skills",
    "Bonus Points",
    "Nice to Have",
    "Benefits",
    "What We Offer",
    "Platform Modernization & Cloud Architecture",
    "Cross-Functional Collaboration & Support",
    "Back-End & Full Stack Development",
    "Technical Skills & Experience",
    "Essential",
    "Desirable",
    "Why You'll Love working here",
    "Why You’ll Love working here",
    "Your Role",
    "The Role"
  ];

  const headers = [...baseHeaders];
  if (companyName) {
    headers.push(`About ${companyName}`);
  }

  // Also match ALL CAPS versions of these headers
  const allCapsHeaders = headers.map(h => h.toUpperCase());
  const matchHeaders = [...headers, ...allCapsHeaders];

  let processedText = text;

  // Add newlines before bullet points (•, ●, ▪, or ' - ')
  processedText = processedText.replace(/([•●▪]|\s-\s)/g, '\n$1');

  // Add newlines and bold markers around headers
  // Using case-sensitive matching (no 'i' flag) so we don't accidentally match lowercase words like "requirements" mid-sentence.
  matchHeaders.forEach(header => {
    // Regex for exact match, case sensitive, optionally followed by a colon
    // We use a safe boundary match that handles punctuation
    const regex = new RegExp(`(^|\\s)(${header}:?)(\\s|$)`, 'g');
    processedText = processedText.replace(regex, '$1\n\n###$2###\n\n$3');
  });

  // Clean up excessive newlines
  processedText = processedText.replace(/\n{3,}/g, '\n\n').trim();

  // Split into blocks by double newline
  const blocks = processedText.split('\n\n');

  return (
    <div className="space-y-4 text-slate-700 leading-relaxed text-[15px]">
      {blocks.map((block, index) => {
        // If it's a header block
        if (block.includes('###')) {
          const parts = block.split('###');
          return (
            <div key={index} className="space-y-2 mt-8 first:mt-0">
              {parts.map((part, pIdx) => {
                if (pIdx % 2 === 1) {
                  return (
                    <h3 key={pIdx} className="text-[17px] font-extrabold text-slate-900 tracking-tight mt-6 mb-2">
                      {part}
                    </h3>
                  );
                }
                return part.trim() ? (
                  <p key={pIdx} className="whitespace-pre-wrap">{part.trim()}</p>
                ) : null;
              })}
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={index} className="whitespace-pre-wrap">
            {block.trim()}
          </p>
        );
      })}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [job, setJob] = useState<JobWithMatch | null>(null);
  const [breakdown, setBreakdown] = useState<MatchBreakdown | null>(null);
  const [savedJobId, setSavedJobId] = useState<string | undefined>();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getMe(), getJob(jobId), getMatchBreakdown(jobId)])
      .then(([userData, jobData, breakdownData]) => {
        setUser(userData);
        setJob(jobData);
        setBreakdown(breakdownData);
        setIsSaved(jobData.is_saved);
      })
      .catch(() => toast.error("Failed to load job"))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleSaveToggle = async () => {
    setSaving(true);
    try {
      if (isSaved) {
        if (savedJobId) await unsaveJob(savedJobId);
        else await unsaveJobByJobId(jobId);
        setIsSaved(false);
        setSavedJobId(undefined);
        toast.success("Removed from saved jobs");
      } else {
        const saved = await saveJob(jobId);
        setIsSaved(true);
        setSavedJobId(saved.id);
        toast.success("Job saved!");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      toast.error(msg || "Failed to update saved jobs");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <Navbar user={user} />
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-slate-500 text-sm font-medium">Loading job details…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const overallColor = scoreBgColor(job.match_score, 100);
  const requiredSkills = uniqueSkills(job.required_skills || []);
  const matchedSkillKeys = new Set((job.matched_skills || []).map((s) => normalizeSkillToken(s)));
  const matchedSkills = requiredSkills.filter((s) => matchedSkillKeys.has(normalizeSkillToken(s)));
  const missingSkills = requiredSkills.filter((s) => !matchedSkillKeys.has(normalizeSkillToken(s)));
  const hasRequiredSkills = requiredSkills.length > 0;
  const scoreDetails = [
    {
      label: "Job Title match",
      score: breakdown?.title_score || 0,
      max: 40,
      icon: Target,
    },
    {
      label: "Skills overlap",
      score: breakdown?.skills_score || 0,
      max: 40,
      icon: Trophy,
    },
    {
      label: "Location fit",
      score: breakdown?.location_score || 0,
      max: 10,
      icon: MapPin,
    },
    {
      label: "Experience level",
      score: breakdown?.experience_score || 0,
      max: 10,
      icon: Gauge,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Navbar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <Navbar user={user} />
      </div>

      <main className="max-w-[1200px] mx-auto px-4 py-8 space-y-6">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to results
        </button>

        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative p-6 md:p-8 lg:p-10">
            {/* Top row: badges + overall score pill */}
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex flex-wrap items-center gap-2">
                <MatchScoreBadge score={job.match_score} size="md" />
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border text-sky-700 bg-sky-50 border-sky-200">
                  <BadgeCheck className="h-4 w-4" />
                  Sponsor Verified
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border capitalize ${
                    JOB_TYPE_COLORS[job.job_type] ||
                    "text-slate-700 bg-slate-50 border-slate-200"
                  }`}
                >
                  {getJobTypeBadge(job.job_type)}
                </span>
              </div>

              {/* Large score display */}
              <div className="relative flex flex-col items-center justify-center shrink-0">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-2xl ${overallColor} text-white shadow-sm`}
                >
                  <span className="text-3xl font-extrabold leading-none">
                    {job.match_score}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">Overall Match</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="mt-6 text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight max-w-4xl">
              {job.title}
            </h1>

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-base text-slate-600 font-medium">
              <span className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-400" />
                {job.company_name}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-400" />
                {job.location}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" />
                Posted {formatDate(job.posted_date)}
              </span>
            </div>

            {/* Salary */}
            {(job.salary_min || job.salary_max) && (
              <div className="mt-6 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                <DollarSign className="h-5 w-5" />
                <span className="text-lg font-bold">
                  {formatSalary(job.salary_min, job.salary_max)}
                </span>
                {job.job_type === "contract" && (
                  <span className="text-sm font-medium opacity-80">daily rate</span>
                )}
              </div>
            )}
          </div>
          <div className="bg-slate-50 border-t border-slate-100 p-6 md:px-8 lg:px-10">
            {/* Score mini-bars row */}
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Breakdown</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {scoreDetails.map((item) => {
                const Icon = item.icon;
                const pct = Math.round((item.score / item.max) * 100);
                const tColor = scoreTextColor(item.score, item.max);
                const bgColor = scoreBgColor(item.score, item.max);
                return (
                  <div key={item.label}>
                    <div className="flex items-center gap-2 mb-2 text-slate-600">
                      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className={`text-2xl font-bold leading-none ${tColor}`}>
                        {item.score}
                      </span>
                      <span className="text-sm font-medium text-slate-400">
                        /{item.max}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all duration-700 ${bgColor}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Body: 2/3 + 1/3 grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">

          {/* ── Left column ──────────────────────────────────────────────────── */}
          <div className="space-y-8 lg:col-span-2">

            {/* How scored */}
            <SectionCard>
              <SectionHeader title="Match Analysis" icon={Sparkles} />
              <div className="p-6 md:p-8 space-y-6">
                {scoreDetails.map((item) => (
                  <ScoreBar
                    key={item.label}
                    label={item.label}
                    score={item.score}
                    max={item.max}
                  />
                ))}

                {/* Divider + total */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-700">
                    Total Match Score
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                    <span
                      className={`text-2xl font-bold ${scoreTextColor(
                        breakdown?.total_score || job.match_score,
                        100
                      )}`}
                    >
                      {breakdown?.total_score || job.match_score}
                    </span>
                    <span className="text-slate-400 font-medium">/ 100</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Skills fit */}
            <SectionCard>
              <SectionHeader title="Skills Overview" icon={Layers} />
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Matched */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600 mb-4">
                      <CheckCircle2 className="h-5 w-5" />
                      Matched Skills
                      {matchedSkills.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs">
                          {matchedSkills.length}
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {hasRequiredSkills ? (
                        matchedSkills.length > 0 ? (
                          matchedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span
                            className="text-sm text-slate-500 italic"
                          >
                            No direct skill matches found.
                          </span>
                        )
                      ) : (
                        <span className="text-sm text-slate-500 italic">
                          Employer did not list required skills for this job.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Missing */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-rose-600 mb-4">
                      <XCircle className="h-5 w-5" />
                      Missing Skills
                      {missingSkills.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs">
                          {missingSkills.length}
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {hasRequiredSkills ? (
                        missingSkills.length > 0 ? (
                          missingSkills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-sm font-medium text-slate-600"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span
                            className="text-sm text-emerald-600 italic font-medium"
                          >
                            You match all listed required skills.
                          </span>
                        )
                      ) : (
                        <span className="text-sm text-slate-500 italic">
                          No required skill list was provided for this job.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Role description */}
            <SectionCard>
              <SectionHeader title="Full Job Description" icon={GraduationCap} />
              <div className="p-6 md:p-8">
                <JobDescriptionFormatter text={job.description} companyName={job.company_name} />
              </div>
            </SectionCard>
          </div>

          {/* ── Right column (sticky) ─────────────────────────────────────────── */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* CTA card */}
            <SectionCard className="border-indigo-100 shadow-md">
              <div className="p-6 space-y-4">
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <button className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">
                    Apply on company site
                    <ExternalLink className="h-5 w-5" />
                  </button>
                </a>

                <button
                  onClick={handleSaveToggle}
                  disabled={saving}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-base transition-colors border-2 ${
                    isSaved
                      ? "text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                      : "text-slate-600 bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="h-5 w-5" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-5 w-5" />
                      Save for later
                    </>
                  )}
                </button>

                <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-slate-50 text-sm text-slate-600">
                  <CircleAlert className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" />
                  Applications are completed directly on the employer&apos;s platform. We do not track applications.
                </div>
              </div>
            </SectionCard>

            {/* Role details */}
            <SectionCard>
              <SectionHeader title="At a glance" icon={Target} />
              <div className="p-6 space-y-4">
                {[
                  {
                    label: "Job type",
                    value: getJobTypeBadge(job.job_type),
                    pill: JOB_TYPE_COLORS[job.job_type],
                  },
                  {
                    label: "Seniority",
                    value: job.seniority_level,
                    capitalize: true,
                  },
                  { label: "Posted", value: formatDate(job.posted_date) },
                  job.expiry_date
                    ? { label: "Expires", value: formatDate(job.expiry_date) }
                    : null,
                  (job.salary_min || job.salary_max)
                    ? {
                        label: "Salary",
                        value: formatSalary(job.salary_min, job.salary_max),
                      }
                    : null,
                ]
                  .filter(Boolean)
                  .map((item) => (
                    <div
                      key={item!.label}
                      className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <span className="text-sm font-medium text-slate-500">{item!.label}</span>
                      {item!.pill ? (
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${item!.pill}`}
                        >
                          {item!.value}
                        </span>
                      ) : (
                        <span
                          className={`text-sm font-semibold text-slate-900 ${
                            item!.capitalize ? "capitalize" : ""
                          }`}
                        >
                          {item!.value}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </SectionCard>

            {/* Required skills list */}
            {requiredSkills.length > 0 && (
              <SectionCard>
                <SectionHeader title="All Requirements" icon={Trophy} />
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((skill) => {
                      const isMatched = matchedSkillKeys.has(normalizeSkillToken(skill));
                      return (
                        <span
                          key={skill}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${
                            isMatched
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                              : "text-slate-600 bg-slate-50 border-slate-200"
                          }`}
                        >
                          {isMatched ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 ml-1" />
                          )}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 text-sm font-medium text-slate-500">
                    <span className="text-slate-900">{matchedSkills.length}</span> out of {requiredSkills.length} skills matched
                  </div>
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
