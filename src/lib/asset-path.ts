/**
 * Prefix a public asset path with the configured basePath.
 * Works in both client and server components because NEXT_PUBLIC_BASE_PATH
 * is inlined by Next.js at build time.
 */
export function assetPath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (path.startsWith("/")) {
    return `${base}${path}`;
  }
  return path;
}
