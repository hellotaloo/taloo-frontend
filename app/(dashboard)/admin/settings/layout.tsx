import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'General Settings',
  description: 'Configure general application settings',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
