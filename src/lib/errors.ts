const FALLBACK = "Something went wrong. Please try again.";

export function cleanError(error: unknown, fallback = FALLBACK) {
  if (!(error instanceof Error)) return fallback;

  const match = error.message.match(/Uncaught Error:\s*([^\n]+)/);
  if (match?.[1]) return match[1].trim();

  const firstLine = error.message.split("\n")[0]?.trim();
  if (!firstLine || firstLine.startsWith("[CONVEX")) return fallback;

  return firstLine;
}
