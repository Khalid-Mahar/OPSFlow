import { format, formatDistanceToNow, isBefore, isAfter, addDays } from 'date-fns';

export const fmt = {
  date: (d?: string | Date | null) => d ? format(new Date(d), 'MMM d, yyyy') : '—',
  dateTime: (d?: string | Date | null) => d ? format(new Date(d), 'MMM d, yyyy HH:mm') : '—',
  ago: (d?: string | Date | null) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—',
  currency: (n?: number | null) => n != null ? `PKR ${n.toLocaleString()}` : '—',
  fileSize: (bytes?: number | null) => {
    if (!bytes) return '—';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  },
  percent: (n?: number | null) => n != null ? `${n}%` : '0%',
  initials: (name?: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
};

export const isOverdue = (d?: string | Date | null) =>
  d ? isBefore(new Date(d), new Date()) : false;

export const isExpiringSoon = (d?: string | Date | null, days = 30) =>
  d ? isAfter(new Date(d), new Date()) && isBefore(new Date(d), addDays(new Date(), days)) : false;

export const statusColors: Record<string, string> = {
  // Task
  PENDING: 'badge-default', IN_PROGRESS: 'badge-info', REVIEW: 'badge-purple',
  COMPLETED: 'badge-success', HOLD: 'badge-warning', CANCELLED: 'badge-danger',
  // Project
  PLANNING: 'badge-info', TESTING: 'badge-purple', ON_HOLD: 'badge-warning',
  // Asset
  AVAILABLE: 'badge-success', ASSIGNED: 'badge-info', UNDER_REPAIR: 'badge-warning',
  LOST: 'badge-danger', DISPOSED: 'badge-default',
  // Employee
  ACTIVE: 'badge-success', INACTIVE: 'badge-default', ON_LEAVE: 'badge-warning', TERMINATED: 'badge-danger',
  // Ticket
  OPEN: 'badge-info', RESOLVED: 'badge-success', CLOSED: 'badge-default',
  // General
  active: 'badge-success', inactive: 'badge-default', suspended: 'badge-warning',
};

export const priorityColors: Record<string, string> = {
  LOW: 'badge-default', MEDIUM: 'badge-info', HIGH: 'badge-warning', CRITICAL: 'badge-danger',
};

export const priorityDot: Record<string, string> = {
  LOW: 'bg-slate-400', MEDIUM: 'bg-blue-400', HIGH: 'bg-amber-400', CRITICAL: 'bg-red-500',
};

export const assetCategoryIcon: Record<string, string> = {
  LAPTOP: '💻', TABLET: '📱', MOBILE: '📱', ROUTER: '📡',
  CAMERA: '📷', PRINTER: '🖨️', MONITOR: '🖥️', NETWORK_DEVICE: '🔌', OTHER: '📦',
};

export const avatarColors = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
];

export const getAvatarColor = (name?: string) =>
  avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

export const truncate = (s: string, n = 40) => s.length > n ? s.slice(0, n) + '…' : s;
