import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useTaskStore from '../../store/taskStore';
import useAuthStore from '../../store/authStore';
import { commentsApi } from '../../api';
import { formatDate, formatRelativeTime, STATUS_CONFIG, PRIORITY_CONFIG, extractApiError } from '../../utils';
import PriorityBadge from '../../components/ui/PriorityBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import Avatar from '../../components/ui/Avatar';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { Skeleton } from '../../components/ui/Skeleton';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTask, isLoading, fetchTask, updateTask, updateTaskStatus, deleteTask, addComment, updateComment, removeComment } = useTaskStore();
  const { user } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    fetchTask(id).then((task) => {
      if (task) reset({ title: task.title, description: task.description, priority: task.priority, due_date: task.due_date });
    });
  }, [id]);

  const onSave = async (data) => {
    try {
      await updateTask(id, data);
      toast.success('Task updated');
      setEditMode(false);
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const handleStatusChange = async (e) => {
    try {
      await updateTaskStatus(id, e.target.value);
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const { data } = await commentsApi.add(id, commentText.trim());
      addComment(data.data);
      setCommentText('');
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId) => {
    try {
      await commentsApi.edit(commentId, editCommentText);
      updateComment(commentId, editCommentText);
      setEditingComment(null);
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentsApi.delete(commentId);
      removeComment(commentId);
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTask(id);
      toast.success('Task deleted');
      navigate(-1);
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  if (isLoading || !currentTask) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const task = currentTask;
  const isOverdue = task.is_overdue && task.status !== 'done';

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/projects" className="hover:text-blue-600">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${task.project_id}`} className="hover:text-blue-600">Project</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{task.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            {editMode ? (
              <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                <input {...register('title')} className="input text-lg font-semibold" />
                <textarea {...register('description')} className="input resize-none" rows={4} placeholder="Description..." />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                    <select {...register('priority')} className="input">
                      {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                    <input {...register('due_date')} type="date" className="input" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-sm" disabled={isSubmitting}>Save</button>
                  <button type="button" onClick={() => setEditMode(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditMode(true)} className="btn-secondary text-sm">Edit</button>
                    <button onClick={() => setDeleteModalOpen(true)} className="btn-danger text-sm">Delete</button>
                  </div>
                </div>
                {isOverdue && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                    ⚠️ This task is overdue
                  </div>
                )}
                <p className="text-gray-600 text-sm whitespace-pre-wrap">
                  {task.description || <span className="text-gray-400 italic">No description</span>}
                </p>
              </>
            )}
          </div>

          {/* Comments */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Comments ({task.comments?.length || 0})
            </h2>

            <form onSubmit={handleAddComment} className="flex gap-3 mb-6">
              <Avatar user={user} size="sm" />
              <div className="flex-1 flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="input flex-1"
                  placeholder="Add a comment..."
                />
                <button type="submit" className="btn-primary text-sm" disabled={submittingComment || !commentText.trim()}>
                  Post
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {task.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar user={comment.author} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">{comment.author?.name}</span>
                      <span className="text-xs text-gray-400">{formatRelativeTime(comment.created_at)}</span>
                    </div>
                    {editingComment === comment.id ? (
                      <div className="flex gap-2">
                        <input
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="input flex-1 text-sm"
                        />
                        <button onClick={() => handleEditComment(comment.id)} className="btn-primary text-xs">Save</button>
                        <button onClick={() => setEditingComment(null)} className="btn-secondary text-xs">Cancel</button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    )}
                    {comment.user_id === user?.id && editingComment !== comment.id && (
                      <div className="flex gap-3 mt-1">
                        <button
                          onClick={() => { setEditingComment(comment.id); setEditCommentText(comment.content); }}
                          className="text-xs text-gray-400 hover:text-blue-600"
                        >Edit</button>
                        <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-gray-400 hover:text-red-600">Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={task.status} onChange={handleStatusChange} className="input">
                {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <PriorityBadge priority={task.priority} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Assignee</label>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar user={task.assignee} size="sm" />
                  <span className="text-sm text-gray-700">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Unassigned</span>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Created by</label>
              <div className="flex items-center gap-2">
                <Avatar user={task.creator} size="sm" />
                <span className="text-sm text-gray-700">{task.creator?.name}</span>
              </div>
            </div>
            {task.due_date && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                  {formatDate(task.due_date)}
                </span>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
              <span className="text-sm text-gray-500">{formatRelativeTime(task.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
