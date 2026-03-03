import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audit trail',
  description: 'Bekijk alle agent activiteiten',
};

export default function AuditTrailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
