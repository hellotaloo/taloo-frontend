import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Externe integraties',
  description: 'Beheer koppelingen met externe systemen',
};

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
