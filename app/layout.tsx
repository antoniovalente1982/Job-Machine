import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './components/AuthProvider';

export const metadata: Metadata = {
  title: 'Job Machine — HR SaaS Platform',
  description: 'Piattaforma di gestione recruiting multi-cliente',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
