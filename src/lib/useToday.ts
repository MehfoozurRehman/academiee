import { useEffect, useState } from "react";
import { localToday } from "./logic/fees";

/**
 * Today's local date (YYYY-MM-DD) and month (YYYY-MM). Queries take the date
 * as an argument, so this re-renders when the day rolls over.
 */
export function useToday() {
  const [today, setToday] = useState(localToday);
  useEffect(() => {
    const id = setInterval(() => {
      const now = localToday();
      setToday((prev) => (prev === now ? prev : now));
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return { today, month: today.slice(0, 7) };
}
