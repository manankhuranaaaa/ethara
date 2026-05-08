import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useProjectStore from '../../store/projectStore';
import useTaskStore from '../../store/taskStore';
import useAuthStore from '../../store/authStore';
import { formatDate, STATUS_CONFIG, PRIORITY_CONFIG, extractApiError } from '../../utils';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { Link as RouterLink } from 'react-router-dom';

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  due_date: z.string().optional(),
  assignee_id: z.string().optional(),
});

const COLUMNS = ['todo', 'in_progress', 'in_review', 'done'];

function TaskCard({ task, onDragStart }) {
  const isOverdue = task.is_overdue && task.status !== 'done';
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className={`bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <RouterLink to={`/tasks/${task.id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600 line-clamp-2">
          {task.title}
        </RouterLink>
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

function KanbanColumn({ status, tasks, onDrop, onDragOver, onCreateTask }) {
  const config = STATUS_CONFIG[status];
  return (
    <div
      className="flex-1 min-w-[260px] bg-gray-50 rounded-xl p-3"
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`badge ${config.color}`}>{config.label}</span>
          <span className="text-xs text-gray-400 font-medium">{tasks.length}</span>
        </div>
        {status === 'todo' && (
          <button onClick={onCreateTask} className="text-blue-600 hover:text-blue-700 text-lg leading-none font-bold">+</button>
        )}
      </div>
      <div className="space-y-2 min-h-[100px]">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onDragStart={(e, id) => e.dataTransfer.setData('taskId', id)} />
        ))}
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
  const [memberEmail, setMemberEmail] = useState('');
  const [projectLoading, setProjectLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'medium' },
  });

  useEffect(() => {
    Promise.all([fetchProject(id), fetchTasks(id)]).finally(() => setProjectLoading(false));
  }, [id]);

  const handleDrop = useCallback(async (e, newStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch {
      toast.error('Failed to update task status');
    }
  }, [tasks, updateTaskStatus]);

  const handleDragOver = (e) => { e.preventDefault(); };

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

  const handleAddMember = async () => {
    // In a real app, you'd search by email. Here we use userId directly.
    toast.error('Use user ID to add members (see API docs)');
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

  const isProjectAdmin = user?.role === 'admin' ||
    currentProject.owner_id === user?.id ||
    currentProject.members?.some((m) => m.user_id === user?.id && m.role === 'admin');

  return (
    <div className="space-y-6">
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
        <div className="flex gap-2">
          {isProjectAdmin && (
            <button onClick={() => setAddMemberOpen(true)} className="btn-secondary text-sm">+ Add Member</button>
          )}
          <button onClick={() => setTaskModalOpen(true)} className="btn-primary text-sm">+ New Task</button>
        </div>
      </div>

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
        <div className="flex items-center gap-1">
          <span>👥</span>
          <span>{currentProject.members?.length} member{currentProject.members?.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex -space-x-2">
          {currentProject.members?.slice(0, 5).map((m) => (
            <div key={m.id} className="ring-2 ring-white rounded-full">
              <Avatar user={m.user} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onCreateTask={() => setTaskModalOpen(true)}
            />
          ))}
        </div>
      </div>

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
      <Modal isOpen={addMemberOpen} onClose={() => setAddMemberOpen(false)} title="Add Member">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              className="input"
              placeholder="Enter user UUID"
            />
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Members</h4>
            <div className="space-y-2">
              {currentProject.members?.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Avatar user={m.user} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.user?.name}</p>
                      <p className="text-xs text-gray-500">{m.role}</p>
                    </div>
                  </div>
                  {isProjectAdmin && m.user_id !== currentProject.owner_id && (
                    <button
                      onClick={async () => {
                        try {
                          await removeMember(id, m.user_id);
                          toast.success('Member removed');
                        } catch (error) {
                          toast.error(extractApiError(error));
                        }
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setAddMemberOpen(false)} className="btn-secondary">Close</button>
            <button onClick={handleAddMember} className="btn-primary">Add Member</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
