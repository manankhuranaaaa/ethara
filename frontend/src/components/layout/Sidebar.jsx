import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/projects', icon: '📁', label: 'Projects' },
];

const adminItems = [
  { to: '/users', icon: '👥', label: 'Users' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuthStore();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 z-20 transform transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Admin</p>
              </div>
              {adminItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
