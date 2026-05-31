import RecordClient from "./RecordClient";
import { PageShell } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default function RecordPage() {
  return (
    <PageShell>
      <RecordClient />
    </PageShell>
  );
}
