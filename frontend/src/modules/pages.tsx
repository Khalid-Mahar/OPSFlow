// ═══════════════════════════════════════════
// ALL PAGES — Employees, Assets, SIMs,
// Cameras, Credentials, Projects, Tasks,
// Todos, Files, Tickets, Settings, ActivityLog
// ═══════════════════════════════════════════
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Edit, Trash2, Eye, EyeOff, UserCheck, User, Monitor, Smartphone,
  Camera, Key, FolderKanban, CheckSquare, ClipboardList, Files,
  Ticket, Activity, Settings, Copy, Check, Download, Upload,
  MapPin, AlertTriangle, Save, Shield, Lock, Palette, Bell,
  MessageSquare, Paperclip, Calendar, RefreshCw, FolderOpen,
  FileText, Image, Archive, File, XCircle, Play, Pause
} from 'lucide-react';
import {
  SearchInput, Pagination, EmptyState, StatusBadge, PriorityBadge,
  RoleBadge, Modal, ConfirmDialog, Avatar, AvatarGroup,
  Skeleton, TableSkeleton, StatCard, ProgressBar, Select, FileUploadArea, Tooltip
} from '../shared/components/ui';
import { employeeAPI, assetAPI, simAPI, credentialAPI, projectAPI, taskAPI, todoAPI, fileAPI, auditAPI, ticketAPI, userAPI } from '../shared/lib/api';
import { fmt, isOverdue, isExpiringSoon, assetCategoryIcon, statusColors, priorityColors } from '../shared/lib/helpers';
import { cn } from '../shared/lib/utils';
import { useAuth } from '../shared/store/auth.store';
import { useTheme } from '../shared/store/theme.store';
import toast from 'react-hot-toast';
import { isBefore, addDays } from 'date-fns';

// ─────────────────────────────────────────
// HELPER: CopyBtn
// ─────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="btn-ghost p-1 rounded">
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

// ─────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────
const DEPTS = ['IT', 'Development', 'Design', 'HR', 'Finance', 'Operations', 'Marketing', 'Support'];
const EMP_STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];

function EmployeeForm({ data, onSubmit, onClose }: any) {
  const [form, setForm] = useState(data || { fullName: '', designation: '', department: '', phone: '', cnic: '', address: '', joiningDate: '', status: 'ACTIVE', notes: '', email: '', password: '', roleId: '' });
  const [roles, setRoles] = useState<any[]>([]);
  useEffect(() => { userAPI.list().then(r => setRoles(r.data.data?.data || [])).catch(() => {}); }, []);
  const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="field-label">Full Name *</label><input className="field-input" value={form.fullName} onChange={e => s('fullName', e.target.value)} required /></div>
        {!data && <>
          <div><label className="field-label">Email *</label><input type="email" className="field-input" value={form.email} onChange={e => s('email', e.target.value)} required /></div>
          <div><label className="field-label">Password</label><input type="password" className="field-input" placeholder="Default: OpsFlow@2024" value={form.password} onChange={e => s('password', e.target.value)} /></div>
        </>}
        <div><label className="field-label">Designation</label><input className="field-input" value={form.designation || ''} onChange={e => s('designation', e.target.value)} /></div>
        <div><label className="field-label">Department</label>
          <select className="field-input" value={form.department || ''} onChange={e => s('department', e.target.value)}>
            <option value="">Select</option>{DEPTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div><label className="field-label">Phone</label><input className="field-input" value={form.phone || ''} onChange={e => s('phone', e.target.value)} /></div>
        <div><label className="field-label">CNIC</label><input className="field-input" placeholder="35201-1234567-1" value={form.cnic || ''} onChange={e => s('cnic', e.target.value)} /></div>
        <div><label className="field-label">Joining Date</label><input type="date" className="field-input" value={form.joiningDate?.slice(0, 10) || ''} onChange={e => s('joiningDate', e.target.value)} /></div>
        <div><label className="field-label">Status</label>
          <select className="field-input" value={form.status} onChange={e => s('status', e.target.value)}>
            {EMP_STATUSES.map(st => <option key={st}>{st}</option>)}
          </select>
        </div>
        <div className="col-span-2"><label className="field-label">Address</label><input className="field-input" value={form.address || ''} onChange={e => s('address', e.target.value)} /></div>
        <div className="col-span-2"><label className="field-label">Notes</label><textarea className="field-input resize-none min-h-16" value={form.notes || ''} onChange={e => s('notes', e.target.value)} /></div>
      </div>
      <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary">{data ? 'Update' : 'Add'} Employee</button></div>
    </form>
  );
}

export function EmployeesPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<any[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [pages, setPages] = useState(1);
  const [search, setSearch] = useState(''); const [statusF, setStatusF] = useState(''); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [editItem, setEditItem] = useState<any>(null); const [viewItem, setViewItem] = useState<any>(null); const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await employeeAPI.list({ search, status: statusF, page, limit: 10 }); setItems(r.data.data.data); setTotal(r.data.data.total); setPages(r.data.data.pages); }
    catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, [search, statusF, page]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="page-header"><div><h1 className="page-title">Employees</h1><p className="page-subtitle">{total} total</p></div>
        {can('employee.create') && <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} />Add Employee</button>}
      </div>
      <div className="flex gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="flex-1 min-w-52" />
        <select className="field-input w-auto" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Status</option>{EMP_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden"><table className="data-table"><thead><tr><th>Employee</th><th>Designation</th><th>Department</th><th>Phone</th><th>Joined</th><th>Status</th><th>Role</th>{can('employee.edit') && <th className="text-right">Actions</th>}</tr></thead>
        <tbody>
          {loading ? <TableSkeleton cols={8} /> : items.length === 0 ? (
            <tr><td colSpan={8}><EmptyState icon={UserCheck} title="No employees found" /></td></tr>
          ) : items.map(emp => (
            <tr key={emp.id}>
              <td><div className="flex items-center gap-3"><Avatar name={emp.fullName} src={emp.profileImage} size="sm" /><div><div className="font-medium text-sm">{emp.fullName}</div><div className="text-xs text-muted-foreground">{emp.user?.email}</div></div></div></td>
              <td className="text-sm">{emp.designation || '—'}</td>
              <td className="text-sm">{emp.department || '—'}</td>
              <td className="text-sm font-mono">{emp.phone || '—'}</td>
              <td className="text-sm">{fmt.date(emp.joiningDate)}</td>
              <td><StatusBadge status={emp.status} /></td>
              <td><RoleBadge role={emp.user?.role?.name} /></td>
              {can('employee.edit') && <td><div className="flex items-center justify-end gap-1">
                <button className="btn-ghost p-1.5 rounded-lg" onClick={() => setViewItem(emp)}><Eye size={14} /></button>
                <button className="btn-ghost p-1.5 rounded-lg" onClick={() => setEditItem(emp)}><Edit size={14} /></button>
                {can('employee.delete') && <button className="btn-ghost p-1.5 rounded-lg text-destructive" onClick={() => setDeleteId(emp.id)}><Trash2 size={14} /></button>}
              </div></td>}
            </tr>
          ))}
        </tbody>
      </table></div>
      <Pagination page={page} pages={pages} total={total} limit={10} onChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Employee" size="lg"><EmployeeForm onSubmit={async (d: any) => { try { await employeeAPI.create(d); toast.success('Employee added!'); setShowForm(false); load(); } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); } }} onClose={() => setShowForm(false)} /></Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Employee" size="lg">{editItem && <EmployeeForm data={editItem} onSubmit={async (d: any) => { try { await employeeAPI.update(editItem.id, d); toast.success('Updated!'); setEditItem(null); load(); } catch { toast.error('Failed'); } }} onClose={() => setEditItem(null)} />}</Modal>
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Employee Profile" size="lg">{viewItem && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-border"><Avatar name={viewItem.fullName} size="xl" />
            <div><h2 className="text-xl font-bold">{viewItem.fullName}</h2><p className="text-muted-foreground text-sm">{viewItem.designation} · {viewItem.department}</p>
              <div className="flex gap-2 mt-2"><StatusBadge status={viewItem.status} /><RoleBadge role={viewItem.user?.role?.name} /></div></div></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[['Email', viewItem.user?.email], ['Phone', viewItem.phone], ['CNIC', viewItem.cnic], ['Address', viewItem.address], ['Joined', fmt.date(viewItem.joiningDate)], ['Last Login', fmt.ago(viewItem.user?.lastLogin)]].map(([k, v]) => (
              <div key={k as string} className="bg-muted/40 rounded-xl p-3"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{k}</div><div>{v as string || '—'}</div></div>
            ))}
          </div>
          {viewItem.assignedAssets?.length > 0 && <div><h4 className="font-semibold text-sm mb-2">Assigned Assets</h4><div className="flex flex-wrap gap-2">{viewItem.assignedAssets.map((a: any) => <span key={a.id} className="badge badge-info">{assetCategoryIcon[a.category] || '??'} {a.assetTag}</span>)}</div></div>}
        </div>
      )}</Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { try { await employeeAPI.delete(deleteId!); toast.success('Deleted'); setDeleteId(null); load(); } catch { toast.error('Failed'); } }} title="Delete Employee" message="This will permanently delete the employee and their user account." danger />
    </div>
  );
}

