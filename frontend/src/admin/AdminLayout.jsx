import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Component } from 'react';

// Per-page error boundary
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
        <button className="btn btn-primary"
          onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>
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
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sideOpen, setSideOpen] = useState(false);

  // Close sidebar on route change (mobile)
  // eslint-disable-next-line react-hooks/exhaustive-deps

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

  const handleNavClick = () => setSideOpen(false); // close on mobile after nav

  return (
    <div className="admin-shell">

      {/* ── Mobile overlay backdrop ── */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1999,
            display: 'none', // shown via CSS media query
          }}
          className="admin-backdrop"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${sideOpen ? ' open' : ''}`}>
        <div className="admin-logo">
          <i className="fas fa-mobile-alt me-2" />Isa Moh Admin
          {/* Close button — visible on mobile */}
          <button
            type="button"
            onClick={() => setSideOpen(false)}
            className="admin-sidebar-close"
            aria-label="Close menu"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {LINKS.map(([to, icon, label, exact]) => (
            <NavLink key={to} to={to} end={exact}
              onClick={handleNavClick}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <i className={icon} /> {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
          <a className="nav-link" href="/" target="_blank" rel="noreferrer" onClick={handleNavClick}>
            <i className="fas fa-external-link-alt" /> View Site
          </a>
          <button type="button"
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
      </aside>

      {/* ── Main content ── */}
      <div className="admin-content">

        {/* Mobile topbar with hamburger */}
        <div className="admin-mobile-bar d-lg-none">
          <button type="button" className="admin-hamburger" onClick={() => setSideOpen(true)}>
            <i className="fas fa-bars" />
          </button>
          <span style={{ fontFamily:"'Rubik',sans-serif", fontWeight:700, fontSize:16, color: 'var(--text-body)' }}>
            Isa Moh Admin
          </span>
          <a href="/" target="_blank" rel="noreferrer"
            style={{ fontSize:13, color:'var(--secondary)' }}>
            <i className="fas fa-external-link-alt" />
          </a>
        </div>

        <PageErrorBoundary>
          <Outlet />
        </PageErrorBoundary>
      </div>
    </div>
  );
}
