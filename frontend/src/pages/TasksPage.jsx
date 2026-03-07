import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { tasksAPI, teamAPI } from '@/services/api';
import { format } from 'date-fns';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Plus,
  CalendarIcon,
  List,
  Search,
  Filter,
  Clock,
  MapPin,
  User,
  Phone,
  Trash2,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';

const localizer = momentLocalizer(moment);

const priorityColors = {
  urgent: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-blue-100 text-blue-800 border-blue-300',
  low: 'bg-slate-100 text-slate-800 border-slate-300',
};

const statusColors = {
  pending: 'bg-slate-100 text-slate-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const TaskCard = ({ task, onEdit, onDelete }) => (
  <Card className="task-card hover:border-blue-300" data-testid={`task-card-${task.id}`}>
    <div className="flex items-start justify-between mb-3">
      <h4 className="font-semibold text-slate-900 font-[Manrope]">{task.title}</h4>
      <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
    </div>
    
    {task.description && (
      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description}</p>
    )}
    
    <div className="space-y-2 text-sm text-slate-500">
      {task.customer_name && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{task.customer_name}</span>
        </div>
      )}
      {task.location?.address && (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{task.location.address}</span>
        </div>
      )}
      {task.scheduled_date && (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>{format(new Date(task.scheduled_date), 'MMM d, yyyy h:mm a')}</span>
        </div>
      )}
      {task.estimated_duration && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{task.estimated_duration} min</span>
        </div>
      )}
    </div>

    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
      <Badge className={statusColors[task.status]}>{task.status.replace('_', ' ')}</Badge>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onEdit(task)}
          data-testid={`edit-task-${task.id}`}
        >
          <Edit className="h-4 w-4 text-slate-500" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onDelete(task.id)}
          data-testid={`delete-task-${task.id}`}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  </Card>
);

const TaskForm = ({ task, teamMembers, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    assigned_to: task?.assigned_to || '',
    customer_name: task?.customer_name || '',
    customer_phone: task?.customer_phone || '',
    estimated_duration: task?.estimated_duration || '',
    scheduled_date: task?.scheduled_date ? new Date(task.scheduled_date) : null,
    location: task?.location || { address: '', lat: null, lng: null },
    notes: task?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
      scheduled_date: formData.scheduled_date?.toISOString() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Task Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., HVAC Repair"
            required
            data-testid="task-title-input"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the task..."
            rows={3}
            data-testid="task-description-input"
          />
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger data-testid="task-priority-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger data-testid="task-status-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Assign To</Label>
          <Select 
            value={formData.assigned_to || "unassigned"} 
            onValueChange={(value) => setFormData({ ...formData, assigned_to: value === "unassigned" ? "" : value })}
          >
            <SelectTrigger data-testid="task-assignee-select">
              <SelectValue placeholder="Select technician" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Scheduled Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-testid="task-date-picker"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.scheduled_date ? format(formData.scheduled_date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.scheduled_date}
                onSelect={(date) => setFormData({ ...formData, scheduled_date: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_name">Customer Name</Label>
          <Input
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            placeholder="John Smith"
            data-testid="task-customer-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_phone">Customer Phone</Label>
          <Input
            id="customer_phone"
            value={formData.customer_phone}
            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            data-testid="task-phone-input"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Location Address</Label>
          <Input
            id="address"
            value={formData.location.address}
            onChange={(e) => setFormData({ 
              ...formData, 
              location: { ...formData.location, address: e.target.value }
            })}
            placeholder="123 Main St, City, State"
            data-testid="task-address-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Estimated Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.estimated_duration}
            onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
            placeholder="60"
            data-testid="task-duration-input"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
            rows={2}
            data-testid="task-notes-input"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} data-testid="cancel-task-btn">
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="save-task-btn">
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, teamRes] = await Promise.all([
        tasksAPI.getAll(),
        teamAPI.getAll({ role: 'technician' }),
      ]);
      setTasks(tasksRes.data);
      setTeamMembers(teamRes.data);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTask = async (data) => {
    try {
      await tasksAPI.create(data);
      toast.success('Task created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (data) => {
    try {
      await tasksAPI.update(editingTask.id, data);
      toast.success('Task updated successfully');
      setDialogOpen(false);
      setEditingTask(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await tasksAPI.delete(taskId);
      toast.success('Task deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const openEditDialog = (task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const calendarEvents = tasks
    .filter((t) => t.scheduled_date)
    .map((task) => ({
      id: task.id,
      title: task.title,
      start: new Date(task.scheduled_date),
      end: new Date(new Date(task.scheduled_date).getTime() + (task.estimated_duration || 60) * 60000),
      resource: task,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tasks-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-[Manrope]">Tasks</h2>
          <p className="text-slate-500">{filteredTasks.length} tasks total</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => { setEditingTask(null); setDialogOpen(true); }}
          data-testid="create-task-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters & View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-tasks-input"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]" data-testid="filter-status">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[140px]" data-testid="filter-priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Tabs value={view} onValueChange={setView}>
                <TabsList>
                  <TabsTrigger value="list" data-testid="list-view-btn">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="calendar" data-testid="calendar-view-btn">
                    <CalendarIcon className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Views */}
      {view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full empty-state py-16">
              <List className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500">No tasks found</p>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => { setEditingTask(null); setDialogOpen(true); }}
              >
                Create a task
              </Button>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={openEditDialog}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>
      ) : (
        <Card className="calendar-container">
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            onSelectEvent={(event) => openEditDialog(event.resource)}
            views={['month', 'week', 'day']}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: event.resource.priority === 'urgent' ? '#ef4444' :
                  event.resource.priority === 'high' ? '#f97316' : '#2563eb',
              },
            })}
          />
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[Manrope]">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            teamMembers={teamMembers}
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            onCancel={() => { setDialogOpen(false); setEditingTask(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;
