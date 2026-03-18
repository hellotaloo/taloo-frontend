import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integratie configureren',
  description: 'Configureer een externe integratie',
};

export default function IntegrationDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
