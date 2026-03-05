import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { teamAPI, tasksAPI } from '@/services/api';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

const statusColors = {
  available: 'bg-green-500',
  busy: 'bg-yellow-500',
  offline: 'bg-slate-400',
};

const statusBadgeColors = {
  available: 'bg-green-100 text-green-800',
  busy: 'bg-yellow-100 text-yellow-800',
  offline: 'bg-slate-100 text-slate-800',
};

const TeamMemberCard = ({ member, tasks, onStatusChange }) => {
  const memberTasks = tasks.filter(t => t.assigned_to === member.id);
  const activeTasks = memberTasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = memberTasks.filter(t => t.status === 'completed').length;

  return (
    <Card className="team-member-card flex-col" data-testid={`team-member-card-${member.id}`}>
      <div className="flex items-start gap-4 w-full">
        <div className="relative">
          <Avatar className="h-14 w-14">
            <AvatarFallback className={`${statusColors[member.status]} text-white text-lg font-semibold`}>
              {member.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${statusColors[member.status]}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 font-[Manrope]">{member.name}</h3>
              <p className="text-sm text-slate-500 capitalize">{member.role}</p>
            </div>
            <Select 
              value={member.status} 
              onValueChange={(value) => onStatusChange(member.id, value)}
            >
              <SelectTrigger className="w-[120px] h-8" data-testid={`status-select-${member.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 space-y-2">
            {member.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{member.phone}</span>
              </div>
            )}
            {member.location && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>Last seen: {new Date(member.location.updated_at).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 w-full">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Active</p>
            <p className="font-semibold text-slate-900">{activeTasks}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Completed</p>
            <p className="font-semibold text-slate-900">{completedTasks}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="font-semibold text-slate-900">{memberTasks.length}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const TeamPage = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [teamRes, tasksRes] = await Promise.all([
        teamAPI.getAll(),
        tasksAPI.getAll(),
      ]);
      setTeamMembers(teamRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (memberId, status) => {
    try {
      await teamAPI.update(memberId, { status });
      setTeamMembers(prev => 
        prev.map(m => m.id === memberId ? { ...m, status } : m)
      );
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredMembers = teamMembers.filter((member) => {
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    return matchesRole && matchesStatus;
  });

  const stats = {
    total: teamMembers.length,
    available: teamMembers.filter(m => m.status === 'available').length,
    busy: teamMembers.filter(m => m.status === 'busy').length,
    offline: teamMembers.filter(m => m.status === 'offline').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="team-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-[Manrope]">Team Management</h2>
          <p className="text-slate-500">{teamMembers.length} team members</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900 font-[Manrope]">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Available</p>
              <p className="text-2xl font-bold text-green-600 font-[Manrope]">{stats.available}</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Busy</p>
              <p className="text-2xl font-bold text-yellow-600 font-[Manrope]">{stats.busy}</p>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Offline</p>
              <p className="text-2xl font-bold text-slate-600 font-[Manrope]">{stats.offline}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[160px]" data-testid="filter-role">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="technician">Technician</SelectItem>
                <SelectItem value="dispatcher">Dispatcher</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 ml-auto">
              {['all', 'available', 'busy', 'offline'].map((status) => (
                <Badge
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  className={`cursor-pointer capitalize ${filterStatus === status ? 'bg-blue-600' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all' ? 'All' : status}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full empty-state py-16">
            <Users className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500">No team members found</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              tasks={tasks}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TeamPage;
