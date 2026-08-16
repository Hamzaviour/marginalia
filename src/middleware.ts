export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/chat/:path*", "/api/sessions/:path*", "/api/chat/:path*"],
};
