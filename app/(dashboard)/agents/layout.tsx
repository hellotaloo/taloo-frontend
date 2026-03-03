import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agents | Taloo',
  description: 'Ontdek en activeer AI agents voor je workspace',
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
