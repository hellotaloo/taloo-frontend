import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monitor',
  description: 'Bekijk alle systeem events',
};

export default function MonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
