"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMe } from "@/lib/api/users";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";
import {
  Search,
  MoreHorizontal,
  Users,
  ShieldCheck,
  TrendingUp,
  UserX,
  Loader2,
  Crown,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";

interface UserRow {
  id: string;
  email: string;
  name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  free: {
    label: "Free",
    className: "text-slate-600 bg-slate-100 border-slate-200",
    icon: Users,
  },
  premium: {
    label: "Premium",
    className: "text-amber-700 bg-amber-50 border-amber-200",
    icon: Crown,
  },
  admin: {
    label: "Admin",
    className: "text-indigo-700 bg-indigo-50 border-indigo-200",
    icon: ShieldCheck,
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 30 } },
};

export default function AdminUsersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const [userData, usersResult] = await Promise.all([
          getMe(),
          supabase
            .from("users")
            .select("id,email,name,role,is_active,created_at")
            .order("created_at", { ascending: false })
            .limit(100),
        ]);
        if (usersResult.error) throw usersResult.error;
        setUser(userData);
        setUsers((usersResult.data || []) as UserRow[]);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdatingId(userId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ role })
        .eq("id", userId);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success(`Role updated to ${role}`);
    } catch {
      toast.error("Failed to update user role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    setUpdatingId(userId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", userId);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: false } : u))
      );
      toast.success("User deactivated");
    } catch {
      toast.error("Failed to deactivate user");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPremium = users.filter((u) => u.role === "premium").length;
  const totalFree = users.filter((u) => u.role === "free").length;

  return (
    <AdminLayout user={user}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1300px] mx-auto space-y-6 pb-12 relative z-10"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Ambient Glow */}
        <div className="absolute top-10 right-20 w-96 h-96 bg-blue-100/40 blur-[100px] -z-10 rounded-full" />

        {/* Premium Header Banner */}
        <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[24px] p-8 md:p-10 shadow-[0_8px_30px_rgba(37,99,235,0.15)] bg-blue-600 border border-blue-500" style={{ background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)" }}>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col gap-2.5">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
                User <span className="text-blue-100">Management</span>
              </h1>
              <p className="text-white/90 mt-1 font-medium max-w-lg leading-relaxed text-[15px]">
                 {loading ? "Loading user accounts..." : `Managing access and roles for ${users.length} registered platform members.`}
              </p>
            </div>
            
            {!loading && (
              <div className="flex flex-wrap gap-3 shrink-0 mt-2 md:mt-0">
                <div className="flex items-center gap-4 bg-white rounded-xl h-11 px-6 shadow-[0_4px_14px_rgba(255,255,255,0.2)] border-none">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="text-blue-900 font-bold text-[14px]">{totalPremium} <span className="text-blue-600/80 font-medium">Premium</span></span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-blue-900 font-bold text-[14px]">{totalFree} <span className="text-blue-600/80 font-medium">Free</span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
        </motion.div>

        {/* Global Toolbar */}
        <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 pt-4">
           {/* Left side: Search */}
           <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 w-full xl:w-auto">
             <div className="relative w-full lg:w-[340px] shrink-0">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
               <Input
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search users by name or email..."
                 className="pl-11 h-12 bg-white border border-slate-200/80 text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-500 rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-[15px] font-medium transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] w-full"
               />
             </div>
           </div>
        </motion.div>

        {/* Modern Bento Table */}
        <motion.div variants={itemVariants} className="bg-white rounded-[24px] border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden relative">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
                <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Loading Directory...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {["User Identity", "Plan Status", "Account Health", "Date Joined", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u) => {
                    const roleConf = ROLE_CONFIG[u.role] || ROLE_CONFIG["free"];
                    const RoleIcon = roleConf.icon;
                    const initials = u.name
                      ? u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : u.email[0].toUpperCase();

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-indigo-50/30 transition-colors group"
                      >
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <div className="h-11 w-11 rounded-[12px] bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center text-[13px] font-extrabold text-indigo-700 shrink-0 border border-indigo-200/50 shadow-sm">
                               {initials}
                             </div>
                             <div className="min-w-0 flex flex-col justify-center">
                               <p className="text-[15px] font-bold text-slate-800 truncate">
                                 {u.name || "—"}
                               </p>
                               <p className="text-[13px] font-semibold text-slate-500 truncate mt-0.5">
                                 {u.email}
                               </p>
                             </div>
                           </div>
                        </td>

                        {/* Role */}
                        <td className="px-8 py-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-bold border whitespace-nowrap shadow-sm ${roleConf.className}`}
                          >
                            <RoleIcon className="w-3.5 h-3.5" />
                            {roleConf.label} Account
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-8 py-6">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[12px] font-bold border whitespace-nowrap shadow-sm ${
                              u.is_active
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : "text-rose-700 bg-rose-50 border-rose-200"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full shadow-inner ${
                                u.is_active ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {u.is_active ? "Active" : "Deactivated"}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-8 py-6 text-[13px] font-semibold text-slate-600 whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
                        </td>

                        {/* Actions */}
                        <td className="px-8 py-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={updatingId === u.id}
                                className="h-9 w-9 p-0 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-[10px] focus-visible:ring-1 focus-visible:ring-indigo-500"
                              >
                                {updatingId === u.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                ) : (
                                  <MoreHorizontal className="h-5 w-5" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-52 bg-white border border-slate-200/80 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-[16px] p-1.5"
                            >
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(u.id, "premium")}
                                className="cursor-pointer text-slate-700 font-semibold text-[13px] rounded-[10px] focus:bg-amber-50 focus:text-amber-900 py-2.5"
                              >
                                <Crown className="mr-2.5 h-4 w-4 text-amber-500" />
                                Upgrade Premium
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(u.id, "free")}
                                className="cursor-pointer text-slate-700 font-semibold text-[13px] rounded-[10px] focus:bg-slate-50 focus:text-slate-900 py-2.5"
                              >
                                <TrendingUp className="mr-2.5 h-4 w-4 text-slate-400" />
                                Downgrade Free
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-100 my-1" />
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(u.id)}
                                className="cursor-pointer text-rose-600 font-bold text-[13px] rounded-[10px] focus:bg-rose-50 focus:text-rose-700 py-2.5"
                              >
                                <UserX className="mr-2.5 h-4 w-4" />
                                Deactivate Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-20">
                          <div className="inline-flex w-16 h-16 bg-slate-50 rounded-[16px] border border-slate-100 items-center justify-center mb-4 shadow-inner">
                              <Users className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-slate-500 font-bold text-[15px]">
                              {search ? "No users match your criteria." : "No registered users."}
                          </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {!loading && filtered.length > 0 && (
          <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 text-right px-2">
             Showing {filtered.length} total users
          </p>
        )}
      </motion.div>
    </AdminLayout>
  );
}
