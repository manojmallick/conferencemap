// src/app/layout.tsx
import type { Metadata } from 'next';
import '@progress/kendo-theme-default/dist/all.css';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'ConferenceMap - Verified by SigMap',
  description: 'The AI-powered, hallucination-free companion for JSNation & React Summit',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
