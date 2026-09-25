import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  ['/admin',             'fas fa-tachometer-alt', 'Dashboard',   true],
  ['/admin/products',    'fas fa-box',            'Products',    false],
  ['/admin/accessories', 'fas fa-headphones',     'Accessories', false],
  ['/admin/orders',      'fas fa-shopping-bag',   'Orders',      false],
  ['/admin/users',       'fas fa-users',          'Users',       false],
  ['/admin/blog',        'fas fa-newspaper',      'Blog',        false],
  ['/admin/coupons',     'fas fa-tag',            'Coupons',     false],
  ['/admin/reviews',     'fas fa-star',           'Reviews',     false],
  ['/admin/banners',     'fas fa-image',          'Banners',     false],
  ['/admin/settings',    'fas fa-cog',            'Settings',    false],
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-logo"><i className="fas fa-mobile-alt me-2" />Isa &amp; Dagi Admin</div>
        <nav className="mt-2">
          {LINKS.map(([to, icon, label, exact]) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <i className={`${icon}`} /> {label}
            </NavLink>
          ))}
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 20px' }} />
          <a className="nav-link" href="/" target="_blank"><i className="fas fa-external-link-alt" /> View Site</a>
          <button className="nav-link border-0 bg-transparent w-100 text-start text-danger" onClick={async () => { await logout(); navigate('/'); }}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </nav>
        <div style={{ padding: '20px', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 'auto', position: 'absolute', bottom: 0 }}>
          Logged in as <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{user?.firstName}</strong>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content" style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}
