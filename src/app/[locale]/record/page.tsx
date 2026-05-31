import RecordClient from "./RecordClient";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default function RecordPage() {
  return <RecordClient />;
}
