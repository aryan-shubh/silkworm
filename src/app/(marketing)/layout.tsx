import { WordmarkHeader } from "@/components/marketing/wordmark-header";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <WordmarkHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
