import EntityDetailClient from "./EntityDetailClient";
import { PageShell } from "@/components";

export function generateStaticParams() {
  const ids = ["ent-001", "ent-002", "ent-003"];
  const locales = ["ar", "en"];
  return locales.flatMap((locale) => ids.map((id) => ({ locale, id })));
}

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell>
      <EntityDetailClient id={id} />
    </PageShell>
  );
}
