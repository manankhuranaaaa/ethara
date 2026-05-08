import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useProjectStore from '../../store/projectStore';
import useTaskStore from '../../store/taskStore';
import useAuthStore from '../../store/authStore';
import { usersApi } from '../../api';
import { formatDate, STATUS_CONFIG, PRIORITY_CONFIG, extractApiError } from '../../utils';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import TaskModal from '../../components/ui/TaskModal';
import { Skeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  due_date: z.string().optional(),
  assignee_id: z.string().optional(),
});

const COLUMNS = ['todo', 'in_progress', 'in_review', 'done'];

function TaskCard({ task, onClick, onDragStart }) {
  const isOverdue = task.is_overdue && task.status !== 'done';
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); onDragStart?.(); }}
      onClick={() => onClick(task.id)}
      className={`bg-white rounded-lg border p-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-800 hover:text-blue-600 line-clamp-2">{task.title}</p>
        {isOverdue && <span className="text-red-500 text-xs flex-shrink-0">⚠ Overdue</span>}
      </div>
      <div className="flex items-center justify-between mt-3">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {formatDate(task.due_date)}
            </span>
          )}
          {task.assignee && <Avatar user={task.assignee} size="sm" />}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ status, tasks, onDrop, onDragOver, onCreateTask, onTaskClick }) {
  const config = STATUS_CONFIG[status];
  const [isDragOver, setIsDragOver] = useState(false);
  return (
    <div
      className={`flex-1 min-w-[240px] rounded-xl p-3 transition-colors ${isDragOver ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-50'}`}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, status); }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`badge ${config.color}`}>{config.label}</span>
          <span className="text-xs text-gray-400 font-medium">{tasks.length}</span>
        </div>
        {status === 'todo' && (
          <button onClick={onCreateTask} className="text-blue-600 hover:text-blue-700 text-lg leading-none font-bold" title="New task">+</button>
        )}
      </div>
      <div className="space-y-2 min-h-[80px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { currentProject, fetchProject, addMember, removeMember } = useProjectStore();
  const { tasks, isLoading: tasksLoading, fetchTasks, createTask, updateTaskStatus } = useTaskStore();
  const { user } = useAuthStore();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Member search state
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium' },
  });

  useEffect(() => {
    Promise.all([fetchProject(id), fetchTasks(id)]).finally(() => setProjectLoading(false));
  }, [id]);

  // Debounced email search
  useEffect(() => {
    if (memberSearch.length < 2) { setMemberResults([]); return; }
    const timer = setTimeout(async () => {
      setMemberSearching(true);
      try {
        const { data } = await usersApi.search(memberSearch);
        // Filter out already-members
        const memberIds = new Set(currentProject?.members?.map((m) => m.user_id) || []);
        setMemberResults((data.data || []).filter((u) => !memberIds.has(u.id)));
      } catch {
        setMemberResults([]);
      } finally {
        setMemberSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [memberSearch, currentProject?.members]);

  const handleDrop = useCallback(async (e, newStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success(`Moved to ${STATUS_CONFIG[newStatus].label}`);
    } catch {
      toast.error('Failed to update task status');
    }
  }, [tasks, updateTaskStatus]);

  const onCreateTask = async (data) => {
    try {
      await createTask(id, data);
      toast.success('Task created!');
      setTaskModalOpen(false);
      reset();
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const handleAddMember = async (targetUser) => {
    setAddingMember(true);
    try {
      await addMember(id, { userId: targetUser.id, role: 'member' });
      await fetchProject(id);
      toast.success(`${targetUser.name} added to project`);
      setMemberSearch('');
      setMemberResults([]);
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await removeMember(id, memberId);
      toast.success('Member removed');
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  if (projectLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="flex gap-4 mt-6">
          {COLUMNS.map((c) => <Skeleton key={c} className="flex-1 h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return <EmptyState icon="🔍" title="Project not found" description="This project doesn't exist or you don't have access." />;
  }

  const tasksByStatus = COLUMNS.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {});

  const totalTasks = tasks.length;
  const doneTasks = tasksByStatus.done.length;
  const overdueTasks = tasks.filter((t) => t.is_overdue && t.status !== 'done').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const isProjectAdmin = user?.role === 'admin' ||
    currentProject.owner_id === user?.id ||
    currentProject.members?.some((m) => m.user_id === user?.id && m.role === 'admin');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/projects" className="hover:text-blue-600">Projects</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{currentProject.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
          {currentProject.description && (
            <p className="text-gray-500 text-sm mt-1">{currentProject.description}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {isProjectAdmin && (
            <button onClick={() => setAddMemberOpen(true)} className="btn-secondary text-sm">+ Add Member</button>
          )}
          <button onClick={() => setTaskModalOpen(true)} className="btn-primary text-sm">+ New Task</button>
        </div>
      </div>

      {/* Project Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{totalTasks}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Tasks</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xl font-bold text-green-600">{doneTasks}</p>
          <p className="text-xs text-gray-500 mt-0.5">Completed</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{totalTasks - doneTasks}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pending</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xl font-bold text-red-500">{overdueTasks}</p>
          <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
        </div>
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="font-semibold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Project meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <span>👤</span>
          <span>Owner: <span className="text-gray-700 font-medium">{currentProject.owner?.name}</span></span>
        </div>
        {currentProject.due_date && (
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>Due: <span className="text-gray-700 font-medium">{formatDate(currentProject.due_date)}</span></span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span>👥</span>
          <div className="flex -space-x-2">
            {currentProject.members?.slice(0, 5).map((m) => (
              <div key={m.id} className="ring-2 ring-white rounded-full" title={m.user?.name}>
                <Avatar user={m.user} size="sm" />
              </div>
            ))}
            {currentProject.members?.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-xs text-gray-600">
                +{currentProject.members.length - 5}
              </div>
            )}
          </div>
          <span>{currentProject.members?.length} member{currentProject.members?.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Kanban Board */}
      {tasksLoading ? (
        <div className="flex gap-4">
          {COLUMNS.map((c) => <Skeleton key={c} className="flex-1 h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onCreateTask={() => setTaskModalOpen(true)}
                onTaskClick={(taskId) => setSelectedTaskId(taskId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={taskModalOpen} onClose={() => { setTaskModalOpen(false); reset(); }} title="Create New Task">
        <form onSubmit={handleSubmit(onCreateTask)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input {...register('title')} className="input" placeholder="Task title" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description')} className="input resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select {...register('priority')} className="input">
                {Object.entries(PRIORITY_CONFIG).map(([v, c]) => (
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input {...register('due_date')} type="date" className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select {...register('assignee_id')} className="input">
              <option value="">Unassigned</option>
              {currentProject.members?.map((m) => (
                <option key={m.user_id} value={m.user_id}>{m.user?.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setTaskModalOpen(false); reset(); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={addMemberOpen} onClose={() => { setAddMemberOpen(false); setMemberSearch(''); setMemberResults([]); }} title="Manage Members">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by email</label>
            <input
              type="email"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="input"
              placeholder="user@example.com"
              autoComplete="off"
            />
            {memberSearching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
            {memberResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                {memberResults.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <Avatar user={u} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(u)}
                      disabled={addingMember}
                      className="btn-primary text-xs py-1 px-3"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
            {memberSearch.length >= 2 && !memberSearching && memberResults.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">No users found with that email.</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Members ({currentProject.members?.length})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentProject.members?.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Avatar user={m.user} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.user?.name}</p>
                      <p className="text-xs text-gray-500">{m.user?.email} · {m.role}</p>
                    </div>
                  </div>
                  {isProjectAdmin && m.user_id !== currentProject.owner_id && (
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Remove
                    </button>
                  )}
                  {m.user_id === currentProject.owner_id && (
                    <span className="text-xs text-gray-400">Owner</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={() => { setAddMemberOpen(false); setMemberSearch(''); setMemberResults([]); }} className="btn-secondary">Close</button>
          </div>
        </div>
      </Modal>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onDeleted={() => fetchTasks(id)}
          projectMembers={currentProject.members || []}
        />
      )}
    </div>
  );
}
