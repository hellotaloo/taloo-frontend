import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architecture Visualization",
  description: "Interactive visualization of the Taloo backend architecture",
};

export default function ArchitectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
