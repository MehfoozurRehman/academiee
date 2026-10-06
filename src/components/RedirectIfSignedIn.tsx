import { Redirect } from "expo-router";
import { useConvexAuth } from "convex/react";

/**
 * Auth screens render this: once the session is live, go to "/" which routes
 * to the right area. Avoids racing the token refresh after signIn().
 */
export function RedirectIfSignedIn() {
  const { isAuthenticated } = useConvexAuth();
  return isAuthenticated ? <Redirect href="/" /> : null;
}
