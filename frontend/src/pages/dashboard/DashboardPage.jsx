import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardApi } from '../../api';
import { formatDate, formatRelativeTime } from '../../utils';
import { CardSkeleton } from '../../components/ui/Skeleton';
import Avatar from '../../components/ui/Avatar';
import PriorityBadge from '../../components/ui/PriorityBadge';

const STATUS_COLORS = { todo: '#6b7280', in_progress: '#3b82f6', in_review: '#f59e0b', done: '#10b981' };
const PRIORITY_COLORS = { low: '#6b7280', medium: '#3b82f6', high: '#f97316', critical: '#ef4444' };

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const statusChartData = stats
    ? Object.entries(stats.tasksByStatus).map(([name, value]) => ({ name: name.replace('_', ' '), value, fill: STATUS_COLORS[name] }))
    : [];

  const priorityChartData = [
    { name: 'Low', value: 0, fill: PRIORITY_COLORS.low },
    { name: 'Medium', value: 0, fill: PRIORITY_COLORS.medium },
    { name: 'High', value: 0, fill: PRIORITY_COLORS.high },
    { name: 'Critical', value: 0, fill: PRIORITY_COLORS.critical },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your team&apos;s progress</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={stats?.totalProjects} icon="📁" color="bg-blue-50" />
        <StatCard label="Total Tasks" value={stats?.totalTasks} icon="✅" color="bg-green-50" />
        <StatCard label="Overdue Tasks" value={stats?.overdueCount} icon="⚠️" color="bg-red-50" />
        <StatCard label="My Assigned Tasks" value={stats?.myAssignedTasks} icon="👤" color="bg-purple-50" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tasks by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {statusChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tasks by Priority</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {priorityChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
            <div className="space-y-3">
              {stats?.upcomingDueDates?.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.assignee && <Avatar user={task.assignee} size="sm" />}
                    <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-xs text-gray-500">{formatDate(task.due_date)}</span>
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
