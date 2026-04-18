"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCheckoutSession } from "@/lib/api/payments";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types";
import { Briefcase, Bookmark, Settings, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";

interface NavbarProps {
  user?: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href={user ? "/jobs" : "/"} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Hirely</span>
        </Link>

        {/* Nav links (authenticated) */}
        {user && (
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/jobs"
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                pathname.startsWith("/jobs")
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Find Jobs
            </Link>
            <Link
              href="/my-jobs"
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                pathname === "/my-jobs"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              My Jobs
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  pathname.startsWith("/admin")
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role === "free" && (
                <Button
                  size="sm"
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {checkoutLoading ? "Redirecting..." : "Upgrade — £6.99/mo"}
                </Button>
              )}
              {user.role === "premium" && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">Premium</Badge>
              )}
              {user.role === "admin" && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">Admin</Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={loading}
                className="hidden gap-1.5 text-muted-foreground hover:text-foreground md:inline-flex"
              >
                <LogOut className="h-4 w-4" />
                {loading ? "Signing out..." : "Logout"}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                disabled={loading}
                className="h-8 w-8 text-muted-foreground md:hidden"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile & CV
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-jobs" className="cursor-pointer">
                      <Bookmark className="mr-2 h-4 w-4" />
                      My Jobs
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={loading}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {loading ? "Signing out..." : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
