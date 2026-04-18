"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSavedJobs, updateSavedJobStatus, unsaveJob } from "@/lib/api/savedJobs";
import { getMe } from "@/lib/api/users";
import { SavedJob, ApplicationStatus, User } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Bookmark,
  Building2,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_COLOURS: Record<ApplicationStatus, string> = {
  saved: "bg-gray-100 text-gray-700 border-gray-200",
  applied: "bg-blue-100 text-blue-700 border-blue-200",
  interviewing: "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  offered: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  rejected: "Rejected",
  offered: "Offered",
};

const STATUS_FLOW: Array<"all" | ApplicationStatus> = [
  "all",
  "saved",
  "applied",
  "interviewing",
  "offered",
  "rejected",
];

export default function MyJobsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMe(), getSavedJobs()])
      .then(([userData, jobs]) => {
        setUser(userData);
        setSavedJobs(jobs);
      })
      .catch(() => toast.error("Failed to load saved jobs"))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (savedJobId: string, status: ApplicationStatus) => {
    try {
      const updated = await updateSavedJobStatus(savedJobId, status);
      setSavedJobs((prev) =>
        prev.map((sj) => (sj.id === savedJobId ? { ...sj, status: updated.status } : sj))
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleUnsave = async (savedJobId: string) => {
    try {
      await unsaveJob(savedJobId);
      setSavedJobs((prev) => prev.filter((sj) => sj.id !== savedJobId));
      toast.success("Job removed");
    } catch {
      toast.error("Failed to remove job");
    }
  };

  const totals = useMemo(() => {
    const byStatus = {
      saved: 0,
      applied: 0,
      interviewing: 0,
      rejected: 0,
      offered: 0,
    } as Record<ApplicationStatus, number>;

    for (const item of savedJobs) {
      byStatus[item.status] += 1;
    }

    return {
      all: savedJobs.length,
      inProgress: byStatus.applied + byStatus.interviewing,
      offered: byStatus.offered,
      byStatus,
    };
  }, [savedJobs]);

  const filteredJobs = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return savedJobs.filter((sj) => {
      if (statusFilter !== "all" && sj.status !== statusFilter) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      const title = sj.job?.title?.toLowerCase() || "";
      const company = sj.job?.company_name?.toLowerCase() || "";
      const location = sj.job?.location?.toLowerCase() || "";
      return (
        title.includes(normalized) ||
        company.includes(normalized) ||
        location.includes(normalized)
      );
    });
  }, [savedJobs, statusFilter, query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="relative container mx-auto max-w-6xl px-4 py-8">
        <div className="pointer-events-none absolute -top-12 left-2 h-52 w-52 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="pointer-events-none absolute right-6 top-20 h-44 w-44 rounded-full bg-cyan-200/30 blur-3xl" />

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500" />
          <div className="p-6 md:p-8">
            <Badge className="mb-3 gap-1 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50">
              <Target className="h-3 w-3" />
              Application tracker
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Keep your matching journey organized
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
              Manage saved opportunities, update your application stage, and jump back into high-fit roles in one place.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card className="border-slate-200 bg-slate-50/80">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500">Saved Jobs</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{totals.all}</p>
                </CardContent>
              </Card>
              <Card className="border-sky-200 bg-sky-50/70">
                <CardContent className="p-4">
                  <p className="text-xs text-sky-700">In Progress</p>
                  <p className="mt-1 text-2xl font-semibold text-sky-800">{totals.inProgress}</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 bg-emerald-50/70">
                <CardContent className="p-4">
                  <p className="text-xs text-emerald-700">Offers</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-800">{totals.offered}</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-slate-50/80">
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500">Saved Stage</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{totals.byStatus.saved}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, company, or location"
                className="h-10 rounded-xl border-slate-200 pl-9 text-sm focus-visible:ring-sky-500"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | ApplicationStatus)}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 text-sm md:w-52">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FLOW.map((status) => (
                  <SelectItem key={status} value={status} className="text-sm">
                    {status === "all" ? "All statuses" : STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
              {filteredJobs.length} results
            </Badge>
            {statusFilter !== "all" && (
              <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                Status: {STATUS_LABELS[statusFilter]}
              </Badge>
            )}
            {query.trim() && (
              <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                Search: {query.trim()}
              </Badge>
            )}
            {(statusFilter !== "all" || query.trim()) && (
              <Button
                variant="ghost"
                className="h-7 rounded-full px-3 text-xs text-slate-600 hover:bg-slate-100"
                onClick={() => {
                  setStatusFilter("all");
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="rounded-full border border-slate-200 bg-white p-4 shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          </div>
        ) : savedJobs.length === 0 ? (
          <Card className="mt-6 border-dashed border-slate-300 bg-white">
            <CardContent className="py-16 text-center">
              <Bookmark className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900">No saved jobs yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Save roles from your matching dashboard to build your application pipeline.
              </p>
              <Link href="/jobs">
                <Button className="mt-5 bg-sky-600 text-white hover:bg-sky-700">Browse jobs</Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card className="mt-6 border-dashed border-slate-300 bg-white">
            <CardContent className="py-16 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900">No jobs match these filters</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Change status or search criteria to see more of your tracked opportunities.
              </p>
              <Button
                variant="outline"
                className="mt-5 border-slate-300 text-slate-700"
                onClick={() => {
                  setStatusFilter("all");
                  setQuery("");
                }}
              >
                Reset filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredJobs.map((sj) => (
              <Card
                key={sj.id}
                className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className={`border text-xs ${STATUS_COLOURS[sj.status as ApplicationStatus]}`}>
                          {STATUS_LABELS[sj.status as ApplicationStatus]}
                        </Badge>
                        <Badge variant="outline" className="border-slate-300 bg-white text-xs text-slate-600">
                          Saved {formatDate(sj.created_at)}
                        </Badge>
                      </div>

                      <Link
                        href={`/jobs/${sj.job_id}`}
                        className="line-clamp-2 text-lg font-semibold text-slate-900 transition-colors hover:text-sky-700"
                      >
                        {sj.job?.title || "Job"}
                      </Link>

                      {sj.job ? (
                        <>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5" />
                              {sj.job.company_name}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {sj.job.location}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5" />
                              {sj.job.job_type}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {sj.job.sponsorship_confirmed && (
                              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                Sponsorship verified
                              </Badge>
                            )}
                            {typeof sj.job.salary_min === "number" && typeof sj.job.salary_max === "number" && (
                              <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                                GBP {Math.round(sj.job.salary_min / 1000)}k - {Math.round(sj.job.salary_max / 1000)}k
                              </Badge>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">Job details are not available for this saved item.</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2 md:pl-4">
                      <Select
                        value={sj.status}
                        onValueChange={(v) => handleStatusChange(sj.id, v as ApplicationStatus)}
                      >
                        <SelectTrigger className="h-9 w-36 rounded-lg border-slate-200 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value} className="text-xs">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Link href={`/jobs/${sj.job_id}`}>
                        <Button variant="outline" size="sm" className="h-9 border-slate-300 text-slate-700">
                          Details
                        </Button>
                      </Link>

                      {sj.job?.apply_url && (
                        <a href={sj.job.apply_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="h-9 bg-sky-600 text-white hover:bg-sky-700">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            Apply
                          </Button>
                        </a>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleUnsave(sj.id)}
                        aria-label="Remove saved job"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
