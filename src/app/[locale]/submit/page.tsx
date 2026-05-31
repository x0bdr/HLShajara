import SubmitClient from "./SubmitClient";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default function SubmitPage() {
  return <SubmitClient />;
}
