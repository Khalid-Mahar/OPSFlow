import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Monitor, Smartphone, Camera,
  Key, FolderKanban, CheckSquare, ClipboardList, Files,
  Activity, Settings, ChevronLeft, ChevronRight, Zap,
  Ticket, Bell, Shield, BarChart2, ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../store/auth.store';
import { Avatar } from '../ui';

interface NavItem { to: string; icon: React.ElementType; label: string; permission?: string; badge?: number; }
interface NavGroup { label: string; items: NavItem[]; }

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'People & Assets',
    items: [
      { to: '/employees', icon: Users, label: 'Employees', permission: 'employee.view' },
      { to: '/assets', icon: Monitor, label: 'Assets', permission: 'asset.view' },
      { to: '/sims', icon: Smartphone, label: 'SIM Cards', permission: 'sim.view' },
      { to: '/cameras', icon: Camera, label: 'Cameras', permission: 'sim.view' },
      { to: '/credentials', icon: Key, label: 'Credentials', permission: 'credential.view' },
    ]
  },
  {
    label: 'Work',
    items: [
      { to: '/projects', icon: FolderKanban, label: 'Projects', permission: 'project.view' },
      { to: '/tasks', icon: CheckSquare, label: 'Tasks', permission: 'task.view' },
      { to: '/todos', icon: ClipboardList, label: 'Daily Ops' },
      { to: '/tickets', icon: Ticket, label: 'Tickets' },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/files', icon: Files, label: 'Files', permission: 'file.view' },
      { to: '/activity', icon: Activity, label: 'Audit Log', permission: 'audit.view' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]
  }
];

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user, can } = useAuth();
  const location = useLocation();

  return (
    <aside className={cn('sidebar shadow-sm', collapsed ? 'w-[60px]' : 'w-[240px]')}>
      {/* Logo */}
      <div className={cn('flex items-center h-14 border-b border-border shrink-0 px-3', collapsed ? 'justify-center' : 'gap-3 px-4')}>
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap size={14} className="text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-semibold text-sm text-foreground truncate">OpsFlow</div>
            <div className="text-xs text-muted-foreground">ERP v2</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map(group => {
          const visibleItems = group.items.filter(item => !item.permission || can(item.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-1.5">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map(item => {
                  const isActive = item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to);
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        title={collapsed ? item.label : undefined}
                        className={cn('nav-link', isActive && 'active', collapsed && 'justify-center px-0')}
                      >
                        <item.icon size={17} className="shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-border shrink-0">
        <div className={cn('flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent transition cursor-pointer', collapsed && 'justify-center')}>
          <Avatar name={user?.name} src={user?.avatar} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground capitalize truncate">{user?.role || 'User'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-accent transition z-10"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
}
