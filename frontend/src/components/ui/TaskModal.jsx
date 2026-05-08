import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useTaskStore from '../../store/taskStore';
import useAuthStore from '../../store/authStore';
import { commentsApi, tasksApi } from '../../api';
import { formatDate, formatRelativeTime, STATUS_CONFIG, PRIORITY_CONFIG, extractApiError } from '../../utils';
import Avatar from './Avatar';
import PriorityBadge from './PriorityBadge';
import ConfirmModal from './ConfirmModal';

export default function TaskModal({ taskId, onClose, onDeleted, projectMembers = [] }) {
  const { currentTask, isLoading, fetchTask, updateTask, updateTaskStatus, deleteTask, addComment, updateComment, removeComment } = useTaskStore();
  const { user } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (!taskId) return;
    fetchTask(taskId).then((task) => {
      if (task) reset({ title: task.title, description: task.description || '', priority: task.priority, due_date: task.due_date || '', assignee_id: task.assignee_id || '' });
    });
  }, [taskId]);

  const fetchActivity = async () => {
    if (!taskId) return;
    setActivityLoading(true);
    try {
      const { data } = await tasksApi.getActivity(taskId);
      setActivityLogs(data.data || []);
    } catch {
      // silently fail
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'activity') fetchActivity();
  }, [activeTab, taskId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const onSave = async (data) => {
    try {
      await updateTask(taskId, data);
      toast.success('Task updated');
      setEditMode(false);
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const handleStatusChange = async (e) => {
    try {
      await updateTaskStatus(taskId, e.target.value);
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
      const { data } = await commentsApi.add(taskId, commentText.trim());
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
      await deleteTask(taskId);
      toast.success('Task deleted');
      onDeleted?.();
      onClose();
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const task = currentTask?.id === taskId ? currentTask : null;
  const isOverdue = task?.is_overdue && task?.status !== 'done';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 truncate pr-4">
            {isLoading || !task ? 'Loading task...' : task.title}
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task && !editMode && (
              <>
                <button onClick={() => setEditMode(true)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                <button onClick={() => setDeleteModalOpen(true)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
              </>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-1">&times;</button>
          </div>
        </div>

        {isLoading || !task ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded h-4" style={{ width: `${[75, 100, 50, 90][i]}%` }} />
            ))}
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Main */}
            <div className="md:col-span-2 space-y-5">
              {isOverdue && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  ⚠️ This task is overdue
                </div>
              )}

              {editMode ? (
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
                    <input {...register('title')} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <textarea {...register('description')} className="input resize-none" rows={4} placeholder="Add a description..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Assignee</label>
                    <select {...register('assignee_id')} className="input">
                      <option value="">Unassigned</option>
                      {projectMembers.map((m) => (
                        <option key={m.user_id} value={m.user_id}>{m.user?.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
                    <button type="button" onClick={() => setEditMode(false)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </form>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap min-h-[3rem]">
                    {task.description || <span className="text-gray-400 italic">No description provided.</span>}
                  </p>
                </div>
              )}

              {/* Tabs: Comments / Activity */}
              {!editMode && (
                <div>
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      onClick={() => setActiveTab('comments')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'comments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Comments ({task.comments?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab('activity')}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'activity' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Activity
                    </button>
                  </div>

                  {activeTab === 'comments' && (
                    <div>
                      <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                        <Avatar user={user} size="sm" />
                        <div className="flex-1 flex gap-2">
                          <input
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="input flex-1 text-sm"
                            placeholder="Add a comment..."
                          />
                          <button type="submit" className="btn-primary text-xs py-1.5 px-3" disabled={submittingComment || !commentText.trim()}>
                            Post
                          </button>
                        </div>
                      </form>

                      {task.comments?.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first!</p>
                      )}

                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {task.comments?.map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <Avatar user={comment.author} size="sm" />
                            <div className="flex-1 bg-gray-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-800">{comment.author?.name}</span>
                                <span className="text-xs text-gray-400">{formatRelativeTime(comment.created_at)}</span>
                              </div>
                              {editingComment === comment.id ? (
                                <div className="flex gap-2 mt-1">
                                  <input
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    className="input flex-1 text-xs"
                                  />
                                  <button onClick={() => handleEditComment(comment.id)} className="btn-primary text-xs py-1 px-2">Save</button>
                                  <button onClick={() => setEditingComment(null)} className="btn-secondary text-xs py-1 px-2">Cancel</button>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-700">{comment.content}</p>
                              )}
                              {comment.user_id === user?.id && editingComment !== comment.id && (
                                <div className="flex gap-3 mt-1">
                                  <button onClick={() => { setEditingComment(comment.id); setEditCommentText(comment.content); }} className="text-xs text-gray-400 hover:text-blue-600">Edit</button>
                                  <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-gray-400 hover:text-red-600">Delete</button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {activityLoading ? (
                        <p className="text-sm text-gray-400 text-center py-4">Loading activity...</p>
                      ) : activityLogs.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No activity recorded yet.</p>
                      ) : (
                        activityLogs.map((log) => (
                          <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50">
                            <Avatar user={log.user} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700">
                                <span className="font-medium">{log.user?.name || 'System'}</span>{' '}
                                <span className="text-gray-500">{log.action.replace(/_/g, ' ')}</span>
                              </p>
                              <p className="text-xs text-gray-400">{formatRelativeTime(log.created_at)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                  <select value={task.status} onChange={handleStatusChange} className="input text-sm">
                    {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Priority</label>
                  <PriorityBadge priority={task.priority} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Assignee</label>
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
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Created by</label>
                  <div className="flex items-center gap-2">
                    <Avatar user={task.creator} size="sm" />
                    <span className="text-sm text-gray-700">{task.creator?.name}</span>
                  </div>
                </div>
                {task.due_date && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Due Date</label>
                    <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Created</label>
                  <span className="text-sm text-gray-500">{formatRelativeTime(task.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${task?.title}"? This cannot be undone.`}
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
