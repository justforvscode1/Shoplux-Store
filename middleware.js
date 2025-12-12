// middleware.js
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const middleware = withAuth(
    function middleware(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            async authorized({ req, token }) {
                const { pathname } = req.nextUrl;

                // Only log page visits, skip API calls
                if (!pathname.startsWith('/')) {
                }

                if (
                    pathname.endsWith("/api/auth") ||
                    pathname === "/login" ||
                    pathname === "/register"
                ) {
                    return true;
                }

                if (pathname === "/") {
                    return true;
                }

                if (pathname.startsWith("/add-product")) {
                    return token?.role === "admin";
                }

                return !!token;
            }
        }
    },
);

export const config = {
    matcher: [
        "/((?!api|product|_next/static|_next/image|favicon.ico|products|fashion|electronics).*)"],
};