import { getInitials } from '../../utils';

const sizeClasses = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };

export default function Avatar({ user, size = 'md' }) {
  if (!user) return null;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold flex-shrink-0`}>
      {getInitials(user.name)}
    </div>
  );
}
