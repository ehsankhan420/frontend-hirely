import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { MatchColour } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMatchColour(score: number): MatchColour {
  if (score >= 70) return "green";
  if (score >= 40) return "amber";
  return "grey";
}

export function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return "Salary not specified";
  if (min && max) {
    return `£${(min / 1000).toFixed(0)}k – £${(max / 1000).toFixed(0)}k`;
  }
  if (min) return `From £${(min / 1000).toFixed(0)}k`;
  return `Up to £${(max! / 1000).toFixed(0)}k`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  
  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 30) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function getJobTypeBadge(jobType: string): string {
  const map: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    contract: "Contract",
  };
  return map[jobType] || jobType;
}

export function getSeniorityLabel(level: string): string {
  const map: Record<string, string> = {
    junior: "Junior",
    mid: "Mid-level",
    senior: "Senior",
  };
  return map[level] || level;
}
