import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pre-screening playground',
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
