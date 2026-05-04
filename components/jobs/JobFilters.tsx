"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobFilters } from "@/types";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface JobFiltersProps {
  onFiltersChange: (filters: JobFilters) => void;
  currentFilters: JobFilters;
}

export default function JobFiltersPanel({
  onFiltersChange,
  currentFilters,
}: JobFiltersProps) {
  const [search, setSearch] = useState(currentFilters.search || "");

  useEffect(() => {
    setSearch(currentFilters.search || "");
  }, [currentFilters.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...currentFilters, search: search || undefined });
  };

  const handleFilterChange = (
    key: keyof JobFilters,
    value: string | undefined
  ) => {
    onFiltersChange({ ...currentFilters, [key]: value || undefined });
  };

  const handleSalaryChange = (
    key: "salary_min" | "salary_max",
    value: string
  ) => {
    const parsed = Number(value);
    onFiltersChange({
      ...currentFilters,
      [key]: value === "" || Number.isNaN(parsed) ? undefined : parsed,
    });
  };

  const hasActiveFilters =
    currentFilters.search ||
    currentFilters.location ||
    currentFilters.job_type ||
    currentFilters.salary_min ||
    currentFilters.salary_max;

  const activeFilterCount = [
    currentFilters.search,
    currentFilters.location,
    currentFilters.job_type,
    currentFilters.salary_min,
    currentFilters.salary_max,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    onFiltersChange({ sort: currentFilters.sort || "match" });
  };

  // Shared input/select clean style
  const cleanInput =
    "h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg shadow-sm";

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job titles, companies, skills…"
            className={`${cleanInput} pl-10 h-12 text-base`}
          />
        </div>
        <button
          type="submit"
          className="px-6 h-12 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm shrink-0"
        >
          Search
        </button>
      </form>

      {/* Filter row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Select
          value={currentFilters.location || "all"}
          onValueChange={(v) =>
            handleFilterChange("location", v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className={cleanInput}>
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <SelectItem value="all">All locations</SelectItem>
            <SelectItem value="London">London</SelectItem>
            <SelectItem value="Manchester">Manchester</SelectItem>
            <SelectItem value="Edinburgh">Edinburgh</SelectItem>
            <SelectItem value="Birmingham">Birmingham</SelectItem>
            <SelectItem value="Leeds">Leeds</SelectItem>
            <SelectItem value="Reading">Reading</SelectItem>
            <SelectItem value="Derby">Derby</SelectItem>
            <SelectItem value="Remote">Remote</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.job_type || "all"}
          onValueChange={(v) =>
            handleFilterChange("job_type", v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className={cleanInput}>
            <SelectValue placeholder="Job type" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="full-time">Full-time</SelectItem>
            <SelectItem value="part-time">Part-time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          min={0}
          value={currentFilters.salary_min?.toString() || ""}
          onChange={(e) => handleSalaryChange("salary_min", e.target.value)}
          placeholder="Min salary"
          className={cleanInput}
        />

        <Input
          type="number"
          min={0}
          value={currentFilters.salary_max?.toString() || ""}
          onChange={(e) => handleSalaryChange("salary_max", e.target.value)}
          placeholder="Max salary"
          className={cleanInput}
        />

        <Select
          value={currentFilters.sort || "match"}
          onValueChange={(v) => handleFilterChange("sort", v)}
        >
          <SelectTrigger className={cleanInput}>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <SelectItem value="match">Best match</SelectItem>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="salary">Highest salary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active filter chips */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <SlidersHorizontal className="h-4 w-4" />
          Filters active: {activeFilterCount}
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Clear all
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
