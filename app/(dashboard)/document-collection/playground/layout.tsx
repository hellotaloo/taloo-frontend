import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentcollectie playground',
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
