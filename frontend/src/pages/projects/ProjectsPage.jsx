import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import useProjectStore from '../../store/projectStore';
import { formatDate, PROJECT_STATUS_CONFIG, extractApiError } from '../../utils';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().optional(),
  due_date: z.string().optional(),
});

function ProjectCard({ project }) {
  const config = PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG.active;
  const stats = project.taskStats || {};
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const done = stats.done || 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Link to={`/projects/${project.id}`} className="card hover:shadow-md transition-shadow block group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {project.name}
        </h3>
        <span className={`badge ${config.color} flex-shrink-0 ml-2`}>{config.label}</span>
      </div>

      {project.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{done}/{total} tasks</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.members?.slice(0, 4).map((m) => (
              <div key={m.id} className="ring-2 ring-white rounded-full">
                <Avatar user={m.user} size="sm" />
              </div>
            ))}
            {project.members?.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-xs text-gray-600">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          {project.due_date && (
            <span className="text-xs text-gray-500">Due {formatDate(project.due_date)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const { projects, isLoading, fetchProjects, createProject } = useProjectStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetchProjects({ search, status: statusFilter });
  }, [search, statusFilter]);

  const onSubmit = async (data) => {
    try {
      await createProject(data);
      toast.success('Project created!');
      setModalOpen(false);
      reset();
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">+ New Project</button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input max-w-xs">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects yet"
          description="Create your first project to start organizing tasks."
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">Create Project</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="Create New Project">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input {...register('name')} className="input" placeholder="e.g. Website Redesign" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description')} className="input resize-none" rows={3} placeholder="What is this project about?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input {...register('due_date')} type="date" className="input" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setModalOpen(false); reset(); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
