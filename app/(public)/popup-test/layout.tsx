import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Popup Test | Taloo',
};

export default function PopupTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
