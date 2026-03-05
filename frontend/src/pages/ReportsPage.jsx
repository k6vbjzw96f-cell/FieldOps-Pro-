import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyticsAPI, tasksAPI, teamAPI } from '@/services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  ClipboardList,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, change, icon: Icon, color }) => (
  <Card className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1 font-[Manrope]">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-4 w-4 ${change < 0 ? 'rotate-180' : ''}`} />
            <span>{Math.abs(change)}% vs last period</span>
          </div>
        )}
      </div>
      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </Card>
);

export const ReportsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [period, setPeriod] = useState('7');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, performanceRes, tasksRes, teamRes] = await Promise.all([
          analyticsAPI.getOverview(),
          analyticsAPI.getPerformance(parseInt(period)),
          tasksAPI.getAll(),
          teamAPI.getAll(),
        ]);

        setAnalytics(analyticsRes.data);
        setPerformanceData(performanceRes.data.chart_data);
        setTasks(tasksRes.data);
        setTeam(teamRes.data);
      } catch (error) {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // Calculate task status distribution
  const statusDistribution = [
    { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: '#64748b' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#2563eb' },
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981' },
    { name: 'Cancelled', value: tasks.filter(t => t.status === 'cancelled').length, color: '#ef4444' },
  ].filter(s => s.value > 0);

  // Calculate priority distribution
  const priorityDistribution = [
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length, color: '#ef4444' },
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#f97316' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#2563eb' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#64748b' },
  ].filter(p => p.value > 0);

  // Calculate technician performance
  const technicianPerformance = team
    .filter(m => m.role === 'technician')
    .map(tech => ({
      name: tech.name.split(' ')[0],
      completed: tasks.filter(t => t.assigned_to === tech.id && t.status === 'completed').length,
      active: tasks.filter(t => t.assigned_to === tech.id && t.status === 'in_progress').length,
      total: tasks.filter(t => t.assigned_to === tech.id).length,
    }))
    .filter(t => t.total > 0)
    .sort((a, b) => b.completed - a.completed);

  // Calculate completion rate
  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-[Manrope]">Reports & Analytics</h2>
          <p className="text-slate-500">Track your field operations performance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]" data-testid="period-select">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={analytics?.tasks?.total || 0}
          icon={ClipboardList}
          color="bg-blue-600"
        />
        <StatCard
          title="Completed"
          value={analytics?.tasks?.completed || 0}
          icon={CheckCircle2}
          color="bg-green-500"
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Technicians"
          value={analytics?.team?.available || 0}
          icon={Users}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="font-[Manrope]">Task Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="created" stroke="#2563eb" strokeWidth={2} name="Created" dot={{ fill: '#2563eb' }} />
                  <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" dot={{ fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="font-[Manrope]">Task Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center">
              {statusDistribution.length === 0 ? (
                <p className="text-slate-500">No tasks data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="font-[Manrope]">Technician Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {technicianPerformance.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500">No technician data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={technicianPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="active" fill="#2563eb" name="Active" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="font-[Manrope]">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {priorityDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500">No priority data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[Manrope]">Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700">Average Tasks/Day</p>
                <p className="text-2xl font-bold text-blue-900 font-[Manrope]">
                  {performanceData.length > 0
                    ? Math.round(performanceData.reduce((acc, d) => acc + d.created, 0) / performanceData.length)
                    : 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-700">Completion Rate</p>
                <p className="text-2xl font-bold text-green-900 font-[Manrope]">{completionRate}%</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-700">Urgent/High Priority</p>
                <p className="text-2xl font-bold text-orange-900 font-[Manrope]">
                  {(analytics?.priorities?.urgent || 0) + (analytics?.priorities?.high || 0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
