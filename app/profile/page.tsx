"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import CVUploader from "@/components/cv/CVUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getMe, updateMe } from "@/lib/api/users";
import {
  createCheckoutSession,
  createCustomerPortal,
  syncCheckoutSession,
} from "@/lib/api/payments";
import { User } from "@/types";
import { Loader2, User as UserIcon, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        setName(u.name || "");
        setLocation(u.location_preference || "");
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const upgraded = searchParams.get("upgraded");
    const sessionId = searchParams.get("session_id");

    if (upgraded !== "true" || !sessionId) return;

    const syncAndRefresh = async () => {
      try {
        await syncCheckoutSession(sessionId);
      } catch {
        // Webhook may still complete shortly; continue to profile refresh below.
      }

      let latestUser: User | null = null;

      for (let i = 0; i < 6; i += 1) {
        try {
          const u = await getMe();
          latestUser = u;
          if (u.role === "premium" || u.role === "admin") {
            break;
          }
        } catch {
          // Ignore transient read errors during refresh polling.
        }
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      if (latestUser) {
        setUser(latestUser);
        setName(latestUser.name || "");
        setLocation(latestUser.location_preference || "");
      }

      if (latestUser?.role === "premium" || latestUser?.role === "admin") {
        toast.success("Premium activated. Full job access unlocked.");
      } else {
        toast.message("Payment received. Premium activation is still syncing.");
      }

      router.replace("/profile");
      router.refresh();
    };

    syncAndRefresh();
  }, [searchParams, router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await updateMe({ name, location_preference: location });
      setUser(updated);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { portal_url } = await createCustomerPortal();
      window.location.href = portal_url;
    } catch {
      toast.error("Failed to open subscription portal");
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const { checkout_url } = await createCheckoutSession();
      window.location.href = checkout_url;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail;
      toast.error(msg || "Failed to start checkout");
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Profile & Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your account, CV, and subscription.
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white text-lg font-semibold">
                  {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{user.name || "No name set"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="mt-1">
                    {user.role === "premium" && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Premium</Badge>
                    )}
                    {user.role === "free" && (
                      <Badge variant="outline" className="text-xs">Free plan</Badge>
                    )}
                    {user.role === "admin" && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Admin</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred location</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. London"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </CardContent>
          </Card>

          {/* CV Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CV & Matching Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CVUploader
                user={user}
                onProfileUpdated={(updatedUser) => setUser(updatedUser)}
              />
            </CardContent>
          </Card>

          {/* Subscription */}
          {user.role !== "admin" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.role === "premium" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">Active Premium</Badge>
                      <span className="text-sm text-muted-foreground">£6.99/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You have full access to all jobs and features.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                    >
                      {portalLoading ? "Loading..." : "Manage / Cancel Subscription"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      You&apos;re on the free plan. Upgrade to access all sponsorship-verified jobs.
                    </p>
                    <Button
                      onClick={handleUpgrade}
                      disabled={checkoutLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {checkoutLoading ? "Redirecting..." : "Upgrade to Premium — £6.99/mo"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
