import ReplyClient from "./ReplyClient";
import { PageShell } from "@/components";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default function ReplyPage() {
  return (
    <PageShell narrow>
      <ReplyClient />
    </PageShell>
  );
}
