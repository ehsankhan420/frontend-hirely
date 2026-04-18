import { createClient } from "@/lib/supabase/client";
import apiClient from "./client";
import { User, ParsedCVProfile } from "@/types";

type ApiLikeError = Error & { response?: { data?: { detail?: string } } };

function detailError(message: string): ApiLikeError {
  const error = new Error(message) as ApiLikeError;
  error.response = { data: { detail: message } };
  return error;
}

async function requireAuth() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw detailError("You must be signed in to continue.");
  }
  return { supabase, user: data.user };
}

async function requireAccessToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw detailError("You must be signed in to use CV tools.");
  }

  return session.access_token;
}

function fallbackUserFromAuth(authUser: {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: { full_name?: string; name?: string };
}): User {
  return {
    id: authUser.id,
    email: authUser.email || "",
    name: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
    role: "free",
    is_active: true,
    created_at: authUser.created_at || new Date().toISOString(),
    parsed_cv: undefined,
  };
}

export async function getMe(): Promise<User> {
  const { supabase, user } = await requireAuth();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw detailError(error.message || "Failed to load profile.");
  }

  return (data as User | null) || fallbackUserFromAuth(user);
}

export async function updateMe(updates: { name?: string; location_preference?: string }): Promise<User> {
  const { supabase, user } = await requireAuth();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw detailError(error?.message || "Failed to update profile.");
  }

  return data as User;
}

export async function deleteAccount(): Promise<void> {
  const { supabase, user } = await requireAuth();
  const { error } = await supabase
    .from("users")
    .update({
      is_active: false,
      parsed_cv: null,
      cv_file_path: null,
    })
    .eq("id", user.id);

  if (error) {
    throw detailError(error.message || "Failed to delete account.");
  }
}

export async function uploadCV(file: File): Promise<{ extracted: ParsedCVProfile; message: string }> {
  const allowedExtensions = ["pdf", "doc", "docx"];
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (!allowedExtensions.includes(extension)) {
    throw detailError("Unsupported file type. Allowed: PDF, DOC, DOCX.");
  }

  const formData = new FormData();
  formData.append("file", file, file.name);

  const accessToken = await requireAccessToken();

  const { data } = await apiClient.post("/api/cv/upload", formData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return data;
}

export async function confirmCVProfile(profile: ParsedCVProfile): Promise<User> {
  const accessToken = await requireAccessToken();
  const { data } = await apiClient.post("/api/cv/confirm", profile, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return data as User;
}

export async function getCVProfile() {
  const accessToken = await requireAccessToken();
  const { data } = await apiClient.get("/api/cv/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return data;
}
