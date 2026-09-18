import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSession } from "./session";

export function SessionGuard() {
  const { session, ready, signOut } = useSession();

  const user = useQuery(
    api.auth.getCurrentUser,
    session ? { userId: session.userId } : "skip"
  );

  useEffect(() => {
    if (!ready || !session) return;
    if (user === null) void signOut();
  }, [ready, session, user, signOut]);

  return null;
}
