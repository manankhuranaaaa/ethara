export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const extractApiError = (error) => {
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors.map((e) => e.message).join(', ');
  }
  return error?.response?.data?.message || error?.message || 'Something went wrong';
};

export const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
};

export const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  in_review: { label: 'In Review', color: 'bg-yellow-100 text-yellow-700' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700' },
};

export const PROJECT_STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-600' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700' },
};
