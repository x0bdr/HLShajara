import SubmitClient from "./SubmitClient";
import { PageShell } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default function SubmitPage() {
  return (
    <PageShell narrow>
      <SubmitClient />
    </PageShell>
  );
}
