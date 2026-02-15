import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Results | Taloo',
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
