"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Briefcase } from "lucide-react";

type ScraperSource = "linkedin" | "indeed" | "all";

interface ScraperToggleProps {
  linkedinCount: number;
  indeedCount: number;
  onSourceChange: (source: ScraperSource) => void;
  isLoading?: boolean;
}

export default function ScraperSourceToggle({
  linkedinCount,
  indeedCount,
  onSourceChange,
  isLoading = false,
}: ScraperToggleProps) {
  const [activeSource, setActiveSource] = useState<ScraperSource>("all");

  const handleSourceChange = (source: ScraperSource) => {
    setActiveSource(source);
    onSourceChange(source);
  };

  const totalCount = linkedinCount + indeedCount;

  return (
    <div className="flex items-center gap-4 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[16px] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
        Session jobs:
      </div>

      {/* Toggle buttons */}
      <div className="flex gap-2.5 relative">
        {/* All button */}
        <motion.button
          onClick={() => handleSourceChange("all")}
          disabled={isLoading}
          className={`relative px-4 py-2.5 rounded-[10px] font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeSource === "all"
              ? "text-white"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {activeSource === "all" && (
            <motion.div
              layoutId="activeBackground"
              className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-700 rounded-[10px]"
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
            />
          )}
          <span className="relative z-10">All ({totalCount})</span>
        </motion.button>

        {/* LinkedIn button */}
        <motion.button
          onClick={() => handleSourceChange("linkedin")}
          disabled={isLoading}
          className={`relative px-4 py-2.5 rounded-[10px] font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeSource === "linkedin"
              ? "text-white"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {activeSource === "linkedin" && (
            <motion.div
              layoutId="activeBackground"
              className="absolute inset-0 bg-gradient-to-r from-[#0A66C2] to-[#004182] rounded-[10px]"
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
            />
          )}
          <Globe className="h-4 w-4 relative z-10" />
          <span className="relative z-10">LinkedIn ({linkedinCount})</span>
        </motion.button>

        {/* Indeed button */}
        <motion.button
          onClick={() => handleSourceChange("indeed")}
          disabled={isLoading}
          className={`relative px-4 py-2.5 rounded-[10px] font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
            activeSource === "indeed"
              ? "text-white"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {activeSource === "indeed" && (
            <motion.div
              layoutId="activeBackground"
              className="absolute inset-0 bg-gradient-to-r from-[#003A70] to-[#1F5396] rounded-[10px]"
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
            />
          )}
          <Briefcase className="h-4 w-4 relative z-10" />
          <span className="relative z-10">Indeed ({indeedCount})</span>
        </motion.button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ml-auto"
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
