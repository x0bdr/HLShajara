import EntityDetailClient from "./EntityDetailClient";

export function generateStaticParams() {
  return [{ id: "ent-001" }, { id: "ent-002" }, { id: "ent-003" }];
}

export default function EntityDetailPage({ params }: { params: { id: string } }) {
  return <EntityDetailClient id={params.id} />;
}
