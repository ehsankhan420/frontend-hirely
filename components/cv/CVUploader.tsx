"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { uploadCV, confirmCVProfile } from "@/lib/api/users";
import { ParsedCVProfile, User } from "@/types";
import { Upload, FileText, CheckCircle2, X, Plus } from "lucide-react";
import { toast } from "sonner";

function normalizeParsedCVProfile(profile: ParsedCVProfile): ParsedCVProfile {
  const skills = Array.from(
    new Set((profile.skills || []).map((skill) => skill.trim()).filter(Boolean))
  );

  const experience =
    typeof profile.experience_years === "number" && Number.isFinite(profile.experience_years)
      ? profile.experience_years
      : typeof profile.experience_years === "string"
        ? parseFloat(profile.experience_years)
        : undefined;

  return {
    ...profile,
    job_title: profile.job_title?.trim() || undefined,
    skills,
    experience_years: Number.isFinite(experience as number) ? (experience as number) : undefined,
  };
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : "";
        }
        return "";
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join("; ");
    }
  }

  const message = (err as { message?: unknown })?.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return fallback;
}

interface CVUploaderProps {
  user: User;
  onProfileUpdated: (user: User) => void;
}

export default function CVUploader({ user, onProfileUpdated }: CVUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [extracted, setExtracted] = useState<ParsedCVProfile | null>(
    user.parsed_cv ? normalizeParsedCVProfile(user.parsed_cv) : null
  );
  const hasFreshUploadRef = useRef(false);
  const [newSkill, setNewSkill] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasFreshUploadRef.current) return;
    setExtracted(user.parsed_cv ? normalizeParsedCVProfile(user.parsed_cv) : null);
  }, [user.parsed_cv]);

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadCV(file);
      setExtracted(result.extracted);
      toast.success("CV parsed! Review the extracted fields below.");
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Failed to parse CV");
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

    hasFreshUploadRef.current = true;
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
      setExtracted(normalizeParsedCVProfile(result.extracted));
    if (file) handleFileUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleConfirm = async () => {
    if (!extracted) return;
    setConfirming(true);
    try {
      const updatedUser = await confirmCVProfile(extracted);
      onProfileUpdated(updatedUser);
      toast.success("CV profile saved! Your job matches will now be personalised.");
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Failed to save profile");
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  const removeSkill = (skill: string) => {
    if (!extracted) return;
    setExtracted({ ...extracted, skills: extracted.skills.filter((s) => s !== skill) });
  };

  const addSkill = () => {
    if (!newSkill.trim() || !extracted) return;
    if (!extracted.skills.includes(newSkill.trim())) {
      setExtracted({ ...extracted, skills: [...extracted.skills, newSkill.trim()] });
    }
    setNewSkill("");
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium">Drop your CV here or click to upload</p>
        <p className="text-sm text-muted-foreground mt-1">
          PDF, DOC, or DOCX · Max 5MB
        </p>
        {uploading && (
          <p className="text-sm text-blue-600 mt-2 animate-pulse">Parsing your CV...</p>
        )}
      </div>

      {/* Extracted Fields Editor */}
      {extracted && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Extracted CV Profile
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Review and edit the fields below, then confirm to power your job matching.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Job Title */}
            <div className="space-y-1.5">
              <Label htmlFor="job-title">Current / Most Recent Job Title</Label>
              <Input
                id="job-title"
                value={extracted.job_title || ""}
                onChange={(e) => setExtracted({ ...extracted, job_title: e.target.value })}
                placeholder="e.g. Software Engineer"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1.5">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={extracted.experience_years ?? ""}
                onChange={(e) =>
                  setExtracted({
                    ...extracted,
                    experience_years: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder="e.g. 4.5"
              />
            </div>

            <Separator />

            {/* Skills */}
            <div className="space-y-2">
              <Label>Skills ({extracted.skills.length} detected)</Label>
              <div className="flex flex-wrap gap-2">
                {extracted.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="pr-1 gap-1 cursor-pointer"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {/* Add skill */}
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Add a skill..."
                  className="h-8 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSkill}
                  className="h-8 gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {confirming ? "Saving..." : "Confirm & Save Profile"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing profile indicator */}
      {user.parsed_cv && !extracted && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            CV profile saved — {user.parsed_cv.skills?.length || 0} skills detected.
            Upload a new CV to update it.
          </span>
        </div>
      )}
    </div>
  );
}
