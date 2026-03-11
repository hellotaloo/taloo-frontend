import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taloo",
  description: "Complete your request",
};

export default function WhatsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-white font-[var(--font-inter)] text-gray-900">
      {children}
    </div>
  );
}
