import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";
import { Text } from "./ui";
import type { ColorName, TypeVariant } from "../theme/tokens";

// A number that counts up to its value — used once, for the headline figure.
export function CountUp({
  value,
  format,
  variant = "figure",
  color = "text",
}: {
  value: number;
  format: (n: number) => string;
  variant?: TypeVariant;
  color?: ColorName;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const start = from.current;
    const began = Date.now();
    const duration = 700;
    let frame = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - began) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);

  return (
    <Text latin variant={variant} color={color} tabular>
      {format(shown)}
    </Text>
  );
}
