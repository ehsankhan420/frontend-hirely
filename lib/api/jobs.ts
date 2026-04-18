import { createClient } from "@/lib/supabase/client";
import { getMe } from "./users";
import { Job, JobFilters, JobListResponse, JobWithMatch, MatchBreakdown, ParsedCVProfile, User } from "@/types";

const FREE_JOB_LIMIT = 5;

type ApiLikeError = Error & { response?: { data?: { detail?: string } } };

function detailError(message: string): ApiLikeError {
  const error = new Error(message) as ApiLikeError;
  error.response = { data: { detail: message } };
  return error;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function titleScore(userTitle: string | undefined, jobTitle: string): number {
  if (!userTitle) return 5;

  const normalizedUser = normalizeText(userTitle);
  const normalizedJob = normalizeText(jobTitle);
  if (!normalizedUser || !normalizedJob) return 5;
  if (normalizedUser === normalizedJob) return 40;

  const userTokens = new Set(normalizedUser.split(" ").filter(Boolean));
  const jobTokens = new Set(normalizedJob.split(" ").filter(Boolean));
  const intersectionCount = Array.from(userTokens).filter((token) => jobTokens.has(token)).length;
  const unionCount = new Set([...Array.from(userTokens), ...Array.from(jobTokens)]).size || 1;
  const jaccard = intersectionCount / unionCount;
  const containsBoost = normalizedJob.includes(normalizedUser) || normalizedUser.includes(normalizedJob) ? 0.2 : 0;
  const scoreRatio = Math.min(1, jaccard + containsBoost);

  return Math.round(scoreRatio * 40);
}

function skillsScore(userSkills: string[], requiredSkills: string[]): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  if (!requiredSkills.length) {
    return { score: 20, matchedSkills: [], missingSkills: [] };
  }

  const userSkillsLower = new Set(userSkills.map((skill) => skill.toLowerCase()));
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  requiredSkills.forEach((skill) => {
    if (userSkillsLower.has(skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const ratio = matchedSkills.length / requiredSkills.length;
  return { score: Math.round(ratio * 40), matchedSkills, missingSkills };
}

function locationScore(userLocation: string | undefined, jobLocation: string): number {
  if (!userLocation) return 5;

  const jobLoc = jobLocation.toLowerCase();
  const userLoc = userLocation.toLowerCase();

  if (jobLoc.includes("remote") || userLoc.includes("remote")) return 10;
  if (jobLoc.includes(userLoc) || userLoc.includes(jobLoc)) return 10;
  if (userLoc.split(",").some((part) => part.trim() && jobLoc.includes(part.trim()))) return 7;

  return 0;
}

function experienceScore(userYears: number | undefined, seniorityLevel: Job["seniority_level"]): number {
  if (userYears === undefined || userYears === null) return 5;

  const bands: Record<Job["seniority_level"], [number, number]> = {
    junior: [0, 2],
    mid: [3, 5],
    senior: [6, 99],
  };
  const [minYears, maxYears] = bands[seniorityLevel] || [3, 5];

  if (userYears >= minYears && userYears <= maxYears) return 10;
  if (userYears > maxYears) return 7;

  const ratio = userYears / Math.max(minYears, 1);
  return Math.round(ratio * 10);
}

function computeMatch(job: Job, user: User): MatchBreakdown {
  const parsedCV = ((user.parsed_cv || {}) as ParsedCVProfile) || { skills: [] };
  const userSkills = parsedCV.skills || [];
  const tScore = titleScore(parsedCV.job_title, job.title);
  const sScore = skillsScore(userSkills, job.required_skills || []);
  const lScore = locationScore(user.location_preference, job.location);
  const eScore = experienceScore(parsedCV.experience_years, job.seniority_level);

  return {
    total_score: tScore + sScore.score + lScore + eScore,
    title_score: tScore,
    skills_score: sScore.score,
    location_score: lScore,
    experience_score: eScore,
    matched_skills: sScore.matchedSkills,
    missing_skills: sScore.missingSkills,
  };
}

function toJobWithMatch(job: Job, user: User, savedJobIds: Set<string>): JobWithMatch {
  const match = computeMatch(job, user);
  return {
    ...job,
    match_score: match.total_score,
    matched_skills: match.matched_skills,
    missing_skills: match.missing_skills,
    is_saved: savedJobIds.has(job.id),
  };
}

async function getSavedJobIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("job_id")
    .eq("user_id", userId);

  if (error) {
    throw detailError(error.message || "Failed to load saved jobs.");
  }

  return new Set((data || []).map((row) => String(row.job_id)));
}

export async function getJobs(filters: JobFilters = {}): Promise<JobListResponse> {
  const supabase = createClient();
  const currentUser = await getMe();

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("is_active", true)
    .eq("sponsorship_confirmed", true);

  if (filters.search) {
    const safeSearch = filters.search.replace(/,/g, " ").trim();
    query = query.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,company_name.ilike.%${safeSearch}%`);
  }
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);
  if (filters.job_type) query = query.eq("job_type", filters.job_type);
  if (filters.salary_min !== undefined) query = query.gte("salary_min", filters.salary_min);
  if (filters.salary_max !== undefined) query = query.lte("salary_max", filters.salary_max);

  const { data, error } = await query;
  if (error) {
    throw detailError(error.message || "Failed to load jobs.");
  }

  const jobs = (data || []) as Job[];
  const savedJobIds = await getSavedJobIds(currentUser.id);
  const jobsWithMatch = jobs.map((job) => toJobWithMatch(job, currentUser, savedJobIds));
  const sortMode = filters.sort || "match";

  if (sortMode === "match") {
    jobsWithMatch.sort((a, b) => b.match_score - a.match_score);
  } else if (sortMode === "recent") {
    jobsWithMatch.sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime());
  } else if (sortMode === "salary") {
    jobsWithMatch.sort((a, b) => (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0));
  }

  const totalCount = jobsWithMatch.length;
  let returnedJobs = jobsWithMatch;
  let isLimited = false;

  if (currentUser.role === "free") {
    returnedJobs = jobsWithMatch.slice(0, FREE_JOB_LIMIT);
    isLimited = true;
  }

  return {
    jobs: returnedJobs,
    total_count: totalCount,
    returned_count: returnedJobs.length,
    is_limited: isLimited,
  };
}

export async function getJob(id: string): Promise<JobWithMatch> {
  const supabase = createClient();
  const currentUser = await getMe();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    throw detailError(error?.message || "Job not found.");
  }

  const savedJobIds = await getSavedJobIds(currentUser.id);
  return toJobWithMatch(data as Job, currentUser, savedJobIds);
}

export async function getMatchBreakdown(id: string): Promise<MatchBreakdown> {
  const supabase = createClient();
  const currentUser = await getMe();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    throw detailError(error?.message || "Job not found.");
  }

  return computeMatch(data as Job, currentUser);
}

export async function createJob(jobData: Record<string, unknown>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert(jobData)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw detailError(error?.message || "Failed to create job.");
  }

  return data;
}

export async function updateJob(id: string, jobData: Record<string, unknown>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update(jobData)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw detailError(error?.message || "Failed to update job.");
  }

  return data;
}

export async function deleteJob(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    throw detailError(error.message || "Failed to delete job.");
  }
}
