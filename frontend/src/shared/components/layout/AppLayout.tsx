import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '../../lib/utils';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div className={cn('transition-all duration-300', collapsed ? 'ml-[60px]' : 'ml-[240px]')}>
        <Header sidebarCollapsed={collapsed} />
        <main className="pt-14 min-h-screen">
          <div className="p-6 page-enter"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
