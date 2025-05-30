"use client";

import { ReactNode } from 'react';

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <main className="flex-1 overflow-auto p-4">
        {children}
      </main>
    </div>
  );
}
