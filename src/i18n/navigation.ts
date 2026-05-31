import { createNavigation } from "next-intl/navigation";

export const locales = ["ar", "en"] as const;
export const localePrefix = "always" as const;

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  localePrefix,
});