// ─────────────────────────────────────────
// ASSETS
// ─────────────────────────────────────────
const ASSET_CATS = ['LAPTOP', 'TABLET', 'MOBILE', 'ROUTER', 'CAMERA', 'PRINTER', 'MONITOR', 'NETWORK_DEVICE', 'OTHER'];
const ASSET_STATUSES = ['AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'LOST', 'DISPOSED'];

export function AssetsPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<any[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [pages, setPages] = useState(1);
  const [search, setSearch] = useState(''); const [catF, setCatF] = useState(''); const [statusF, setStatusF] = useState(''); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [editItem, setEditItem] = useState<any>(null); const [viewItem, setViewItem] = useState<any>(null); const [deleteId, setDeleteId] = useState<string | null>(null); const [assignItem, setAssignItem] = useState<any>(null); const [employees, setEmployees] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await assetAPI.list({ search, category: catF, status: statusF, page, limit: 12 }); setItems(r.data.data.data); setTotal(r.data.data.total); setPages(r.data.data.pages); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  }, [search, catF, statusF, page]);
  useEffect(() => { load(); employeeAPI.list({ status: 'ACTIVE', limit: 100 }).then(r => setEmployees(r.data.data.data || [])); }, [load]);

  const AssetForm = ({ data, onSubmit, onClose }: any) => {
    const [form, setForm] = useState(data || { assetTag: '', category: 'LAPTOP', brand: '', model: '', serialNumber: '', status: 'AVAILABLE', purchaseDate: '', warrantyExpiry: '', notes: '' });
    const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
    return (
      <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="field-label">Asset Tag *</label><input className="field-input" value={form.assetTag} onChange={e => s('assetTag', e.target.value)} required placeholder="AST-001" /></div>
          <div><label className="field-label">Category</label><select className="field-input" value={form.category} onChange={e => s('category', e.target.value)}>{ASSET_CATS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className="field-label">Brand</label><input className="field-input" value={form.brand || ''} onChange={e => s('brand', e.target.value)} /></div>
          <div><label className="field-label">Model</label><input className="field-input" value={form.model || ''} onChange={e => s('model', e.target.value)} /></div>
          <div><label className="field-label">Serial Number</label><input className="field-input" value={form.serialNumber || ''} onChange={e => s('serialNumber', e.target.value)} /></div>
          <div><label className="field-label">Status</label><select className="field-input" value={form.status} onChange={e => s('status', e.target.value)}>{ASSET_STATUSES.map(st => <option key={st}>{st}</option>)}</select></div>
          <div><label className="field-label">Purchase Date</label><input type="date" className="field-input" value={form.purchaseDate?.slice(0, 10) || ''} onChange={e => s('purchaseDate', e.target.value)} /></div>
          <div><label className="field-label">Warranty Expiry</label><input type="date" className="field-input" value={form.warrantyExpiry?.slice(0, 10) || ''} onChange={e => s('warrantyExpiry', e.target.value)} /></div>
          <div className="col-span-2"><label className="field-label">Notes</label><textarea className="field-input resize-none min-h-16" value={form.notes || ''} onChange={e => s('notes', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary">{data ? 'Update' : 'Add'} Asset</button></div>
      </form>
    );
  };

  return (
    <div className="space-y-5">
      <div className="page-header"><div><h1 className="page-title">Assets</h1><p className="page-subtitle">{total} total assets</p></div>
        {can('asset.create') && <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} />Add Asset</button>}
      </div>
      <div className="flex gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search assets..." className="flex-1 min-w-52" />
        <select className="field-input w-auto" value={catF} onChange={e => setCatF(e.target.value)}><option value="">All Categories</option>{ASSET_CATS.map(c => <option key={c}>{c.replace('_', ' ')}</option>)}</select>
        <select className="field-input w-auto" value={statusF} onChange={e => setStatusF(e.target.value)}><option value="">All Status</option>{ASSET_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
      </div>
      <div className="card overflow-hidden"><table className="data-table"><thead><tr><th>Asset</th><th>Category</th><th>Serial No.</th><th>Assigned To</th><th>Purchase</th><th>Warranty</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
        <tbody>
          {loading ? <TableSkeleton cols={8} /> : items.length === 0 ? (
            <tr><td colSpan={8}><EmptyState icon={Monitor} title="No assets found" /></td></tr>
          ) : items.map(a => (
            <tr key={a.id}>
              <td><div className="flex items-center gap-2"><span className="text-lg">{assetCategoryIcon[a.category] || '??'}</span><div><div className="font-medium text-sm">{a.assetTag}</div><div className="text-xs text-muted-foreground">{a.brand} {a.model}</div></div></div></td>
              <td><span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{a.category}</span></td>
              <td><span className="text-xs font-mono">{a.serialNumber || '—'}</span></td>
              <td className="text-sm">{a.employee?.fullName || <span className="text-muted-foreground">Unassigned</span>}</td>
              <td className="text-sm">{fmt.date(a.purchaseDate)}</td>
              <td className="text-sm"><span className={cn(isExpiringSoon(a.warrantyExpiry, 90) ? 'text-amber-500 font-medium' : '')}>{fmt.date(a.warrantyExpiry)}</span></td>
              <td><StatusBadge status={a.status} /></td>
              <td><div className="flex items-center justify-end gap-1">
                <button className="btn-ghost p-1.5 rounded-lg" onClick={() => setViewItem(a)}><Eye size={14} /></button>
                {can('asset.edit') && <><button className="btn-ghost p-1.5 rounded-lg" onClick={() => setEditItem(a)}><Edit size={14} /></button>
                  {a.status === 'AVAILABLE' && <button className="btn-ghost p-1.5 rounded-lg text-primary" onClick={() => setAssignItem(a)} title="Assign"><UserCheck size={14} /></button>}</>}
                {can('asset.delete') && <button className="btn-ghost p-1.5 rounded-lg text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 size={14} /></button>}
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <Pagination page={page} pages={pages} total={total} limit={12} onChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Asset" size="lg"><AssetForm onSubmit={async (d: any) => { try { await assetAPI.create(d); toast.success('Asset added!'); setShowForm(false); load(); } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); } }} onClose={() => setShowForm(false)} /></Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Asset" size="lg">{editItem && <AssetForm data={editItem} onSubmit={async (d: any) => { try { await assetAPI.update(editItem.id, d); toast.success('Updated!'); setEditItem(null); load(); } catch { toast.error('Failed'); } }} onClose={() => setEditItem(null)} />}</Modal>
      <Modal open={!!assignItem} onClose={() => setAssignItem(null)} title={`Assign ${assignItem?.assetTag}`} size="sm">
        {assignItem && (() => { let empId = ''; return (<div className="space-y-4"><div><label className="field-label">Assign To</label><select className="field-input" onChange={e => { empId = e.target.value; }}><option value="">Select Employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.fullName} — {e.designation}</option>)}</select></div><div className="flex justify-end gap-3"><button className="btn-secondary" onClick={() => setAssignItem(null)}>Cancel</button><button className="btn-primary" onClick={async () => { if (!empId) return; try { await assetAPI.assign(assignItem.id, empId); toast.success('Assigned!'); setAssignItem(null); load(); } catch { toast.error('Failed'); } }}>Assign</button></div></div>); })()}
      </Modal>
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Asset Details" size="md">{viewItem && (
        <div className="space-y-3">
          <div className="text-center py-3 text-5xl">{assetCategoryIcon[viewItem.category] || '??'}</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[['Asset Tag', viewItem.assetTag], ['Category', viewItem.category], ['Brand', viewItem.brand], ['Model', viewItem.model], ['Serial No.', viewItem.serialNumber], ['Status', viewItem.status], ['Purchase', fmt.date(viewItem.purchaseDate)], ['Warranty', fmt.date(viewItem.warrantyExpiry)], ['Assigned To', viewItem.employee?.fullName || 'Unassigned']].map(([k, v]) => (
              <div key={k as string} className="bg-muted/40 rounded-xl p-3"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{k}</div><div>{v as string || '—'}</div></div>
            ))}
          </div>
          {viewItem.history?.length > 0 && <div><h4 className="font-semibold text-sm mb-2">Assignment History</h4>{viewItem.history.map((h: any, i: number) => (<div key={i} className="text-xs p-2 bg-muted/30 rounded-lg flex justify-between"><span className="font-medium">{h.action}</span><span className="text-muted-foreground">{fmt.date(h.createdAt)}</span></div>))}</div>}
        </div>
      )}</Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { try { await assetAPI.delete(deleteId!); toast.success('Deleted'); setDeleteId(null); load(); } catch { toast.error('Failed'); } }} title="Delete Asset" message="Permanently delete this asset?" danger />
    </div>
  );
}

