import ReviewerClient from "./ReviewerClient";

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default function ReviewerPage() {
  return <ReviewerClient />;
}
