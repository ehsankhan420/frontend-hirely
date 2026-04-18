import { BadgeCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SponsorBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 cursor-help">
            <BadgeCheck className="h-3 w-3" />
            Visa Sponsorship
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">
            This company holds an active UK Skilled Worker Sponsor Licence, 
            meaning they can legally sponsor your visa application.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
