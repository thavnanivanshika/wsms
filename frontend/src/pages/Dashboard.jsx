import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  IcoPackage, IcoCreditCard, IcoFilePlus,
  IcoList, IcoHelp, IcoArrowRight,
  IcoCheckCircle, IcoUser, IcoBarChart, IcoAlertCircle, IcoSettings,
} from '../components/Icons.jsx';

const TILES = [
  // ── user tiles ──────────────────────────────────────────────
  {
    to: '/items',
    icon: <IcoPackage size={22} />,
    title: 'Stationery Availability',
    desc: 'Browse all items you are eligible to request with live stock levels.',
    cls: 'tile--blue',
  },
  // ── user tiles ──────────────────────────────────────────────
  {
    to: '/eligibility',
    icon: <IcoCreditCard size={22} />,
    title: 'My Eligibility',
    desc: 'View your purchase cap and remaining balance for this cycle.',
    cls: 'tile--green',
    userOnly: true,
  },
  {
    to: '/new-request',
    icon: <IcoFilePlus size={22} />,
    title: 'New Request',
    desc: 'Apply for stationery — add multiple items in a single request.',
    cls: 'tile--violet',
    userOnly: true,
  },
  {
    to: '/my-requests',
    icon: <IcoList size={22} />,
    title: 'My Requests',
    desc: 'Track status, withdraw a pending request, or request cancellation.',
    cls: 'tile--amber',
    userOnly: true,
  },
  // ── admin tiles ──────────────────────────────────────────────
  {
    to: '/admin?tab=requests',
    icon: <IcoCheckCircle size={22} />,
    title: 'Pending Requests',
    desc: 'Review and approve or reject stationery requests from staff.',
    cls: 'tile--rose',
    adminOnly: true,
  },
  {
    to: '/admin?tab=items',
    icon: <IcoPackage size={22} />,
    title: 'Manage Stationery',
    desc: 'Add, edit or remove items from the stationery product catalog.',
    cls: 'tile--blue',
    adminOnly: true,
  },
  {
    to: '/admin?tab=users',
    icon: <IcoUser size={22} />,
    title: 'Manage Users',
    desc: 'View all accounts and promote or demote users to admin.',
    cls: 'tile--violet',
    adminOnly: true,
  },
  {
    to: '/admin?tab=categories',
    icon: <IcoSettings size={22} />,
    title: 'Categories',
    desc: 'Add, edit or remove stationery item categories.',
    cls: 'tile--amber',
    adminOnly: true,
  },
  {
    to: '/admin?tab=departments',
    icon: <IcoSettings size={22} />,
    title: 'Departments',
    desc: 'Manage institutional departments shown during registration.',
    cls: 'tile--green',
    adminOnly: true,
  },
  {
    to: '/admin?tab=lowstock',
    icon: <IcoAlertCircle size={22} />,
    title: 'Low Stock',
    desc: 'Items running low — restock before requests start failing.',
    cls: 'tile--rose',
    adminOnly: true,
  },
  {
    to: '/admin?tab=reports',
    icon: <IcoBarChart size={22} />,
    title: 'Reports',
    desc: 'Spending analytics — cost per item, head count, % of total.',
    cls: 'tile--blue',
    adminOnly: true,
  },
  {
    to: '/admin?tab=history',
    icon: <IcoList size={22} />,
    title: 'Request History',
    desc: 'All processed requests — approved, rejected, cancelled.',
    cls: 'tile--amber',
    adminOnly: true,
  },
  // ── shared ───────────────────────────────────────────────────
  {
    to: '/help',
    icon: <IcoHelp size={22} />,
    title: 'Help',
    desc: 'Guides on requesting stationery and understanding request statuses.',
    cls: '',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';
  const tiles = TILES.filter(t => (!t.adminOnly || isManager) && (!t.userOnly || !isManager));

  return (
    <div>
      {/* Hero */}
      <div className="dash-hero">
        <div className="hero-welcome">Welcome back, {user?.username} 👋</div>
        <div className="hero-sub">
          {isManager
            ? 'Manage requests, stationery catalog, and user accounts from here.'
            : 'Submit and track your stationery requests from here.'}
        </div>
        <div className="hero-badges">
          {user?.department && (
            <span className="hero-badge">
              <span>🏛</span> {user.department}
            </span>
          )}
          <span className="hero-badge" style={{
            background: isManager ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.12)',
            borderColor: isManager ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.18)',
          }}>
            {isManager ? '⚡ Admin' : '👤 Staff'}
          </span>
        </div>
      </div>

      {/* Module tiles */}
      <div className="section-hd">
        <h3>Modules</h3>
      </div>
      <div className="grid">
        {tiles.map(t => (
          <Link key={t.to} to={t.to} className={`tile ${t.cls}`}>
            <div className="tile-icon">{t.icon}</div>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
            <div className="tile-arr"><IcoArrowRight size={15} /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
