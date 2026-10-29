// Safe redirect validator (prevents open redirect vulnerabilities)
// Safe to import in both client and server components
export function isValidRedirect(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  return (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.includes("\\") &&
    !url.includes(":")
  );
}
