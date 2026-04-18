import { createClient } from "@/lib/supabase/client";
import { getMe } from "./users";
import { SavedJob, ApplicationStatus } from "@/types";

const FREE_SAVED_JOBS_LIMIT = 3;

type ApiLikeError = Error & { response?: { data?: { detail?: string } } };

function detailError(message: string): ApiLikeError {
  const error = new Error(message) as ApiLikeError;
  error.response = { data: { detail: message } };
  return error;
}

function normalizeSavedJobRow(row: Record<string, unknown>): SavedJob {
  const jobData = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
  return {
    id: String(row.id),
    job_id: String(row.job_id),
    user_id: String(row.user_id),
    status: row.status as ApplicationStatus,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    job: (jobData || undefined) as SavedJob["job"],
  };
}

export async function getSavedJobs(): Promise<SavedJob[]> {
  const currentUser = await getMe();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*, jobs(*)")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw detailError(error.message || "Failed to load saved jobs.");
  }

  return (data || []).map((row) => normalizeSavedJobRow(row as Record<string, unknown>));
}

export async function saveJob(jobId: string): Promise<SavedJob> {
  const currentUser = await getMe();
  const supabase = createClient();

  if (currentUser.role === "free") {
    const { count, error: countError } = await supabase
      .from("saved_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id);

    if (countError) {
      throw detailError(countError.message || "Failed to validate saved-jobs limit.");
    }

    if ((count || 0) >= FREE_SAVED_JOBS_LIMIT) {
      throw detailError(
        `Free plan allows saving up to ${FREE_SAVED_JOBS_LIMIT} jobs. Upgrade to Premium for unlimited saves.`
      );
    }
  }

  const { data: jobData, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("is_active", true)
    .maybeSingle();

  if (jobError || !jobData) {
    throw detailError(jobError?.message || "Job not found.");
  }

  const { data, error } = await supabase
    .from("saved_jobs")
    .insert({
      user_id: currentUser.id,
      job_id: jobId,
      status: "saved",
    })
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw detailError("Job already saved.");
    }
    throw detailError(error.message || "Failed to save job.");
  }

  if (!data) {
    throw detailError("Failed to save job.");
  }

  return {
    ...(data as SavedJob),
    job: jobData,
  };
}

export async function updateSavedJobStatus(
  savedJobId: string,
  status: ApplicationStatus
): Promise<SavedJob> {
  const currentUser = await getMe();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("saved_jobs")
    .update({ status })
    .eq("id", savedJobId)
    .eq("user_id", currentUser.id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw detailError(error?.message || "Saved job not found.");
  }

  const { data: jobData } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", data.job_id)
    .maybeSingle();

  return {
    ...(data as SavedJob),
    job: (jobData || undefined) as SavedJob["job"],
  };
}

export async function unsaveJob(savedJobId: string): Promise<void> {
  const currentUser = await getMe();
  const supabase = createClient();
  const { error } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("id", savedJobId)
    .eq("user_id", currentUser.id);

  if (error) {
    throw detailError(error.message || "Failed to remove saved job.");
  }
}

export async function unsaveJobByJobId(jobId: string): Promise<void> {
  const currentUser = await getMe();
  const supabase = createClient();
  const { error } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("job_id", jobId)
    .eq("user_id", currentUser.id);

  if (error) {
    throw detailError(error.message || "Failed to remove saved job.");
  }
}
