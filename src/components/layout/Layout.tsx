import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text flex flex-col bg-grid">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
