import { cn, getMatchColour } from "@/lib/utils";

interface MatchScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const colourClasses = {
  green:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber:
    "bg-amber-50 text-amber-700 border-amber-200",
  grey: "bg-slate-100 text-slate-600 border-slate-200",
};

const sizeClasses = {
  sm: "text-xs px-2.5 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-3.5 py-1.5 font-semibold",
};

export default function MatchScoreBadge({ score, size = "md" }: MatchScoreBadgeProps) {
  const colour = getMatchColour(score);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        colourClasses[colour],
        sizeClasses[size]
      )}
    >
      {score}% Match
    </span>
  );
}
