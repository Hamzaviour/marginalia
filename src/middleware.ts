import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || "marginalia-fallback-auth-secret-key-12345",
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/chat", "/chat/:path*", "/api/sessions/:path*", "/api/chat/:path*"],
};

