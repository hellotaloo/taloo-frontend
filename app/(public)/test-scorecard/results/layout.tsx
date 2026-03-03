import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Results',
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
