import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, LogOut, User, Settings, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../../store/auth.store';
import { useTheme } from '../../store/theme.store';
import { notificationAPI } from '../../lib/api';
import { Avatar } from '../ui';
import { cn } from '../../lib/utils';
import { fmt as helpers } from '../../lib/helpers';
import toast from 'react-hot-toast';

export default function Header({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationAPI.list().then(r => {
      setNotifications(r.data.data.notifications);
      setUnread(r.data.data.unreadCount);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id: string) => {
    await notificationAPI.markRead(id);
    setNotifications(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(u => Math.max(0, u - 1));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <header className={cn(
      'fixed top-0 right-0 z-20 h-14 flex items-center gap-3 px-5',
      'bg-card/90 backdrop-blur-md border-b border-border transition-all duration-300',
      sidebarCollapsed ? 'left-[60px]' : 'left-[240px]'
    )}>
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Theme */}
        <button onClick={toggle} className="btn-ghost w-8 h-8 p-0 justify-center rounded-lg">
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotif(v => !v)} className="btn-ghost w-8 h-8 p-0 justify-center rounded-lg relative">
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-xl shadow-xl animate-scale-in z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm">Notifications</span>
                {unread > 0 && (
                  <button className="text-xs text-primary hover:underline" onClick={async () => {
                    await notificationAPI.markAllRead();
                    setNotifications(p => p.map(n => ({ ...n, isRead: true })));
                    setUnread(0);
                  }}>Mark all read</button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">No notifications</div>
                ) : notifications.map(n => (
                  <div key={n.id} onClick={() => markRead(n.id)}
                    className={cn('px-4 py-3 cursor-pointer hover:bg-muted/50 transition border-b border-border last:border-0', !n.isRead && 'bg-primary/5')}>
                    <div className="flex gap-2.5">
                      {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className={cn(!n.isRead ? '' : 'ml-4')}>
                        <div className="text-xs font-semibold text-foreground">{n.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                        <div className="text-xs text-muted-foreground/60 mt-1">{helpers.ago(n.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative ml-1" ref={userRef}>
          <button onClick={() => setShowUser(v => !v)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-accent transition">
            <Avatar name={user?.name} src={user?.avatar} size="xs" />
            <span className="hidden sm:block text-xs font-medium text-foreground">{user?.name?.split(' ')[0]}</span>
            <ChevronDown size={12} className="text-muted-foreground" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-11 w-44 bg-card border border-border rounded-xl shadow-xl animate-scale-in z-50 py-1">
              <button onClick={() => { navigate('/settings'); setShowUser(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted/50 transition">
                <User size={14} /> Profile
              </button>
              <button onClick={() => { navigate('/settings'); setShowUser(false); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-foreground hover:bg-muted/50 transition">
                <Settings size={14} /> Settings
              </button>
              <div className="border-t border-border my-1" />
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition">
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
