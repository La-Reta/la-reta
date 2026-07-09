import { clerkMiddleware } from "@clerk/nextjs/server";

// ponytail: no route protection yet — clerkMiddleware just makes the session
// available everywhere (auth() works in any RSC/route). Add createRouteMatcher +
// auth.protect() here when we start gating specific routes.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
