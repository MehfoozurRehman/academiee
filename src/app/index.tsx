import { Redirect } from "expo-router";
import { useSession } from "../context/session";
import { Loader } from "../components/ui";

export default function Index() {
  const { session, ready, onboarded } = useSession();

  if (!ready) return <Loader />;
  if (!session && !onboarded) return <Redirect href="/onboarding" />;
  if (!session) return <Redirect href="/login" />;
  if (session.role === "admin") return <Redirect href="/admin" />;
  if (!session.academyId) return <Redirect href="/select-academy" />;

  return <Redirect href="/dashboard" />;
}
