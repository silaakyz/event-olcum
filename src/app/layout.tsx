import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Event OLCUM',
  description: 'Phase 0 event measurement bootstrap',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
