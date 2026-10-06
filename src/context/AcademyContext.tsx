import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { storage } from "../lib/storage";

type Me = NonNullable<ReturnType<typeof useMe>>;
type Academy = Me["academies"][number];

type AcademyContext = {
  academy: Academy | null;
  academyId: Id<"academies"> | null;
  academies: Academy[];
  select: (id: Id<"academies">) => void;
};

const KEY = "academiee.academy";
const Ctx = createContext<AcademyContext | null>(null);

export function useMe() {
  return useQuery(api.academies.me);
}

/** The academy the owner is currently working in (remembered per device). */
export function AcademyProvider({ children }: { children: ReactNode }) {
  const me = useMe();
  const [selected, setSelected] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storage.getItem(KEY).then((v) => {
      setSelected(v);
      setLoaded(true);
    });
  }, []);

  const value = useMemo<AcademyContext>(() => {
    const academies = me?.academies ?? [];
    const academy =
      academies.find((a) => a._id === selected) ?? (loaded ? academies[0] ?? null : null);
    return {
      academy,
      academyId: academy?._id ?? null,
      academies,
      select: (id) => {
        setSelected(id);
        void storage.setItem(KEY, id);
      },
    };
  }, [me, selected, loaded]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAcademy() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAcademy must be used inside AcademyProvider");
  return ctx;
}

/** For screens inside the owner area, where an academy is guaranteed. */
export function useAcademyId(): Id<"academies"> {
  const { academyId } = useAcademy();
  if (!academyId) throw new Error("No academy selected");
  return academyId;
}
