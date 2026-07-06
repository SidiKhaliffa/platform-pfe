import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './Sidebar.css';

const NAV = [
  { to: '/servers',       label: 'Serveurs' },
  { to: '/monitoring',    label: 'Monitoring' },
  { to: '/installations', label: 'Installations' },
  { to: '/users',         label: 'Utilisateurs', adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">Nexus platform</div>

      <nav className="sidebar__nav">
        {NAV.filter((item) => !item.adminOnly || user?.role === 'ADMIN').map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              'sidebar__link' + (isActive ? ' sidebar__link--active' : '')
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <span className="sidebar__email">{user?.email}</span>
          <span className="sidebar__role">{user?.role}</span>
        </div>
        <button className="sidebar__logout" onClick={logout}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
