import React, { useEffect, useState } from 'react';
import { Users, Monitor, CheckSquare, FolderKanban, Smartphone, Ticket, AlertTriangle, Clock, Activity, TrendingUp, ClipboardList, Wifi } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardAPI } from '../../shared/lib/api';
import { StatCard, CardSkeleton, Avatar, PriorityBadge, StatusBadge } from '../../shared/components/ui';
import { fmt } from '../../shared/lib/helpers';
import { cn } from '../../shared/lib/utils';
import { useAuth } from '../../shared/store/auth.store';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill || p.stroke }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardAPI.stats(), dashboardAPI.charts()])
      .then(([s, c]) => { setStats(s.data.data); setCharts(c.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  const taskPie = charts?.tasksByStatus?.map((t: any) => ({ name: t.status.replace('_', ' '), value: t._count.id })) || [];
  const projectPie = charts?.projectsByStatus?.map((p: any) => ({ name: p.status, value: p._count.id })) || [];
  const assetBar = charts?.assetsByCategory?.map((a: any) => ({ name: a.category.replace('_', ' '), value: a._count.id })) || [];
  const priorityBar = charts?.tasksByPriority?.map((p: any) => ({ name: p.priority, value: p._count.id })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">{fmt.dateTime(new Date())} — Here's your operations overview</p>
      </div>

      {/* Alerts */}
      {(stats?.simsExpiringSoon > 0 || stats?.criticalTasks > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats?.simsExpiringSoon > 0 && (
            <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
              <Wifi size={15} /> <span><strong>{stats.simsExpiringSoon} SIM(s)</strong> expiring within 30 days</span>
            </div>
          )}
          {stats?.criticalTasks > 0 && (
            <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle size={15} /> <span><strong>{stats.criticalTasks} CRITICAL</strong> tasks pending</span>
            </div>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Employees" value={stats?.employees || 0} icon={Users} color="primary" />
        <StatCard title="Active Projects" value={stats?.activeProjects || 0} icon={FolderKanban} color="blue" />
        <StatCard title="Pending Tasks" value={stats?.pendingTasks || 0} icon={CheckSquare} color="amber" />
        <StatCard title="Completed Tasks" value={stats?.completedTasks || 0} icon={TrendingUp} color="green" />
        <StatCard title="Assigned Assets" value={stats?.assignedAssets || 0} icon={Monitor} color="purple" />
        <StatCard title="Available Assets" value={stats?.availableAssets || 0} icon={Monitor} color="cyan" />
        <StatCard title="Open Tickets" value={stats?.openTickets || 0} icon={Ticket} color="red" />
        <StatCard title="Today's Todos" value={stats?.todayTodos || 0} icon={ClipboardList} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Tasks by Status */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={taskPie} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                {taskPie.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Projects by Status */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Projects by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={projectPie} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                {projectPie.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Assets by Category */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Assets by Category</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={assetBar} barSize={18}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                {assetBar.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Priority */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-foreground mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={priorityBar} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                {priorityBar.map((p: any) => {
                  const c = { LOW: '#94a3b8', MEDIUM: '#60a5fa', HIGH: '#f59e0b', CRITICAL: '#ef4444' };
                  return <Cell key={p.name} fill={c[p.name as keyof typeof c] || '#6366f1'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {!stats?.recentActivity?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : stats.recentActivity.map((log: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <Avatar name={log.user?.name || 'System'} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">
                    <span className="font-medium">{log.user?.name || 'System'}</span>
                    {' — '}{log.details || `${log.action} on ${log.module}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmt.ago(log.createdAt)}</p>
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md shrink-0">{log.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-amber-500" />
            <h3 className="font-semibold text-sm text-foreground">Upcoming Deadlines</h3>
            <span className="text-xs text-muted-foreground ml-auto">Next 7 days</span>
          </div>
          <div className="space-y-2.5">
            {!stats?.upcomingDeadlines?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines</p>
            ) : stats.upcomingDeadlines.map((task: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.project?.name && <span className="text-primary">{task.project.name} · </span>}
                    {task.assignee?.name || 'Unassigned'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <PriorityBadge priority={task.priority} />
                  <p className="text-xs text-amber-500 font-medium mt-1">{fmt.date(task.deadline)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
