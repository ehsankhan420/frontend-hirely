"use client";

import { ReactNode } from "react";
import { User } from "@/types";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  user: User | null;
  children: ReactNode;
}

export default function AdminLayout({ user, children }: AdminLayoutProps) {
  return (
    <div className="flex bg-slate-50 text-slate-900 font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-900" style={{ position: 'fixed', inset: 0 }}>
      
      {/* Abstract background gradients matching the Landing Page mesh */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-indigo-100/60 via-purple-50/50 to-cyan-50/50 blur-3xl -z-10 rounded-full select-none pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-gradient-to-bl from-sky-100/50 via-indigo-50/50 to-transparent blur-3xl -z-10 rounded-full select-none pointer-events-none" />

      <AdminSidebar user={user} />

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto pt-16 md:pt-0 relative z-10 w-full">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
