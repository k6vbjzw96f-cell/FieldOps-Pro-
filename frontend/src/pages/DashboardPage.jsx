import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { analyticsAPI, tasksAPI, weatherAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Package,
  Plus,
  ArrowRight,
  Cloud,
  Droplets,
  Wind,
  MapPin,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <Card className="stat-card" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1 font-[Manrope]">{value}</p>
        {subtext && <p className="text-sm text-slate-500 mt-1">{subtext}</p>}
      </div>
      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </Card>
);

const WeatherWidget = ({ weather }) => {
  if (!weather) return null;

  return (
    <div className="weather-widget" data-testid="weather-widget">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm opacity-90">{weather.location}</span>
          </div>
          <p className="text-5xl font-bold font-[Manrope]">{Math.round(weather.temp)}°F</p>
          <p className="text-lg mt-1 capitalize">{weather.description}</p>
        </div>
        <Cloud className="h-16 w-16 opacity-80" />
      </div>
      <div className="flex gap-6 mt-4 pt-4 border-t border-white/20">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4" />
          <span className="text-sm">{weather.humidity}% Humidity</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4" />
          <span className="text-sm">{weather.wind_speed} mph</span>
        </div>
      </div>
    </div>
  );
};

const TaskItem = ({ task }) => {
  const priorityColors = {
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-slate-100 text-slate-800',
  };

  const statusColors = {
    pending: 'bg-slate-100 text-slate-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <div className="task-card animate-fade-in" data-testid={`task-item-${task.id}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-slate-900">{task.title}</h4>
        <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
      </div>
      {task.customer_name && (
        <p className="text-sm text-slate-500 mb-2">{task.customer_name}</p>
      )}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={statusColors[task.status]}>
          {task.status.replace('_', ' ')}
        </Badge>
        {task.assigned_to_name && (
          <span className="text-xs text-slate-500">{task.assigned_to_name}</span>
        )}
      </div>
    </div>
  );
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, tasksRes, performanceRes] = await Promise.all([
          analyticsAPI.getOverview(),
          tasksAPI.getAll(),
          analyticsAPI.getPerformance(7),
        ]);

        setAnalytics(analyticsRes.data);
        setRecentTasks(tasksRes.data.slice(0, 5));
        setPerformanceData(performanceRes.data.chart_data);

        // Fetch weather (using default NYC coords for demo)
        try {
          const weatherRes = await weatherAPI.get(40.7128, -74.006);
          setWeather(weatherRes.data);
        } catch (e) {
          console.log('Weather API unavailable');
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-[Manrope]">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-slate-500">Here's what's happening with your field operations today.</p>
        </div>
        <Link to="/tasks">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="new-task-btn">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        <StatCard
          title="Total Tasks"
          value={analytics?.tasks?.total || 0}
          icon={ClipboardList}
          color="bg-blue-600"
          subtext={`${analytics?.tasks?.today || 0} scheduled today`}
        />
        <StatCard
          title="In Progress"
          value={analytics?.tasks?.in_progress || 0}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Completed"
          value={analytics?.tasks?.completed || 0}
          icon={CheckCircle2}
          color="bg-green-500"
        />
        <StatCard
          title="Urgent"
          value={analytics?.priorities?.urgent || 0}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-[Manrope]">Task Performance</CardTitle>
            <span className="text-sm text-slate-500">Last 7 days</span>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={{ fill: '#2563eb' }}
                    name="Created"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                    name="Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weather Widget */}
        <div className="space-y-6">
          <WeatherWidget weather={weather} />
          
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-[Manrope]">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Team Available</p>
                    <p className="font-semibold text-slate-900">
                      {analytics?.team?.available || 0}/{analytics?.team?.total || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Low Stock Alerts</p>
                    <p className="font-semibold text-slate-900">
                      {analytics?.inventory?.low_stock_alerts || 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-[Manrope]">Recent Tasks</CardTitle>
          <Link to="/tasks" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <div className="empty-state">
              <ClipboardList className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500">No tasks yet</p>
              <Link to="/tasks">
                <Button variant="outline" className="mt-3" data-testid="create-first-task-btn">
                  Create your first task
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
