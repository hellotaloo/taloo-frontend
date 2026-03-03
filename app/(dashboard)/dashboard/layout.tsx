import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Taloo',
  description: 'Overzicht van agent activiteiten en prestaties',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
