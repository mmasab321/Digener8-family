import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/tasks/:path*", "/my-tasks/:path*", "/communication/:path*", "/team/:path*", "/settings/:path*"],
};
