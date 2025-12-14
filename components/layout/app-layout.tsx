'use client';

/**
 * Layout wrapper con sidebar y panel de historial mejorado
 * Se usa en todas las páginas de la aplicación
 * Mejoras: Usa Sheet para history-panel, mejor semántica HTML
 */

import { ReactNode, useState } from 'react';
import { MainSidebar } from './main-sidebar';
import { HistoryPanel } from './history-panel-v2';
import { Footer } from './footer';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const toggleHistory = () => setHistoryOpen(!historyOpen);

  return (
    <div className="flex min-h-screen flex-col">
      <MainSidebar onHistoryToggle={toggleHistory} historyOpen={historyOpen} />
      
      <div className="flex flex-1 md:pl-64">
        <main className="flex w-full flex-1 flex-col" role="main">
          {children}
          <Footer />
        </main>
      </div>

      <HistoryPanel open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
