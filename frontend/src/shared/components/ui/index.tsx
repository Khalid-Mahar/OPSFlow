import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Search, Upload, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { fmt, getAvatarColor, statusColors, priorityColors } from '../../lib/helpers';

// ─────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────
interface AvatarProps { name?: string; src?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className?: string; }

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-lg' };
  const base = cn('rounded-full flex items-center justify-center font-semibold shrink-0 select-none', sizes[size], className);
  if (src) return <img src={src} alt={name} className={cn(base, 'object-cover')} />;
  return <div className={cn(base, getAvatarColor(name))}>{fmt.initials(name)}</div>;
}

export function AvatarGroup({ names, max = 3 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const extra = names.length - max;
  return (
    <div className="flex -space-x-2">
      {shown.map((n, i) => <Avatar key={i} name={n} size="xs" className="ring-2 ring-background" />)}
      {extra > 0 && <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">+{extra}</div>}
    </div>
  );
}

// ─────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { PENDING: 'Pending', IN_PROGRESS: 'In Progress', REVIEW: 'Review', COMPLETED: 'Completed', HOLD: 'Hold', CANCELLED: 'Cancelled', PLANNING: 'Planning', ACTIVE: 'Active', INACTIVE: 'Inactive', ON_LEAVE: 'On Leave', TERMINATED: 'Terminated', AVAILABLE: 'Available', ASSIGNED: 'Assigned', UNDER_REPAIR: 'Under Repair', LOST: 'Lost', DISPOSED: 'Disposed', ON_HOLD: 'On Hold', TESTING: 'Testing', OPEN: 'Open', RESOLVED: 'Resolved', CLOSED: 'Closed', active: 'Active', inactive: 'Inactive', suspended: 'Suspended' };
  return <span className={cn('badge', statusColors[status] || 'badge-default')}>{labels[status] || status}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={cn('badge', priorityColors[priority] || 'badge-default')}>
      <span className={cn('w-1.5 h-1.5 rounded-full', { LOW: 'bg-slate-400', MEDIUM: 'bg-blue-400', HIGH: 'bg-amber-400', CRITICAL: 'bg-red-500' }[priority] || 'bg-slate-400')} />
      {priority}
    </span>
  );
}

export function RoleBadge({ role }: { role?: string | null }) {
  const colors: Record<string, string> = { 'Super Admin': 'badge-danger', 'Admin': 'badge-purple', 'Team Lead': 'badge-warning', 'Employee': 'badge-info', 'Viewer': 'badge-default' };
  return <span className={cn('badge', colors[role || ''] || 'badge-default')}>{role || 'No Role'}</span>;
}

// ─────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; footer?: React.ReactNode; }

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', '2xl': 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={cn('relative w-full bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-in', sizes[size])} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-lg text-foreground">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border flex justify-end gap-3 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; danger?: boolean; }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className={danger ? 'btn-destructive' : 'btn-primary'} onClick={() => { onConfirm(); onClose(); }}>Confirm</button>
      </>}
    >
      <div className="flex gap-3">
        {danger && <AlertTriangle size={20} className="text-destructive shrink-0 mt-0.5" />}
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function TableSkeleton({ cols = 5, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5 border-b border-border">
              <Skeleton className={cn('h-4', j === 0 ? 'w-32' : j === cols - 1 ? 'w-16' : 'w-24')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// ─────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────
interface PaginationProps { page: number; pages: number; total: number; limit: number; onChange: (p: number) => void; }

export function Pagination({ page, pages, total, limit, onChange }: PaginationProps) {
  if (pages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pageNums = Array.from({ length: Math.min(pages, 5) }, (_, i) => {
    if (pages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= pages - 2) return pages - 4 + i;
    return page - 2 + i;
  });

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-muted-foreground">Showing {start}–{end} of {total}</p>
      <div className="flex gap-1">
        <button className="btn-ghost p-2 rounded-lg" onClick={() => onChange(page - 1)} disabled={page === 1}><ChevronLeft size={15} /></button>
        {pageNums.map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={cn('w-8 h-8 rounded-lg text-sm font-medium transition', p === page ? 'bg-primary text-primary-foreground' : 'btn-ghost')}>
            {p}
          </button>
        ))}
        <button className="btn-ghost p-2 rounded-lg" onClick={() => onChange(page + 1)} disabled={page === pages}><ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────
interface StatCardProps { title: string; value: number | string; icon: React.ElementType; color?: string; trend?: number; subtitle?: string; }

export function StatCard({ title, value, icon: Icon, color = 'primary', trend, subtitle }: StatCardProps) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    red: 'bg-red-500/10 text-red-500',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
  };
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color] || colorMap.primary)}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <span className={cn('text-xs font-semibold', trend >= 0 ? 'text-emerald-500' : 'text-red-500')}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{title}</div>
      {subtitle && <div className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</div>}
    </div>
  );
}

// ─────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: { icon?: React.ElementType; title: string; description?: string; action?: React.ReactNode; }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Icon size={26} className="text-muted-foreground" /></div>}
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ─────────────────────────────────────────
// SEARCH INPUT
// ─────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="field-input pl-9 pr-3" />
    </div>
  );
}

// ─────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────
export function ProgressBar({ value = 0, size = 'md', showLabel = false }: { value?: number; size?: 'sm' | 'md'; showLabel?: boolean; }) {
  const h = size === 'sm' ? 'h-1' : 'h-1.5';
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-primary' : pct >= 25 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="w-full">
      {showLabel && <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Progress</span><span className="font-semibold">{pct}%</span></div>}
      <div className={cn('w-full bg-muted rounded-full', h)}>
        <div className={cn('rounded-full transition-all duration-500', h, color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SELECT
// ─────────────────────────────────────────
export function Select({ value, onChange, options, placeholder = 'Select...', className }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; placeholder?: string; className?: string; }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={cn('field-input', className)}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─────────────────────────────────────────
// FILE UPLOAD
// ─────────────────────────────────────────
export function FileUploadArea({ onFile, accept, label = 'Click or drag to upload' }: { onFile: (f: File) => void; accept?: string; label?: string; }) {
  const [drag, setDrag] = useState(false);
  return (
    <label
      className={cn('flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition', drag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30')}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
    >
      <Upload size={20} className="text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <input type="file" className="hidden" accept={accept} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </label>
  );
}

// ─────────────────────────────────────────
// TOOLTIP
// ─────────────────────────────────────────
export function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
        {text}
      </div>
    </div>
  );
}
