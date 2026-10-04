import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Component } from 'react';

// Per-page error boundary — catches crashes in individual admin pages
// without killing the entire admin layout
class PageErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  componentDidCatch(e, info) { console.error('[AdminPage]', e, info.componentStack); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h5 style={{ color: '#dc3545', marginBottom: 8 }}>This page encountered an error</h5>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
          {this.state.error?.message || 'An unexpected error occurred.'}
        </p>
        <button
          className="btn btn-primary"
          onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
        >
          Reload Page
        </button>
      </div>
    );
  }
}

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
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Show a friendly spinner while auth is resolving (avoids crash on cold start)
  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f4f6f9', gap:16 }}>
        <div className="spinner-border text-primary" style={{ width:48, height:48 }} />
        <p style={{ color:'#888', fontFamily:"'Rubik',sans-serif", fontSize:14 }}>
          Starting up… this may take up to 30 seconds on the free plan.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <div className="admin-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="admin-logo"><i className="fas fa-mobile-alt me-2" />Isa Moh Admin</div>

        <nav className="mt-2" style={{ flex: 1, overflowY: 'auto' }}>
          {LINKS.map(([to, icon, label, exact]) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <i className={`${icon}`} /> {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
          <a className="nav-link" href="/" target="_blank">
            <i className="fas fa-external-link-alt" /> View Site
          </a>
          <button
            type="button"
            className="nav-link border-0 bg-transparent w-100 text-start"
            style={{ color: '#ff6b6b' }}
            onClick={async () => { await logout(); navigate('/'); }}
          >
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
          <div style={{ padding: '10px 20px 16px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            Logged in as <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{user?.firstName}</strong>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content" style={{ flex: 1 }}>
        <PageErrorBoundary>
          <Outlet />
        </PageErrorBoundary>
      </div>
    </div>
  );
}
