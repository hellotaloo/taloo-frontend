import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solliciteren | Taloo',
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
