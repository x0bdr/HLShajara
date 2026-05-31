import EntityDetailClient from "./EntityDetailClient";

export function generateStaticParams() {
  return [{ id: "ent-001" }, { id: "ent-002" }, { id: "ent-003" }];
}

export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  return <EntityDetailClient id={id} />;
}
