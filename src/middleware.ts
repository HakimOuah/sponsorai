import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/players/:path*",
    "/companies/:path*",
    "/pipeline/:path*",
    "/prospection/:path*",
    "/emails/:path*",
    "/agents/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/veille/:path*",
    "/api/agents/:path*",
    "/api/deals/:path*",
    "/api/players/:path*",
  ],
};
