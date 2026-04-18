import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const resolveAuthenticatedDefaultPath = async () => {
    if (!user) {
      return "/upload-cv";
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return profile?.role === "admin" ? "/admin" : "/upload-cv";
  };

  // Public routes that don't require auth
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/auth/callback",
  ];
  if (publicRoutes.includes(pathname)) {
    if (pathname === "/auth/callback") {
      return supabaseResponse;
    }

    // Redirect authenticated users away from auth pages
    if (user && pathname !== "/") {
      const destination = await resolveAuthenticatedDefaultPath();
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return supabaseResponse;
  }

  // All other routes require authentication
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
