import ReplyClient from "./ReplyClient";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default function ReplyPage() {
  return <ReplyClient />;
}
