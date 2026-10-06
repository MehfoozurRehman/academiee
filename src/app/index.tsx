import { Redirect } from "expo-router";
import { useConvexAuth } from "convex/react";
import { useMe } from "../context/AcademyContext";
import { Splash } from "../components/Splash";

// Sends each person to the right place: welcome, academy setup, the owner
// app, the student portal, or the admin panel.
export default function Index() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useMe();

  if (isLoading || (isAuthenticated && me === undefined)) return <Splash />;
  if (!isAuthenticated || !me) return <Redirect href="/welcome" />;
  if (me.student) return <Redirect href="/s" />;
  if (me.academies.length > 0) return <Redirect href="/home" />;
  if (me.isAdmin) return <Redirect href="/admin" />;
  return <Redirect href="/setup" />;
}
