import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/guest", "/client"];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some(
    (p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/"))
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and auth API are excluded by matcher, but double-check
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/client-portal")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  // Logged-in user visiting /login -> redirect to dashboard
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Public paths don't need auth
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // API routes need auth token or API key
  if (pathname.startsWith("/api/")) {
    if (!token) {
      const apiKey = request.headers.get("x-api-key");
      if (!apiKey) {
        return NextResponse.json(
          { error: "غير مصرح - يرجى تسجيل الدخول" },
          { status: 401 }
        );
      }
    }
    return NextResponse.next();
  }

  // Dashboard pages need auth
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
