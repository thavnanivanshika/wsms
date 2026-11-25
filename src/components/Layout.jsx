import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  IcoHome, IcoPackage, IcoCreditCard, IcoFilePlus,
  IcoList, IcoCheckCircle, IcoHelp,
  IcoLock, IcoLogOut, IcoSettings,
  IcoBarChart, IcoUser, IcoAlertCircle,
} from './Icons.jsx';

const PAGE_TITLES = {
  '/':                 'Dashboard',
  '/items':            'Stationery Availability',
  '/eligibility':      'My Eligibility',
  '/new-request':      'New Request',
  '/my-requests':      'My Requests',
  '/admin':            'Admin Portal',
  '/help':             'Help',
  '/change-password':  'Change Password',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'MANAGER';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = (user?.username || '?').slice(0, 2).toUpperCase();
  const title = PAGE_TITLES[location.pathname] || 'WSMS';

  return (
    <div className="app">
      {/* ---- Sidebar ---- */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">W</div>
          <div>
            <div className="sidebar-brand-name">WSMS</div>
            <div className="sidebar-brand-sub">Stationery System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">General</div>

          <NavLink to="/" end className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            <IcoHome /> Dashboard
          </NavLink>
          <NavLink to="/items" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            <IcoPackage /> Availability
          </NavLink>
          {!isAdmin && (
            <NavLink to="/eligibility" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
              <IcoCreditCard /> Eligibility
            </NavLink>
          )}
          {!isAdmin && (
            <>
              <NavLink to="/new-request" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
                <IcoFilePlus /> New Request
              </NavLink>
              <NavLink to="/my-requests" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
                <IcoList /> My Requests
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 6 }}>Requests</div>
              <NavLink to="/admin?tab=requests" className={() => 'sidebar-link' + (location.pathname === '/admin' && location.search === '?tab=requests' ? ' active' : '')}>
                <IcoCheckCircle /> Pending
              </NavLink>
              <NavLink to="/admin?tab=history" className={() => 'sidebar-link' + (location.pathname === '/admin' && location.search === '?tab=history' ? ' active' : '')}>
                <IcoList /> History
              </NavLink>

              <div className="sidebar-section-label" style={{ marginTop: 6 }}>Catalog</div>
              <NavLink to="/admin?tab=items" className={() => 'sidebar-link' + (location.pathname === '/admin' && location.search === '?tab=items' ? ' active' : '')}>
                <IcoPackage /> Stationery
              </NavLink>
              <NavLink to="/admin?tab=categories" className={() => 'sidebar-link' + (location.pathname === '/admin' && location.search === '?tab=categories' ? ' active' : '')}>
                <IcoSettings /> Categories
              </NavLink>
              <NavLink to="/admin?tab=lowstock" className={() => 'sidebar-link' + (location.pathname === '/admin' && location.search === '?tab=lowstock' ? ' active' : '')}>
                <IcoAlertCircle /> Low Stock
              </NavLink>

              <div className="sidebar-section-label" style={{ marginTop: 6 }}>Manage</div>
              <NavLink to="/admin?tab=users" className={() => 'sidebar-link' + (location.pathname === '/admin' && location.search === '?tab=users' ? ' active' : '')}>
                <IcoUser /> Users
              </NavLink>
              <NavLink to="/admin?tab=departments" className={() => 'sidebar-link' + (location.pathname === '/admin' && location.search === '?tab=departments' ? ' active' : '')}>
                <IcoSettings /> Departments
              </NavLink>

              <div className="sidebar-section-label" style={{ marginTop: 6 }}>Analytics</div>
              <NavLink to="/admin?tab=reports" className={() => 'sidebar-link' + (location.pathname === '/admin' && location.search === '?tab=reports' ? ' active' : '')}>
                <IcoBarChart /> Reports
              </NavLink>
            </>
          )}

          <div className="sidebar-section-label" style={{ marginTop: 6 }}>Support</div>
          <NavLink to="/help" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            <IcoHelp /> Help
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-username">{user?.username}</div>
              <div className="sidebar-role">{isAdmin ? 'Admin' : 'User'}</div>
            </div>
          </div>
          <NavLink
            to="/change-password"
            className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            style={{ marginBottom: 2 }}
          >
            <IcoLock /> Change Password
          </NavLink>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <IcoLogOut /> Sign out
          </button>
        </div>
      </aside>

      {/* ---- Main wrap ---- */}
      <div className="main-wrap">
        <div className="topbar-mini">
          <span className="topbar-title">{title}</span>
          <div className="topbar-actions">
            <span style={{ fontSize: 13, color: 'var(--muted-color)' }}>
              {user?.department && <span>{user.department}</span>}
            </span>
          </div>
        </div>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
