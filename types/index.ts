export type UserRole = "free" | "premium" | "admin";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  is_active: boolean;
  cv_file_path?: string;
  parsed_cv?: ParsedCVProfile;
  stripe_customer_id?: string;
  location_preference?: string;
  created_at: string;
}

export interface ExperienceBreakdownItem {
  role: string;
  period: string;
  years: number;
}

export interface ParsedCVProfile {
  job_title?: string;
  skills: string[];
  experience_years?: number;
  experience_breakdown?: ExperienceBreakdownItem[];
  location_preference?: string;
  raw_text_preview?: string;
}

export type JobType = "full-time" | "part-time" | "contract";
export type SeniorityLevel = "junior" | "mid" | "senior";
export type MatchColour = "green" | "amber" | "grey";

export interface Job {
  id: string;
  title: string;
  company_name: string;
  company_id?: string;
  location: string;
  job_type: JobType;
  salary_min?: number;
  salary_max?: number;
  description: string;
  required_skills: string[];
  apply_url: string;
  posted_date: string;
  expiry_date?: string;
  is_active: boolean;
  sponsorship_confirmed: boolean;
  seniority_level: SeniorityLevel;
  created_at: string;
  scraper_source?: "linkedin" | "indeed" | "manual";
  session_id?: string;
  scraped_at?: string;
}

export interface JobWithMatch extends Job {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  is_saved: boolean;
}

export interface JobListResponse {
  jobs: JobWithMatch[];
  total_count: number;
  returned_count: number;
  is_limited: boolean;
}

export interface MatchBreakdown {
  total_score: number;
  title_score: number;
  skills_score: number;
  location_score: number;
  experience_score: number;
  matched_skills: string[];
  missing_skills: string[];
}

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "rejected"
  | "offered";

export interface SavedJob {
  id: string;
  job_id: string;
  user_id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  job?: Job;
}

export interface SponsorLicence {
  id: string;
  organisation_name: string;
  town?: string;
  county?: string;
  type_rating?: string;
  route?: string;
  is_active: boolean;
  last_updated?: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  premium_users: number;
  free_users: number;
  new_this_month: number;
  total_active_jobs: number;
  total_sponsors: number;
}

export interface JobFilters {
  search?: string;
  location?: string;
  job_type?: JobType;
  salary_min?: number;
  salary_max?: number;
  scraper_source?: "linkedin" | "indeed";
  sort?: "match" | "recent" | "salary";
}
