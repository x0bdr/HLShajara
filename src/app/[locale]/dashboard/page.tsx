import DashboardClient from "./DashboardClient";
import { PageShell } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default function DashboardPage() {
  return (
    <PageShell>
      <DashboardClient />
    </PageShell>
  );
}
