import axios from "axios";
import { createClient } from "@/lib/supabase/client";

const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_URL = configuredApiUrl || (isLocalHost ? "http://localhost:8000" : "");

const apiClient = axios.create({
  baseURL: API_URL || undefined,
});

// Attach Supabase JWT to every request
apiClient.interceptors.request.use(async (config) => {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured for this environment.");
  }

  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

export default apiClient;