// ─────────────────────────────────────────
// SIMS
// ─────────────────────────────────────────
export function SimsPage() {
  const { can } = useAuth();
  const [sims, setSims] = useState<any[]>([]); const [cameras, setCameras] = useState<any[]>([]); const [tab, setTab] = useState<'sims' | 'cameras'>('sims');
  const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [editItem, setEditItem] = useState<any>(null); const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCamForm, setShowCamForm] = useState(false); const [editCam, setEditCam] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [s, c] = await Promise.all([simAPI.list({ search }), simAPI.cameras()]); setSims(s.data.data); setCameras(c.data.data); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  }, [search]);
  useEffect(() => { load(); employeeAPI.list({ status: 'ACTIVE', limit: 100 }).then(r => setEmployees(r.data.data.data || [])); }, [load]);

  const SimForm = ({ data, onSubmit, onClose }: any) => {
    const [form, setForm] = useState(data || { simNumber: '', network: 'JAZZ', packageName: '', packageCost: '', activationDate: '', expiryDate: '', employeeId: '', status: 'active', notes: '' });
    const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
    return (
      <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="field-label">SIM Number *</label><input className="field-input" value={form.simNumber} onChange={e => s('simNumber', e.target.value)} required placeholder="0300-1234567" /></div>
          <div><label className="field-label">Network</label><select className="field-input" value={form.network} onChange={e => s('network', e.target.value)}>{['JAZZ', 'ZONG', 'TELENOR', 'UFONE', 'SCO', 'OTHER'].map(n => <option key={n}>{n}</option>)}</select></div>
          <div><label className="field-label">Package Name</label><input className="field-input" value={form.packageName || ''} onChange={e => s('packageName', e.target.value)} /></div>
          <div><label className="field-label">Monthly Cost (PKR)</label><input type="number" className="field-input" value={form.packageCost || ''} onChange={e => s('packageCost', e.target.value)} /></div>
          <div><label className="field-label">Activation Date</label><input type="date" className="field-input" value={form.activationDate?.slice(0, 10) || ''} onChange={e => s('activationDate', e.target.value)} /></div>
          <div><label className="field-label">Expiry Date</label><input type="date" className="field-input" value={form.expiryDate?.slice(0, 10) || ''} onChange={e => s('expiryDate', e.target.value)} /></div>
          <div><label className="field-label">Assigned Employee</label><select className="field-input" value={form.employeeId || ''} onChange={e => s('employeeId', e.target.value)}><option value="">None</option>{employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></div>
          <div><label className="field-label">Status</label><select className="field-input" value={form.status} onChange={e => s('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></div>
        </div>
        <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary">{data ? 'Update' : 'Add'} SIM</button></div>
      </form>
    );
  };

  const CameraForm = ({ data, onSubmit, onClose }: any) => {
    const [form, setForm] = useState(data || { name: '', location: '', simId: '', status: 'active', installationDate: '', notes: '' });
    const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
    return (
      <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="field-label">Camera Name *</label><input className="field-input" value={form.name} onChange={e => s('name', e.target.value)} required /></div>
          <div><label className="field-label">Location</label><input className="field-input" value={form.location || ''} onChange={e => s('location', e.target.value)} /></div>
          <div><label className="field-label">Connected SIM</label><select className="field-input" value={form.simId || ''} onChange={e => s('simId', e.target.value)}><option value="">None</option>{sims.map(s => <option key={s.id} value={s.id}>{s.simNumber} ({s.network})</option>)}</select></div>
          <div><label className="field-label">Status</label><select className="field-input" value={form.status} onChange={e => s('status', e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="maintenance">Maintenance</option></select></div>
          <div><label className="field-label">Installation Date</label><input type="date" className="field-input" value={form.installationDate?.slice(0, 10) || ''} onChange={e => s('installationDate', e.target.value)} /></div>
          <div className="col-span-2"><label className="field-label">Notes</label><textarea className="field-input resize-none min-h-16" value={form.notes || ''} onChange={e => s('notes', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary">{data ? 'Update' : 'Add'} Camera</button></div>
      </form>
    );
  };

  const expiringSoon = sims.filter(s => s.expiryDate && isExpiringSoon(s.expiryDate, 30) && !isBefore(new Date(s.expiryDate), new Date()));
  const filtered = tab === 'sims' ? sims.filter(s => !search || s.simNumber.includes(search) || s.network.toLowerCase().includes(search.toLowerCase())) : cameras.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="page-header"><div><h1 className="page-title">SIMs & Cameras</h1><p className="page-subtitle">{sims.length} SIMs · {cameras.length} Cameras</p></div>
        {can('sim.create') && <button className="btn-primary" onClick={() => tab === 'sims' ? setShowForm(true) : setShowCamForm(true)}><Plus size={15} />Add {tab === 'sims' ? 'SIM' : 'Camera'}</button>}
      </div>
      {expiringSoon.length > 0 && <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400"><AlertTriangle size={15} className="shrink-0" /><span><strong>{expiringSoon.length} SIM(s)</strong> expiring within 30 days: {expiringSoon.map(s => s.simNumber).join(', ')}</span></div>}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex bg-muted rounded-xl p-1 gap-1">{['sims', 'cameras'].map(t => <button key={t} onClick={() => setTab(t as any)} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition', tab === t ? 'bg-background shadow text-foreground' : 'text-muted-foreground')}>{t}</button>)}</div>
        <SearchInput value={search} onChange={setSearch} placeholder={`Search ${tab}...`} className="flex-1 min-w-48" />
      </div>

      {tab === 'sims' ? (
        <div className="card overflow-hidden"><table className="data-table"><thead><tr><th>SIM Number</th><th>Network</th><th>Package</th><th>Employee</th><th>Expiry</th><th>Cost/mo</th><th>Status</th>{can('sim.edit') && <th className="text-right">Actions</th>}</tr></thead>
          <tbody>
            {loading ? <TableSkeleton cols={8} /> : filtered.length === 0 ? <tr><td colSpan={8}><EmptyState icon={Smartphone} title="No SIMs found" /></td></tr>
              : filtered.map((sim: any) => {
                const expired = isBefore(new Date(sim.expiryDate), new Date());
                const expiring = !expired && isExpiringSoon(sim.expiryDate, 30);
                return (
                  <tr key={sim.id}>
                    <td><div className="flex items-center gap-1.5"><span className="font-mono font-medium text-sm">{sim.simNumber}</span><CopyBtn text={sim.simNumber} /></div></td>
                    <td><span className="badge badge-info text-xs">{sim.network}</span></td>
                    <td className="text-xs text-muted-foreground max-w-32 truncate">{sim.packageName || '—'}</td>
                    <td className="text-sm">{sim.employee?.fullName || '—'}</td>
                    <td><span className={cn('text-sm font-medium', expired ? 'text-destructive' : expiring ? 'text-amber-500' : '')}>{fmt.date(sim.expiryDate)}{expired && ' ⚠'}</span></td>
                    <td className="text-sm">{sim.packageCost ? `PKR ${Number(sim.packageCost).toLocaleString()}` : '—'}</td>
                    <td><StatusBadge status={sim.status} /></td>
                    {can('sim.edit') && <td><div className="flex items-center justify-end gap-1">
                      <button className="btn-ghost p-1.5 rounded-lg" onClick={() => setEditItem(sim)}><Edit size={14} /></button>
                      {can('sim.delete') && <button className="btn-ghost p-1.5 rounded-lg text-destructive" onClick={() => setDeleteId(sim.id)}><Trash2 size={14} /></button>}
                    </div></td>}
                  </tr>
                );
              })}
          </tbody>
        </table></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array(6).fill(0).map((_, i) => <div key={i} className="card p-4 space-y-3"><Skeleton className="h-32 w-full rounded-xl" /><Skeleton className="h-4 w-1/2" /></div>)
            : filtered.length === 0 ? <div className="col-span-3"><EmptyState icon={Camera} title="No cameras found" /></div>
              : (filtered as any[]).map((cam: any) => (
                <div key={cam.id} className="card overflow-hidden hover:shadow-md transition group">
                  <div className="bg-slate-900 h-36 flex items-center justify-center relative">
                    <Camera size={36} className="text-slate-600" />
                    <div className="absolute top-2 right-2"><span className={cn('badge text-xs', cam.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white')}>{cam.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block mr-1" />}{cam.status}</span></div>
                    {cam.sim && <div className="absolute bottom-2 left-2"><span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">{cam.sim.network}</span></div>}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div><h3 className="font-semibold text-sm">{cam.name}</h3>{cam.location && <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><MapPin size={10} />{cam.location}</div>}</div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        {can('sim.edit') && <button className="btn-ghost p-1 rounded" onClick={() => setEditCam(cam)}><Edit size={13} /></button>}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">Installed: {fmt.date(cam.installationDate)}</div>
                  </div>
                </div>
              ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add SIM Card" size="lg"><SimForm onSubmit={async (d: any) => { try { await simAPI.create(d); toast.success('SIM added!'); setShowForm(false); load(); } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); } }} onClose={() => setShowForm(false)} /></Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit SIM" size="lg">{editItem && <SimForm data={editItem} onSubmit={async (d: any) => { try { await simAPI.update(editItem.id, d); toast.success('Updated!'); setEditItem(null); load(); } catch { toast.error('Failed'); } }} onClose={() => setEditItem(null)} />}</Modal>
      <Modal open={showCamForm} onClose={() => setShowCamForm(false)} title="Add Camera" size="lg"><CameraForm onSubmit={async (d: any) => { try { await simAPI.createCamera(d); toast.success('Camera added!'); setShowCamForm(false); load(); } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); } }} onClose={() => setShowCamForm(false)} /></Modal>
      <Modal open={!!editCam} onClose={() => setEditCam(null)} title="Edit Camera" size="lg">{editCam && <CameraForm data={editCam} onSubmit={async (d: any) => { try { await simAPI.update(editCam.id, d); toast.success('Updated!'); setEditCam(null); load(); } catch { toast.error('Failed'); } }} onClose={() => setEditCam(null)} />}</Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { try { await simAPI.delete(deleteId!); toast.success('Deleted'); setDeleteId(null); load(); } catch { toast.error('Failed'); } }} title="Delete SIM" message="Permanently delete this SIM?" danger />
    </div>
  );
}

// ─────────────────────────────────────────
// CREDENTIALS
// ─────────────────────────────────────────
export function CredentialsPage() {
  const { can, isSuperAdmin } = useAuth();
  const [items, setItems] = useState<any[]>([]); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [editItem, setEditItem] = useState<any>(null);
  const [revealId, setRevealId] = useState<string | null>(null); const [revealedPass, setRevealedPass] = useState(''); const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await credentialAPI.list({ search }); setItems(r.data.data); } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleReveal = async (id: string) => {
    try { const r = await credentialAPI.reveal(id); setRevealedPass(r.data.data.password); setRevealId(id); } catch { toast.error('Access denied'); }
  };

  const CredForm = ({ data, onSubmit, onClose }: any) => {
    const [form, setForm] = useState(data || { platform: '', category: '', username: '', email: '', password: '', recoveryEmail: '', notes: '', tags: [] });
    const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
    return (
      <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="field-label">Platform *</label><input className="field-input" value={form.platform} onChange={e => s('platform', e.target.value)} required placeholder="e.g. Google Workspace" /></div>
          <div><label className="field-label">Category</label><select className="field-input" value={form.category || ''} onChange={e => s('category', e.target.value)}><option value="">Select</option>{['Email', 'Social Media', 'ERP', 'Cloud', 'Hosting', 'Dev Tools', 'Other'].map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className="field-label">Username</label><input className="field-input" value={form.username || ''} onChange={e => s('username', e.target.value)} /></div>
          <div><label className="field-label">Email</label><input type="email" className="field-input" value={form.email || ''} onChange={e => s('email', e.target.value)} /></div>
          <div><label className="field-label">Password *</label><input type="password" className="field-input" value={form.password || ''} onChange={e => s('password', e.target.value)} required={!data} placeholder={data ? 'Leave blank to keep' : 'Enter password'} /></div>
          <div><label className="field-label">Recovery Email</label><input type="email" className="field-input" value={form.recoveryEmail || ''} onChange={e => s('recoveryEmail', e.target.value)} /></div>
          <div className="col-span-2"><label className="field-label">Notes</label><textarea className="field-input resize-none min-h-16" value={form.notes || ''} onChange={e => s('notes', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary">{data ? 'Update' : 'Add'} Credential</button></div>
      </form>
    );
  };

  return (
    <div className="space-y-5">
      <div className="page-header"><div><h1 className="page-title">Credential Vault</h1><p className="page-subtitle">{items.length} credentials · AES-256 encrypted</p></div>
        {can('credential.edit') && <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} />Add Credential</button>}
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
        <Shield size={15} className="shrink-0" /> All passwords are encrypted with AES-256. Every password view is logged in the audit trail.
      </div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search credentials..." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => <div key={i} className="card p-4 space-y-3"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-full" /></div>)
          : items.length === 0 ? <div className="col-span-3"><EmptyState icon={Key} title="No credentials found" /></div>
            : items.map(cred => (
              <div key={cred.id} className="card p-4 hover:shadow-md transition group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Key size={16} className="text-primary" /></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {can('credential.edit') && <button className="btn-ghost p-1 rounded" onClick={() => setEditItem(cred)}><Edit size={13} /></button>}
                  </div>
                </div>
                <h3 className="font-semibold text-sm">{cred.platform}</h3>
                {cred.category && <span className="badge badge-info text-xs mt-1">{cred.category}</span>}
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  {cred.email && <div className="flex items-center justify-between"><span>Email: <span className="text-foreground font-mono">{cred.email}</span></span><CopyBtn text={cred.email} /></div>}
                  {cred.username && <div className="flex items-center justify-between"><span>User: <span className="text-foreground font-mono">{cred.username}</span></span><CopyBtn text={cred.username} /></div>}
                </div>
                {can('credential.view') && (
                  <button onClick={() => handleReveal(cred.id)} className="mt-3 w-full btn-secondary text-xs justify-center py-1.5">
                    <Eye size={12} /> View Password
                  </button>
                )}
                {cred.lastAccessed && <p className="text-xs text-muted-foreground mt-2">Last viewed: {fmt.ago(cred.lastAccessed)}</p>}
              </div>
            ))}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Credential" size="lg"><CredForm onSubmit={async (d: any) => { try { await credentialAPI.create(d); toast.success('Credential saved!'); setShowForm(false); load(); } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); } }} onClose={() => setShowForm(false)} /></Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Credential" size="lg">{editItem && <CredForm data={editItem} onSubmit={async (d: any) => { try { await credentialAPI.update(editItem.id, d); toast.success('Updated!'); setEditItem(null); load(); } catch { toast.error('Failed'); } }} onClose={() => setEditItem(null)} />}</Modal>
      <Modal open={!!revealId} onClose={() => { setRevealId(null); setRevealedPass(''); }} title="Credential Password" size="sm">
        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-sm text-destructive flex items-center gap-2"><Shield size={14} />This action has been logged in the audit trail.</div>
          <div><label className="field-label">Password</label>
            <div className="flex gap-2">
              <input className="field-input font-mono" type="text" readOnly value={revealedPass} />
              <CopyBtn text={revealedPass} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────
export function ProjectsPage() {
  const { can } = useAuth();
  const [items, setItems] = useState<any[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [pages, setPages] = useState(1);
  const [search, setSearch] = useState(''); const [statusF, setStatusF] = useState(''); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [viewItem, setViewItem] = useState<any>(null); const [editItem, setEditItem] = useState<any>(null); const [deleteId, setDeleteId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await projectAPI.list({ search, status: statusF, page, limit: 9 }); setItems(r.data.data.data); setTotal(r.data.data.total); setPages(r.data.data.pages); } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, [search, statusF, page]);
  useEffect(() => { load(); userAPI.list().then(r => setUsers(r.data.data?.data || [])); }, [load]);

  const ProjectForm = ({ data, onSubmit, onClose }: any) => {
    const [form, setForm] = useState(data || { name: '', description: '', priority: 'MEDIUM', status: 'PLANNING', startDate: '', deadline: '', progress: 0, notes: '' });
    const [selectedMembers, setSelectedMembers] = useState<string[]>(data?.members?.map((m: any) => m.userId) || []);
    const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
    const toggleM = (uid: string) => setSelectedMembers(p => p.includes(uid) ? p.filter(id => id !== uid) : [...p, uid]);
    return (
      <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, members: selectedMembers }); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="field-label">Project Name *</label><input className="field-input" value={form.name} onChange={e => s('name', e.target.value)} required /></div>
          <div className="col-span-2"><label className="field-label">Description</label><textarea className="field-input resize-none min-h-20" value={form.description || ''} onChange={e => s('description', e.target.value)} /></div>
          <div><label className="field-label">Priority</label><select className="field-input" value={form.priority} onChange={e => s('priority', e.target.value)}>{['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p}>{p}</option>)}</select></div>
          <div><label className="field-label">Status</label><select className="field-input" value={form.status} onChange={e => s('status', e.target.value)}>{['PLANNING', 'IN_PROGRESS', 'TESTING', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELLED'].map(st => <option key={st}>{st.replace('_', ' ')}</option>)}</select></div>
          <div><label className="field-label">Start Date</label><input type="date" className="field-input" value={form.startDate?.slice(0, 10) || ''} onChange={e => s('startDate', e.target.value)} /></div>
          <div><label className="field-label">Deadline</label><input type="date" className="field-input" value={form.deadline?.slice(0, 10) || ''} onChange={e => s('deadline', e.target.value)} /></div>
          <div className="col-span-2"><label className="field-label">Progress ({form.progress}%)</label><input type="range" min={0} max={100} value={form.progress} onChange={e => s('progress', Number(e.target.value))} className="w-full accent-primary" /></div>
          <div className="col-span-2"><label className="field-label">Team Members</label>
            <div className="flex flex-wrap gap-2 p-3 border border-input rounded-xl max-h-28 overflow-y-auto">
              {users.map(u => <button key={u.id} type="button" onClick={() => toggleM(u.id)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition', selectedMembers.includes(u.id) ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80')}><Avatar name={u.name} size="xs" />{u.name}</button>)}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary">{data ? 'Update' : 'Create'} Project</button></div>
      </form>
    );
  };

  return (
    <div className="space-y-5">
      <div className="page-header"><div><h1 className="page-title">Projects</h1><p className="page-subtitle">{total} projects</p></div>
        {can('project.create') && <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} />New Project</button>}
      </div>
      <div className="flex gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." className="flex-1 min-w-52" />
        <select className="field-input w-auto" value={statusF} onChange={e => setStatusF(e.target.value)}><option value="">All Status</option>{['PLANNING', 'IN_PROGRESS', 'TESTING', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELLED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>
      </div>
      {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <div key={i} className="card p-5 space-y-3"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/2" /></div>)}</div>
        : items.length === 0 ? <EmptyState icon={FolderKanban} title="No projects found" action={can('project.create') ? <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} />New Project</button> : undefined} />
          : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{items.map(p => {
            const done = p.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
            const total = p.tasks?.length || 0;
            return (
              <div key={p.id} className="card p-5 hover:shadow-md transition group cursor-pointer" onClick={() => setViewItem(p)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-2 flex-wrap"><StatusBadge status={p.status} /><PriorityBadge priority={p.priority} /></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                    {can('project.edit') && <button className="btn-ghost p-1 rounded" onClick={() => setEditItem(p)}><Edit size={13} /></button>}
                    {can('project.delete') && <button className="btn-ghost p-1 rounded text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 size={13} /></button>}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{p.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{p.description || 'No description'}</p>
                <ProgressBar value={p.progress} showLabel size="sm" />
                <div className="flex items-center justify-between mt-4">
                  <AvatarGroup names={p.members?.map((m: any) => m.user?.name).filter(Boolean) || []} max={4} />
                  <div className="text-xs text-muted-foreground">{done}/{total} tasks{p.deadline && ` · ${fmt.date(p.deadline)}`}</div>
                </div>
              </div>
            );
          })}</div>}
      <Pagination page={page} pages={pages} total={total} limit={9} onChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Project" size="lg"><ProjectForm onSubmit={async (d: any) => { try { await projectAPI.create(d); toast.success('Project created!'); setShowForm(false); load(); } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); } }} onClose={() => setShowForm(false)} /></Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Project" size="lg">{editItem && <ProjectForm data={editItem} onSubmit={async (d: any) => { try { await projectAPI.update(editItem.id, d); toast.success('Updated!'); setEditItem(null); load(); } catch { toast.error('Failed'); } }} onClose={() => setEditItem(null)} />}</Modal>
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Project Details" size="xl">{viewItem && (
        <div className="space-y-5">
          <div className="flex gap-2"><StatusBadge status={viewItem.status} /><PriorityBadge priority={viewItem.priority} /></div>
          <h2 className="text-2xl font-bold">{viewItem.name}</h2>
          <p className="text-muted-foreground">{viewItem.description}</p>
          <ProgressBar value={viewItem.progress} showLabel />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[['Start', fmt.date(viewItem.startDate)], ['Deadline', fmt.date(viewItem.deadline)], ['Tasks', viewItem.tasks?.length || 0], ['Members', viewItem.members?.length || 0]].map(([k, v]) => (
              <div key={k as string} className="bg-muted/40 rounded-xl p-3"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{k}</div><div className="font-semibold">{v as string}</div></div>
            ))}
          </div>
          {viewItem.members?.length > 0 && <div><h4 className="font-semibold text-sm mb-3">Team Members</h4><div className="flex flex-wrap gap-2">{viewItem.members.map((m: any) => (<div key={m.id} className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2"><Avatar name={m.user?.name} size="xs" /><span className="text-sm">{m.user?.name}</span><span className="badge badge-default text-xs">{m.role}</span></div>))}</div></div>}
          {viewItem.milestones?.length > 0 && <div><h4 className="font-semibold text-sm mb-3">Milestones</h4><div className="space-y-2">{viewItem.milestones.map((ms: any) => (<div key={ms.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg"><div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0', ms.completed ? 'border-emerald-500 bg-emerald-500' : 'border-border')}>{ms.completed && <Check size={10} className="text-white" />}</div><span className={cn('text-sm', ms.completed && 'line-through text-muted-foreground')}>{ms.title}</span>{ms.dueDate && <span className="text-xs text-muted-foreground ml-auto">{fmt.date(ms.dueDate)}</span>}</div>))}</div></div>}
          {viewItem.discussions?.length > 0 && <div><h4 className="font-semibold text-sm mb-3">Recent Discussions</h4><div className="space-y-3">{viewItem.discussions.slice(0, 3).map((d: any) => (<div key={d.id} className="flex gap-3 p-3 bg-muted/30 rounded-xl"><Avatar name={d.user?.name} size="sm" /><div><div className="text-xs font-semibold">{d.user?.name} <span className="font-normal text-muted-foreground">{fmt.ago(d.createdAt)}</span></div><p className="text-sm mt-1">{d.content}</p></div></div>))}</div></div>}
        </div>
      )}</Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { try { await projectAPI.delete(deleteId!); toast.success('Deleted'); setDeleteId(null); load(); } catch { toast.error('Failed'); } }} title="Delete Project" message="This will delete the project and all its data." danger />
    </div>
  );
}

// ─────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────
const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'HOLD'];
const STATUS_LABELS: Record<string, string> = { PENDING: 'Pending', IN_PROGRESS: 'In Progress', REVIEW: 'Review', COMPLETED: 'Completed', HOLD: 'Hold' };
const COL_COLORS: Record<string, string> = { PENDING: 'bg-slate-100 dark:bg-slate-800/40', IN_PROGRESS: 'bg-blue-50 dark:bg-blue-950/30', REVIEW: 'bg-purple-50 dark:bg-purple-950/30', COMPLETED: 'bg-emerald-50 dark:bg-emerald-950/30', HOLD: 'bg-amber-50 dark:bg-amber-950/30' };
const COL_BORDER: Record<string, string> = { PENDING: 'border-slate-300', IN_PROGRESS: 'border-blue-400', REVIEW: 'border-purple-400', COMPLETED: 'border-emerald-400', HOLD: 'border-amber-400' };

export function TasksPage() {
  const { can } = useAuth();
  const [kanban, setKanban] = useState<any>({}); const [view, setView] = useState<'kanban' | 'list'>('kanban'); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(''); const [showForm, setShowForm] = useState(false); const [editItem, setEditItem] = useState<any>(null); const [viewItem, setViewItem] = useState<any>(null); const [deleteId, setDeleteId] = useState<string | null>(null);
  const [comment, setComment] = useState(''); const [users, setUsers] = useState<any[]>([]); const [projects, setProjects] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await taskAPI.kanban(); setKanban(r.data.data); } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); userAPI.list().then(r => setUsers(r.data.data?.data || [])); projectAPI.list({ limit: 100 }).then(r => setProjects(r.data.data?.data || [])); }, [load]);

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId');
    const old = e.dataTransfer.getData('taskStatus');
    if (old === newStatus) return;
    try { await taskAPI.updateStatus(id, newStatus); load(); } catch { toast.error('Failed'); }
  };

  const addComment = async () => {
    if (!comment.trim() || !viewItem) return;
    try { const r = await taskAPI.addComment(viewItem.id, comment); setViewItem((v: any) => ({ ...v, comments: [...(v.comments || []), r.data.data] })); setComment(''); } catch { toast.error('Failed'); }
  };

  const TaskForm = ({ data, onSubmit, onClose }: any) => {
    const [form, setForm] = useState(data || { title: '', description: '', priority: 'MEDIUM', status: 'PENDING', deadline: '', projectId: '', assigneeId: '' });
    const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
    return (
      <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div><label className="field-label">Title *</label><input className="field-input" value={form.title} onChange={e => s('title', e.target.value)} required /></div>
        <div><label className="field-label">Description</label><textarea className="field-input resize-none min-h-20" value={form.description || ''} onChange={e => s('description', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="field-label">Project</label><select className="field-input" value={form.projectId || ''} onChange={e => s('projectId', e.target.value)}><option value="">No Project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="field-label">Assign To</label><select className="field-input" value={form.assigneeId || ''} onChange={e => s('assigneeId', e.target.value)}><option value="">Unassigned</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
          <div><label className="field-label">Priority</label><select className="field-input" value={form.priority} onChange={e => s('priority', e.target.value)}>{['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p}>{p}</option>)}</select></div>
          <div><label className="field-label">Status</label><select className="field-input" value={form.status} onChange={e => s('status', e.target.value)}>{TASK_STATUSES.map(st => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}</select></div>
          <div className="col-span-2"><label className="field-label">Deadline</label><input type="date" className="field-input" value={form.deadline?.slice(0, 10) || ''} onChange={e => s('deadline', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary">{data ? 'Update' : 'Create'} Task</button></div>
      </form>
    );
  };

  const allTasks = Object.values(kanban).flat() as any[];
  const totalTasks = allTasks.length;

  return (
    <div className="space-y-5">
      <div className="page-header"><div><h1 className="page-title">Tasks</h1><p className="page-subtitle">{totalTasks} total tasks</p></div>
        <div className="flex gap-2">
          <div className="flex bg-muted rounded-xl p-1">{['kanban', 'list'].map(v => <button key={v} onClick={() => setView(v as any)} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition', view === v ? 'bg-background shadow text-foreground' : 'text-muted-foreground')}>{v}</button>)}</div>
          {can('task.create') && <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} />New Task</button>}
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {TASK_STATUSES.map(status => (
            <div key={status} className={cn('kanban-col', COL_COLORS[status])} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, status)}>
              <div className={cn('flex items-center justify-between mb-3 pb-2 border-b-2', COL_BORDER[status])}>
                <span className="font-semibold text-xs text-foreground">{STATUS_LABELS[status]}</span>
                <span className="text-xs font-bold bg-background text-muted-foreground w-5 h-5 rounded-full flex items-center justify-center shadow-sm">{kanban[status]?.length || 0}</span>
              </div>
              <div className="space-y-2.5 min-h-20">
                {loading ? Array(2).fill(0).map((_, i) => <div key={i} className="card p-3 space-y-2"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-full" /></div>)
                  : kanban[status]?.map((task: any) => (
                    <div key={task.id} draggable onDragStart={e => { e.dataTransfer.setData('taskId', task.id); e.dataTransfer.setData('taskStatus', task.status); }}
                      className="kanban-card group">
                      <div className="flex items-start justify-between mb-2">
                        <PriorityBadge priority={task.priority} />
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                          <button className="btn-ghost p-1 rounded" onClick={() => setViewItem(task)}><Eye size={12} /></button>
                          {can('task.edit') && <button className="btn-ghost p-1 rounded" onClick={() => setEditItem(task)}><Edit size={12} /></button>}
                          {can('task.delete') && <button className="btn-ghost p-1 rounded text-destructive" onClick={() => setDeleteId(task.id)}><Trash2 size={12} /></button>}
                        </div>
                      </div>
                      <p className="font-medium text-sm leading-snug">{task.title}</p>
                      {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{task.description}</p>}
                      {task.project && <div className="mt-2 text-xs text-primary bg-primary/10 rounded-md px-2 py-0.5 inline-block">{task.project.name}</div>}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                        {task.assignee ? <Avatar name={task.assignee.name} size="xs" /> : <div className="w-6 h-6 rounded-full bg-muted" />}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {task.comments?.length > 0 && <span className="flex items-center gap-0.5 text-xs"><MessageSquare size={10} />{task.comments.length}</span>}
                          {task.attachments?.length > 0 && <span className="flex items-center gap-0.5 text-xs"><Paperclip size={10} />{task.attachments.length}</span>}
                          {task.deadline && <span className={cn('text-xs flex items-center gap-0.5', isOverdue(task.deadline) && task.status !== 'COMPLETED' ? 'text-destructive' : isExpiringSoon(task.deadline, 7) ? 'text-amber-500' : '')}><Calendar size={10} />{fmt.date(task.deadline)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                {!loading && !kanban[status]?.length && <div className="text-center py-6 text-xs text-muted-foreground">Drop tasks here</div>}
              </div>
              {can('task.create') && <button onClick={() => setShowForm(true)} className="w-full mt-2 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-background/60 transition flex items-center justify-center gap-1"><Plus size={11} />Add task</button>}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tasks..." />
          <div className="card overflow-hidden"><table className="data-table"><thead><tr><th>Task</th><th>Project</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Deadline</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {allTasks.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase())).map(task => (
                <tr key={task.id}>
                  <td><div className="font-medium text-sm">{task.title}</div>{task.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</div>}</td>
                  <td className="text-sm">{task.project?.name || '—'}</td>
                  <td>{task.assignee ? <div className="flex items-center gap-2"><Avatar name={task.assignee.name} size="xs" /><span className="text-sm">{task.assignee.name}</span></div> : '—'}</td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td><StatusBadge status={task.status} /></td>
                  <td><span className={cn('text-sm', isOverdue(task.deadline) && task.status !== 'COMPLETED' ? 'text-destructive font-medium' : '')}>{fmt.date(task.deadline)}</span></td>
                  <td><div className="flex items-center justify-end gap-1">
                    <button className="btn-ghost p-1.5 rounded-lg" onClick={() => setViewItem(task)}><Eye size={14} /></button>
                    {can('task.edit') && <button className="btn-ghost p-1.5 rounded-lg" onClick={() => setEditItem(task)}><Edit size={14} /></button>}
                    {can('task.delete') && <button className="btn-ghost p-1.5 rounded-lg text-destructive" onClick={() => setDeleteId(task.id)}><Trash2 size={14} /></button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Task" size="lg"><TaskForm onSubmit={async (d: any) => { try { await taskAPI.create(d); toast.success('Task created!'); setShowForm(false); load(); } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); } }} onClose={() => setShowForm(false)} /></Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Task" size="lg">{editItem && <TaskForm data={editItem} onSubmit={async (d: any) => { try { await taskAPI.update(editItem.id, d); toast.success('Updated!'); setEditItem(null); load(); } catch { toast.error('Failed'); } }} onClose={() => setEditItem(null)} />}</Modal>
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Task Detail" size="lg">{viewItem && (
        <div className="space-y-4">
          <div className="flex gap-2"><PriorityBadge priority={viewItem.priority} /><StatusBadge status={viewItem.status} /></div>
          <h2 className="text-xl font-bold">{viewItem.title}</h2>
          {viewItem.description && <p className="text-muted-foreground text-sm">{viewItem.description}</p>}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[['Assignee', viewItem.assignee?.name || 'Unassigned'], ['Project', viewItem.project?.name || 'None'], ['Deadline', fmt.date(viewItem.deadline)], ['Created', fmt.ago(viewItem.createdAt)]].map(([k, v]) => (
              <div key={k as string} className="bg-muted/40 rounded-xl p-3"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{k}</div><div>{v as string}</div></div>
            ))}
          </div>
          <div><h4 className="font-semibold text-sm flex items-center gap-2 mb-3"><MessageSquare size={14} />Comments ({viewItem.comments?.length || 0})</h4>
            <div className="space-y-2.5 max-h-48 overflow-y-auto mb-3">
              {viewItem.comments?.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No comments yet</p>}
              {viewItem.comments?.map((c: any) => (<div key={c.id} className="flex gap-3 p-3 bg-muted/40 rounded-xl"><Avatar name={c.user?.name} size="xs" /><div><div className="text-xs font-semibold">{c.user?.name} <span className="font-normal text-muted-foreground">{fmt.ago(c.createdAt)}</span></div><p className="text-sm mt-0.5">{c.content}</p></div></div>))}
            </div>
            <div className="flex gap-2"><input className="field-input flex-1" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} /><button className="btn-primary" onClick={addComment}>Post</button></div>
          </div>
        </div>
      )}</Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { try { await taskAPI.delete(deleteId!); toast.success('Deleted'); setDeleteId(null); load(); } catch { toast.error('Failed'); } }} title="Delete Task" message="Permanently delete this task?" danger />
    </div>
  );
}

// ─────────────────────────────────────────
// TODOS
// ─────────────────────────────────────────
export function TodosPage() {
  const [todos, setTodos] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [statusF, setStatusF] = useState('PENDING');
  const [showForm, setShowForm] = useState(false); const [editItem, setEditItem] = useState<any>(null); const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await todoAPI.list({ status: statusF }); setTodos(r.data.data); } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, [statusF]);
  useEffect(() => { load(); }, [load]);

  const TodoForm = ({ data, onSubmit, onClose }: any) => {
    const [form, setForm] = useState(data || { title: '', description: '', type: 'ONE_TIME', priority: 'MEDIUM', dueDate: '', schedule: '' });
    const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
    return (
      <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div><label className="field-label">Title *</label><input className="field-input" value={form.title} onChange={e => s('title', e.target.value)} required /></div>
        <div><label className="field-label">Description</label><textarea className="field-input resize-none min-h-16" value={form.description || ''} onChange={e => s('description', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="field-label">Type</label><select className="field-input" value={form.type} onChange={e => s('type', e.target.value)}><option value="ONE_TIME">One-Time</option><option value="RECURRING">Recurring</option></select></div>
          <div><label className="field-label">Priority</label><select className="field-input" value={form.priority} onChange={e => s('priority', e.target.value)}>{['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p}>{p}</option>)}</select></div>
          {form.type === 'RECURRING' && <div><label className="field-label">Schedule</label><select className="field-input" value={form.schedule || ''} onChange={e => s('schedule', e.target.value)}><option value="">Select</option>{['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].map(s => <option key={s}>{s}</option>)}</select></div>}
          <div><label className="field-label">Due Date</label><input type="date" className="field-input" value={form.dueDate?.slice(0, 10) || ''} onChange={e => s('dueDate', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary">{data ? 'Update' : 'Add'} Todo</button></div>
      </form>
    );
  };

  const pending = todos.filter(t => t.status === 'PENDING').length;
  const overdue = todos.filter(t => isOverdue(t.dueDate) && t.status !== 'COMPLETED').length;

  return (
    <div className="space-y-5">
      <div className="page-header"><div><h1 className="page-title">Daily Operations</h1><p className="page-subtitle">{todos.length} items · {pending} pending · {overdue} overdue</p></div>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} />Add Todo</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[['', 'All'], ['PENDING', 'Pending'], ['IN_PROGRESS', 'In Progress'], ['COMPLETED', 'Completed']].map(([v, l]) => (
          <button key={v} onClick={() => setStatusF(v)} className={cn('btn text-sm', statusF === v ? 'btn-primary' : 'btn-secondary')}>{l}</button>
        ))}
      </div>
      <div className="space-y-2">
        {loading ? Array(5).fill(0).map((_, i) => <div key={i} className="card p-4"><Skeleton className="h-5 w-2/3" /></div>)
          : todos.length === 0 ? <EmptyState icon={ClipboardList} title="No todos found" />
            : todos.map(todo => (
              <div key={todo.id} className={cn('card p-4 flex items-start gap-4 hover:shadow-sm transition group', todo.status === 'COMPLETED' && 'opacity-60')}>
                <button onClick={async () => { if (todo.status !== 'COMPLETED') { try { await todoAPI.complete(todo.id); toast.success('Done!'); load(); } catch { toast.error('Failed'); } } }}
                  className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition', todo.status === 'COMPLETED' ? 'border-emerald-500 bg-emerald-500' : 'border-border hover:border-primary')}>
                  {todo.status === 'COMPLETED' && <Check size={11} className="text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('font-medium text-sm', todo.status === 'COMPLETED' && 'line-through')}>{todo.title}</span>
                    <PriorityBadge priority={todo.priority} />
                    {todo.type === 'RECURRING' && <span className="badge badge-purple text-xs"><RefreshCw size={9} />{todo.schedule}</span>}
                    {todo.dueDate && isOverdue(todo.dueDate) && todo.status !== 'COMPLETED' && <span className="badge badge-danger text-xs">Overdue</span>}
                  </div>
                  {todo.description && <p className="text-xs text-muted-foreground mt-1">{todo.description}</p>}
                  {todo.dueDate && <p className="text-xs text-muted-foreground mt-1">{fmt.date(todo.dueDate)}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button className="btn-ghost p-1.5 rounded-lg" onClick={() => setEditItem(todo)}><Edit size={13} /></button>
                  <button className="btn-ghost p-1.5 rounded-lg text-destructive" onClick={() => setDeleteId(todo.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Todo" size="md"><TodoForm onSubmit={async (d: any) => { try { await todoAPI.create(d); toast.success('Todo added!'); setShowForm(false); load(); } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); } }} onClose={() => setShowForm(false)} /></Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Todo" size="md">{editItem && <TodoForm data={editItem} onSubmit={async (d: any) => { try { await todoAPI.update(editItem.id, d); toast.success('Updated!'); setEditItem(null); load(); } catch { toast.error('Failed'); } }} onClose={() => setEditItem(null)} />}</Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { try { await todoAPI.delete(deleteId!); toast.success('Deleted'); setDeleteId(null); load(); } catch { toast.error('Failed'); } }} title="Delete Todo" message="Delete this todo?" danger />
    </div>
  );
}

// ─────────────────────────────────────────
// FILES
// ─────────────────────────────────────────
const FOLDERS = ['General', 'HR Documents', 'Contracts', 'Projects', 'Assets', 'Reports', 'SOPs', 'Other'];
const getIcon = (type: string) => { if (!type) return File; if (type.includes('image')) return Image; if (type.includes('pdf') || type.includes('word')) return FileText; if (type.includes('zip') || type.includes('archive')) return Archive; return File; };
const getIconColor = (type: string) => { if (!type) return 'text-muted-foreground'; if (type.includes('image')) return 'text-emerald-500'; if (type.includes('pdf')) return 'text-red-500'; if (type.includes('word')) return 'text-blue-500'; if (type.includes('sheet') || type.includes('excel')) return 'text-green-500'; if (type.includes('zip')) return 'text-amber-500'; return 'text-muted-foreground'; };

export function FilesPage() {
  const { can } = useAuth();
  const [files, setFiles] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [folder, setFolder] = useState(''); const [search, setSearch] = useState(''); const [uploading, setUploading] = useState(false); const [deleteId, setDeleteId] = useState<string | null>(null); const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fileAPI.list({ folder, search }); setFiles(r.data.data); } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, [folder, search]);
  useEffect(() => { load(); }, [load]);

  const handleUpload = async (f: File) => {
    setUploading(true);
    try { const fd = new FormData(); fd.append('file', f); fd.append('folder', folder || 'General'); await fileAPI.upload(fd); toast.success('Uploaded!'); load(); } catch { toast.error('Upload failed'); } finally { setUploading(false); }
  };

  const counts: Record<string, number> = FOLDERS.reduce((a, f) => ({ ...a, [f]: files.filter(fi => fi.folder === f).length }), {});

  return (
    <div className="space-y-5">
      <div className="page-header"><div><h1 className="page-title">File Manager</h1><p className="page-subtitle">{files.length} files</p></div>
        {can('file.upload') && <><input type="file" ref={fileRef} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} /><button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}><Upload size={15} />{uploading ? 'Uploading...' : 'Upload File'}</button></>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="card p-2 h-fit space-y-0.5">
          <button onClick={() => setFolder('')} className={cn('w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition', !folder ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50')}><div className="flex items-center gap-2"><FolderOpen size={15} />All Files</div><span className="badge badge-default text-xs">{files.length}</span></button>
          {FOLDERS.map(f => <button key={f} onClick={() => setFolder(f)} className={cn('w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition', folder === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50')}><div className="flex items-center gap-2"><FolderOpen size={14} />{f}</div><span className="badge badge-default text-xs">{counts[f] || 0}</span></button>)}
        </div>
        <div className="lg:col-span-3 space-y-4">
          <div className="flex gap-3 items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Search files..." className="flex-1" />
            <div className="flex bg-muted rounded-xl p-1">{['grid', 'list'].map(v => <button key={v} onClick={() => setViewMode(v as any)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition', viewMode === v ? 'bg-background shadow text-foreground' : 'text-muted-foreground')}>{v}</button>)}</div>
          </div>
          {can('file.upload') && <FileUploadArea onFile={handleUpload} />}
          {loading ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{Array(6).fill(0).map((_, i) => <div key={i} className="card p-4 space-y-2"><Skeleton className="h-12 w-12 rounded-xl" /><Skeleton className="h-3 w-full" /></div>)}</div>
            : files.length === 0 ? <EmptyState icon={Files} title="No files found" />
              : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {files.map(file => { const Icon = getIcon(file.type); return (
                    <div key={file.id} className="card p-4 hover:shadow-md transition group">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-muted', getIconColor(file.type))}><Icon size={22} /></div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <a href={file.url} download className="btn-ghost p-1 rounded"><Download size={13} /></a>
                          {can('file.delete') && <button className="btn-ghost p-1 rounded text-destructive" onClick={() => setDeleteId(file.id)}><Trash2 size={13} /></button>}
                        </div>
                      </div>
                      <p className="text-xs font-medium truncate" title={file.name}>{file.name}</p>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground"><span>{fmt.fileSize(file.size)}</span><span>{fmt.date(file.createdAt)}</span></div>
                      {file.folder && <span className="mt-1.5 inline-block badge badge-info text-xs">{file.folder}</span>}
                    </div>
                  ); })}
                </div>
              ) : (
                <div className="card overflow-hidden"><table className="data-table"><thead><tr><th>Name</th><th>Folder</th><th>Size</th><th>Uploaded</th><th className="text-right">Actions</th></tr></thead>
                  <tbody>{files.map(file => { const Icon = getIcon(file.type); return (
                    <tr key={file.id}>
                      <td><div className="flex items-center gap-2"><Icon size={16} className={getIconColor(file.type)} /><span className="text-sm font-medium">{file.name}</span></div></td>
                      <td className="text-sm">{file.folder || '—'}</td>
                      <td className="text-sm">{fmt.fileSize(file.size)}</td>
                      <td className="text-sm">{fmt.date(file.createdAt)}</td>
                      <td><div className="flex justify-end gap-1"><a href={file.url} download className="btn-ghost p-1.5 rounded-lg"><Download size={13} /></a>{can('file.delete') && <button className="btn-ghost p-1.5 rounded-lg text-destructive" onClick={() => setDeleteId(file.id)}><Trash2 size={13} /></button>}</div></td>
                    </tr>
                  ); })}</tbody>
                </table></div>
              )}
        </div>
      </div>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { try { await fileAPI.delete(deleteId!); toast.success('Deleted'); setDeleteId(null); load(); } catch { toast.error('Failed'); } }} title="Delete File" message="Permanently delete this file?" danger />
    </div>
  );
}

// ─────────────────────────────────────────
// TICKETS
// ─────────────────────────────────────────
export function TicketsPage() {
  const { can, user } = useAuth();
  const [items, setItems] = useState<any[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [pages, setPages] = useState(1);
  const [statusF, setStatusF] = useState(''); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [viewItem, setViewItem] = useState<any>(null); const [comment, setComment] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await ticketAPI.list({ status: statusF, page, limit: 10 }); setItems(r.data.data.data); setTotal(r.data.data.total); setPages(r.data.data.pages); } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, [statusF, page]);
  useEffect(() => { load(); userAPI.list().then(r => setUsers(r.data.data?.data || [])); }, [load]);

  const addComment = async () => {
    if (!comment.trim() || !viewItem) return;
    try { const r = await ticketAPI.addComment(viewItem.id, comment); setViewItem((v: any) => ({ ...v, comments: [...(v.comments || []), r.data.data] })); setComment(''); } catch { toast.error('Failed'); }
  };

  const TicketForm = ({ onSubmit, onClose }: any) => {
    const [form, setForm] = useState({ title: '', description: '', category: 'OTHER', priority: 'MEDIUM' });
    const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
    return (
      <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div><label className="field-label">Title *</label><input className="field-input" value={form.title} onChange={e => s('title', e.target.value)} required /></div>
        <div><label className="field-label">Description</label><textarea className="field-input resize-none min-h-24" value={form.description || ''} onChange={e => s('description', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="field-label">Category</label><select className="field-input" value={form.category} onChange={e => s('category', e.target.value)}>{['HARDWARE', 'SOFTWARE', 'EMAIL', 'NETWORK', 'ERP', 'SIM', 'ACCESS', 'OTHER'].map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className="field-label">Priority</label><select className="field-input" value={form.priority} onChange={e => s('priority', e.target.value)}>{['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p}>{p}</option>)}</select></div>
        </div>
        <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary">Submit Ticket</button></div>
      </form>
    );
  };

  return (
    <div className="space-y-5">
      <div className="page-header"><div><h1 className="page-title">Support Tickets</h1><p className="page-subtitle">{total} tickets</p></div>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={15} />New Ticket</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[['', 'All'], ['OPEN', 'Open'], ['IN_PROGRESS', 'In Progress'], ['RESOLVED', 'Resolved'], ['CLOSED', 'Closed']].map(([v, l]) => (
          <button key={v} onClick={() => setStatusF(v)} className={cn('btn text-sm', statusF === v ? 'btn-primary' : 'btn-secondary')}>{l}</button>
        ))}
      </div>
      <div className="card overflow-hidden"><table className="data-table"><thead><tr><th>Ticket</th><th>Category</th><th>Created By</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Date</th><th className="text-right">Actions</th></tr></thead>
        <tbody>
          {loading ? <TableSkeleton cols={8} /> : items.length === 0 ? <tr><td colSpan={8}><EmptyState icon={Ticket} title="No tickets found" /></td></tr>
            : items.map(t => (
              <tr key={t.id}>
                <td><div className="font-medium text-sm">{t.title}</div></td>
                <td><span className="badge badge-info text-xs">{t.category}</span></td>
                <td className="text-sm">{t.creator?.name || '—'}</td>
                <td className="text-sm">{t.assignee?.name || <span className="text-muted-foreground">Unassigned</span>}</td>
                <td><PriorityBadge priority={t.priority} /></td>
                <td><StatusBadge status={t.status} /></td>
                <td className="text-sm">{fmt.date(t.createdAt)}</td>
                <td><div className="flex justify-end gap-1">
                  <button className="btn-ghost p-1.5 rounded-lg" onClick={() => setViewItem(t)}><Eye size={14} /></button>
                  {isAdmin() && <select className="field-input text-xs py-1 w-auto" defaultValue={t.status} onChange={async e => { try { await ticketAPI.update(t.id, { status: e.target.value }); toast.success('Updated'); load(); } catch { toast.error('Failed'); } }}>{['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>}
                </div></td>
              </tr>
            ))}
        </tbody>
      </table></div>
      <Pagination page={page} pages={pages} total={total} limit={10} onChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Submit Ticket" size="md"><TicketForm onSubmit={async (d: any) => { try { await ticketAPI.create(d); toast.success('Ticket submitted!'); setShowForm(false); load(); } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); } }} onClose={() => setShowForm(false)} /></Modal>
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Ticket Details" size="lg">{viewItem && (
        <div className="space-y-4">
          <div className="flex gap-2"><PriorityBadge priority={viewItem.priority} /><StatusBadge status={viewItem.status} /><span className="badge badge-info">{viewItem.category}</span></div>
          <h2 className="text-xl font-bold">{viewItem.title}</h2>
          {viewItem.description && <p className="text-muted-foreground text-sm">{viewItem.description}</p>}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[['Created By', viewItem.creator?.name], ['Assignee', viewItem.assignee?.name || 'Unassigned'], ['Created', fmt.date(viewItem.createdAt)]].map(([k, v]) => (
              <div key={k as string} className="bg-muted/40 rounded-xl p-3"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{k}</div><div>{v as string || '—'}</div></div>
            ))}
          </div>
          <div><h4 className="font-semibold text-sm flex items-center gap-2 mb-3"><MessageSquare size={14} />Comments</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
              {viewItem.comments?.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No comments</p>}
              {viewItem.comments?.map((c: any) => (<div key={c.id} className="flex gap-3 p-3 bg-muted/40 rounded-xl"><Avatar name={c.user?.name} size="xs" /><div><div className="text-xs font-semibold">{c.user?.name}</div><p className="text-sm mt-0.5">{c.content}</p></div></div>))}
            </div>
            <div className="flex gap-2"><input className="field-input flex-1" placeholder="Add comment..." value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} /><button className="btn-primary" onClick={addComment}>Post</button></div>
          </div>
        </div>
      )}</Modal>
    </div>
  );

  function isAdmin() { return ['Super Admin', 'Admin'].includes(user?.role || ''); }
}

// ─────────────────────────────────────────
// ACTIVITY LOG
// ─────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = { CREATE: 'badge-success', UPDATE: 'badge-info', DELETE: 'badge-danger', LOGIN: 'badge-purple', LOGOUT: 'badge-default', ASSIGN: 'badge-warning', UPLOAD: 'badge-info', CREDENTIAL_VIEW: 'badge-danger', PERMISSION_CHANGE: 'badge-warning', VIEW: 'badge-default', EXPORT: 'badge-info' };

export function ActivityLogPage() {
  const { can } = useAuth();
  const [logs, setLogs] = useState<any[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [pages, setPages] = useState(1);
  const [moduleF, setModuleF] = useState(''); const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await auditAPI.list({ module: moduleF, page, limit: 20 }); setLogs(r.data.data.data); setTotal(r.data.data.total); setPages(r.data.data.pages); } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, [moduleF, page]);
  useEffect(() => { load(); }, [load]);

  if (!can('audit.view')) return <div className="flex items-center justify-center py-20"><EmptyState icon={Shield} title="Access Denied" description="You don't have permission to view audit logs." /></div>;

  return (
    <div className="space-y-5">
      <div className="page-header"><div><h1 className="page-title">Audit Log</h1><p className="page-subtitle">{total} events tracked · Immutable record</p></div></div>
      <div className="flex gap-2 flex-wrap">
        {[['', 'All'], ['AUTH', 'Auth'], ['EMPLOYEE', 'Employee'], ['ASSET', 'Asset'], ['PROJECT', 'Project'], ['TASK', 'Task'], ['CREDENTIAL', 'Credential'], ['FILE', 'File']].map(([v, l]) => (
          <button key={v} onClick={() => setModuleF(v)} className={cn('btn text-xs', moduleF === v ? 'btn-primary' : 'btn-secondary')}>{l}</button>
        ))}
      </div>
      <div className="card divide-y divide-border">
        {loading ? Array(8).fill(0).map((_, i) => <div key={i} className="flex items-center gap-4 p-4"><Skeleton className="w-8 h-8 rounded-full shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div></div>)
          : logs.length === 0 ? <div className="py-12 text-center text-muted-foreground text-sm">No logs found</div>
            : logs.map((log, i) => (
              <div key={i} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition">
                <Avatar name={log.user?.name || 'System'} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{log.user?.name || 'System'}</span>
                    <span className={cn('badge text-xs', ACTION_COLORS[log.action] || 'badge-default')}>{log.action}</span>
                    <span className="badge badge-default text-xs">{log.module}</span>
                  </div>
                  {log.details && <p className="text-sm text-muted-foreground mt-0.5">{log.details}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{fmt.dateTime(log.createdAt)}</span><span>·</span><span>{fmt.ago(log.createdAt)}</span>
                    {log.ipAddress && <><span>·</span><span className="font-mono">{log.ipAddress}</span></>}
                  </div>
                </div>
              </div>
            ))}
      </div>
      <Pagination page={page} pages={pages} total={total} limit={20} onChange={setPage} />
    </div>
  );
}

// ─────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────
export function SettingsPage() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const [tab, setTab] = useState<'profile' | 'security' | 'appearance'>('profile');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      const { authAPI } = await import('../shared/lib/api');
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); } finally { setSaving(false); }
  };

  const TABS = [{ id: 'profile', label: 'Profile', icon: User }, { id: 'security', label: 'Security', icon: Lock }, { id: 'appearance', label: 'Appearance', icon: Palette }];

  return (
    <div className="space-y-5">
      <div><h1 className="page-title">Settings</h1><p className="page-subtitle">Manage account preferences</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="card p-2 h-fit space-y-0.5">
          {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id as any)} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition', tab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50')}><t.icon size={15} />{t.label}</button>)}
        </div>
        <div className="lg:col-span-3">
          {tab === 'profile' && (
            <div className="card p-6 space-y-5">
              <h2 className="font-semibold text-lg">Profile Information</h2>
              <div className="flex items-center gap-5 pb-5 border-b border-border">
                <Avatar name={user?.name} src={user?.avatar} size="xl" />
                <div><h3 className="text-xl font-bold">{user?.name}</h3><p className="text-muted-foreground text-sm">{user?.email}</p><div className="mt-2"><RoleBadge role={user?.role} /></div></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['Full Name', user?.name], ['Email', user?.email], ['Role', user?.role || 'No Role'], ['Company ID', user?.companyId?.slice(0, 8) + '...']].map(([k, v]) => (
                  <div key={k as string} className="bg-muted/40 rounded-xl p-3"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{k}</div><div className="font-medium">{v as string || '—'}</div></div>
                ))}
              </div>
            </div>
          )}
          {tab === 'security' && (
            <div className="card p-6 space-y-5">
              <h2 className="font-semibold text-lg">Change Password</h2>
              <form onSubmit={handlePwChange} className="space-y-4 max-w-md">
                <div><label className="field-label">Current Password</label><input type="password" className="field-input" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required /></div>
                <div><label className="field-label">New Password</label><input type="password" className="field-input" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required minLength={8} /></div>
                <div><label className="field-label">Confirm Password</label><input type="password" className="field-input" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} required /></div>
                <button type="submit" className="btn-primary" disabled={saving}><Save size={15} />{saving ? 'Saving...' : 'Update Password'}</button>
              </form>
            </div>
          )}
          {tab === 'appearance' && (
            <div className="card p-6 space-y-5">
              <h2 className="font-semibold text-lg">Appearance</h2>
              <div className="grid grid-cols-2 gap-3">
                {[{ label: 'Light Mode', val: false, desc: 'Clean bright interface' }, { label: 'Dark Mode', val: true, desc: 'Easy on eyes in low light' }].map(({ label, val, desc }) => (
                  <button key={label} onClick={() => val !== dark && toggle()}
                    className={cn('p-4 rounded-2xl border-2 text-left transition', dark === val ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}>
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                    {dark === val && <div className="text-xs font-semibold text-primary mt-2">✓ Active</div>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
