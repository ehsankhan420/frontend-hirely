"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import CVUploader from "@/components/cv/CVUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getMe, updateMe } from "@/lib/api/users";
import {
  createCheckoutSession,
  createCustomerPortal,
  syncCheckoutSession,
} from "@/lib/api/payments";
import { User } from "@/types";
import { Loader2, User as UserIcon, CreditCard, FileText, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50/50" />}>
      <ProfilePageContent />
    </Suspense>
  );
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
};

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
      toast.success("Profile updated seamlessly");
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

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Navbar user={user} />
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none z-0" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-400/10 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-64 -left-32 w-80 h-80 bg-indigo-400/10 blur-[100px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10">
        <Navbar user={user} />

        <main className="container mx-auto max-w-[800px] px-4 py-12">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-10 text-center sm:text-left"
          >
            <h1 className="text-[32px] md:text-[40px] font-extrabold tracking-tight text-slate-900 mb-2">Profile & Settings</h1>
            <p className="text-slate-500 text-[16px] font-medium max-w-lg">
              Manage your personal information, update your matching CV, and oversee your subscription.
            </p>
          </motion.div>

          <AnimatePresence>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-8"
            >
              {/* Account Info Card */}
              <motion.section variants={itemVariants}>
                <div className="rounded-[24px] border border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
                  <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/30 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-100/50 text-blue-600 shadow-inner">
                      <UserIcon className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[17px] font-bold text-slate-800">Account Information</h2>
                  </div>
                  
                  <div className="p-6 md:p-8 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <Avatar className="h-24 w-24 shrink-0 shadow-lg border-[3px] border-white bg-white hover:scale-105 transition-transform duration-300">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-blue-50 text-blue-700 text-3xl font-extrabold shadow-inner">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-2xl font-bold text-slate-900 mb-1 leading-tight">{user.name || "Set your name below"}</h3>
                        <p className="text-slate-500 font-medium mb-3">{user.email}</p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          {user.role === "premium" && (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200/60 font-bold px-3 py-1 shadow-sm text-[12px] uppercase tracking-wider">Premium Access</Badge>
                          )}
                          {user.role === "free" && (
                            <Badge variant="outline" className="font-bold text-slate-500 px-3 py-1 bg-white shadow-sm text-[12px] uppercase tracking-wider">Basic Tier</Badge>
                          )}
                          {user.role === "admin" && (
                            <Badge className="bg-purple-50 text-purple-700 border-purple-200/60 font-bold px-3 py-1 shadow-sm text-[12px] uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
                              Super Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100/80 w-full" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[13px] font-bold tracking-wide text-slate-500 uppercase flex items-center gap-2">
                          <UserIcon className="w-3.5 h-3.5" /> Full Name
                        </Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Jane Doe"
                          className="h-12 rounded-[14px] text-[15px] font-medium border-slate-200 bg-slate-50/50 shadow-sm focus-visible:ring-blue-500 focus-visible:bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[13px] font-bold tracking-wide text-slate-500 uppercase flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" /> Preferred Location
                        </Label>
                        <Input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. London, UK"
                          className="h-12 rounded-[14px] text-[15px] font-medium border-slate-200 bg-slate-50/50 shadow-sm focus-visible:ring-blue-500 focus-visible:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-[14px] font-bold text-[14px] shadow-[0_6px_20px_rgba(37,99,235,0.25)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Save Profile Changes"
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* CV & Matching Card */}
              <motion.section variants={itemVariants}>
                <div className="rounded-[24px] border border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
                  <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/30 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100/50 text-amber-600 shadow-inner">
                      <FileText className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-[17px] font-bold text-slate-800">CV & Matching Heuristics</h2>
                  </div>
                  
                  <div className="p-6 md:p-8">
                    <p className="text-slate-500 font-medium text-[14px] mb-6">
                      Upload your latest CV to let our matching engine perfectly map your skills to active sponsor licenses. 
                    </p>
                    <div className="bg-slate-50/50 rounded-[20px] pb-2 border-2 border-dashed border-slate-200 overflow-hidden">
                      <CVUploader
                        user={user}
                        onProfileUpdated={(updatedUser) => setUser(updatedUser)}
                      />
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Subscription Management */}
              {user.role !== "admin" && (
                <motion.section variants={itemVariants}>
                  <div className={`rounded-[24px] border ${user.role === 'premium' ? 'border-blue-200/60 shadow-[0_8px_40px_rgba(37,99,235,0.12)]' : 'border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'} bg-white/70 backdrop-blur-xl overflow-hidden transition-all duration-300 relative`}>
                    
                    {user.role === 'premium' && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
                    )}

                    <div className="px-6 py-5 border-b border-slate-100/80 bg-slate-50/30 flex items-center gap-3">
                      <div className={`p-2 rounded-xl shadow-inner ${user.role === 'premium' ? 'bg-blue-100/50 text-blue-600' : 'bg-emerald-100/50 text-emerald-600'}`}>
                        <CreditCard className="h-5 w-5" strokeWidth={2.5} />
                      </div>
                      <h2 className="text-[17px] font-bold text-slate-800">Billing & Subscription</h2>
                    </div>
                    
                    <div className="p-6 md:p-8">
                      {user.role === "premium" ? (
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 py-1 px-3 shadow-inner font-extrabold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Premium Mode Active
                              </Badge>
                              <span className="font-bold text-slate-400">£6.99 / month</span>
                            </div>
                            <p className="text-[15px] text-slate-600 font-medium leading-relaxed max-w-[400px]">
                              You have unrestricted access to all verified UK sponsorship jobs, perfect matching, and early alerts.
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                            className="px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-[14px] font-bold text-[14px] shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                          >
                            {portalLoading ? "Loading Portal..." : "Manage Subscription"}
                          </motion.button>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-[20px] p-6 border border-blue-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex-1 text-center md:text-left space-y-2">
                            <h3 className="text-[18px] font-extrabold text-slate-800">Ready to unlock everything?</h3>
                            <p className="text-[15px] text-slate-600 font-medium">
                              Upgrade to the Premium tier to instantly access thousands of verified UK sponsorship roles matched directly to your CV.
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleUpgrade}
                            disabled={checkoutLoading}
                            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-[16px] font-extrabold text-[15px] shadow-[0_8px_30px_rgba(79,70,229,0.3)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
                          >
                            {checkoutLoading ? "Preparing Secure Checkout..." : "Upgrade Now — £6.99/mo"}
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.section>
              )}

            </motion.div>
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}
