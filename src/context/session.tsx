import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import type { Id } from "../../convex/_generated/dataModel";

const KEY = "academy.session.v1";
const ONBOARDED_KEY = "academy.onboarded.v1";

export type Session = {
  userId: Id<"users">;
  name: string;
  email: string;
  role: "admin" | "academy_owner";
  academyId: Id<"academies"> | null;
};

type SessionContext = {
  session: Session | null;
  ready: boolean;
  onboarded: boolean;
  completeOnboarding: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  selectAcademy: (academyId: Id<"academies">) => Promise<void>;
  clearAcademy: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<SessionContext | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [raw, seen] = await Promise.all([
          SecureStore.getItemAsync(KEY),
          SecureStore.getItemAsync(ONBOARDED_KEY),
        ]);
        if (cancelled) return;
        if (raw) setSession(JSON.parse(raw));
        if (seen === "1") setOnboarded(true);
      } catch {
        // A corrupt or unreadable entry just means the user starts fresh.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<SessionContext>(() => {
    const persist = async (next: Session | null) => {
      setSession(next);
      try {
        if (next) await SecureStore.setItemAsync(KEY, JSON.stringify(next));
        else await SecureStore.deleteItemAsync(KEY);
      } catch {
        // Persistence is best effort; the in-memory session still works.
      }
    };

    return {
      session,
      ready,
      onboarded,
      completeOnboarding: async () => {
        setOnboarded(true);
        try {
          await SecureStore.setItemAsync(ONBOARDED_KEY, "1");
        } catch {
          // Worst case the intro shows once more.
        }
      },
      signIn: (next) => persist(next),
      selectAcademy: (academyId) =>
        persist(session ? { ...session, academyId } : null),
      clearAcademy: () => persist(session ? { ...session, academyId: null } : null),
      signOut: () => persist(null),
    };
  }, [session, ready, onboarded]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

export function useAcademyId() {
  const { session } = useSession();
  if (!session?.academyId) {
    throw new Error("No academy selected");
  }
  return session.academyId;
}
