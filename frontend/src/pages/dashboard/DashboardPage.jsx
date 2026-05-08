import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardApi } from '../../api';
import { formatDate, formatRelativeTime, STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils';
import { CardSkeleton } from '../../components/ui/Skeleton';
import Avatar from '../../components/ui/Avatar';
import PriorityBadge from '../../components/ui/PriorityBadge';
import StatusBadge from '../../components/ui/StatusBadge';

const STATUS_COLORS = { todo: '#6b7280', in_progress: '#3b82f6', in_review: '#f59e0b', done: '#10b981' };
const PRIORITY_COLORS = { low: '#6b7280', medium: '#3b82f6', high: '#f97316', critical: '#ef4444' };

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then(({ data }) => setStats(data.data))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const statusChartData = stats
    ? Object.entries(stats.tasksByStatus).map(([name, value]) => ({
        name: STATUS_CONFIG[name]?.label || name,
        value,
        fill: STATUS_COLORS[name],
      }))
    : [];

  const priorityChartData = stats
    ? Object.entries(stats.tasksByPriority || {}).map(([name, value]) => ({
        name: PRIORITY_CONFIG[name]?.label || name,
        value,
        fill: PRIORITY_COLORS[name],
      }))
    : [
        { name: 'Low', value: 0, fill: PRIORITY_COLORS.low },
        { name: 'Medium', value: 0, fill: PRIORITY_COLORS.medium },
        { name: 'High', value: 0, fill: PRIORITY_COLORS.high },
        { name: 'Critical', value: 0, fill: PRIORITY_COLORS.critical },
      ];

  const completedPct = stats?.totalTasks > 0
    ? Math.round((stats.tasksByStatus.done / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your team&apos;s progress</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={stats?.totalProjects} icon="📁" color="bg-blue-50" />
        <StatCard label="Total Tasks" value={stats?.totalTasks} icon="✅" color="bg-green-50" sub={`${completedPct}% completed`} />
        <StatCard label="Overdue Tasks" value={stats?.overdueCount} icon="⚠️" color="bg-red-50" />
        <StatCard label="My Assigned Tasks" value={stats?.myAssignedTasks} icon="👤" color="bg-purple-50" />
      </div>

      {/* Tasks Due Today */}
      {stats?.tasksDueToday?.length > 0 && (
        <div className="card border-l-4 border-l-orange-400">
          <h2 className="text-base font-semibold text-gray-900 mb-3">🔥 Due Today ({stats.tasksDueToday.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stats.tasksDueToday.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-orange-100 bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                  {task.assignee && <p className="text-xs text-gray-500">{task.assignee.name}</p>}
                </div>
                <PriorityBadge priority={task.priority} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tasks by Status</h2>
          {stats?.totalTasks === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No tasks yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {statusChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tasks by Priority</h2>
          {stats?.totalTasks === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No tasks yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Projects */}
      {stats?.recentProjects?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-700">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.recentProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-800 truncate">{project.name}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Avatar user={project.owner} size="sm" />
                  <p className="text-xs text-gray-500 truncate">{project.owner?.name}</p>
                </div>
                {project.due_date && (
                  <p className="text-xs text-gray-400 mt-1">Due {formatDate(project.due_date)}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {stats?.recentActivity?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {stats?.recentActivity?.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <Avatar user={log.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{log.user?.name || 'System'}</span>{' '}
                      <span className="text-gray-500">{log.action.replace(/_/g, ' ')}</span>{' '}
                      <span className="font-medium">{log.entity_type}</span>
                    </p>
                    <p className="text-xs text-gray-400">{formatRelativeTime(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Due Dates */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Due in Next 7 Days</h2>
          {stats?.upcomingDueDates?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No upcoming deadlines 🎉</p>
          ) : (
            <div className="space-y-2">
              {stats?.upcomingDueDates?.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.assignee && <Avatar user={task.assignee} size="sm" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(task.due_date)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
