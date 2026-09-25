import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { canAccessAdmin, loading, isLoggedIn } = useAuth();
  const location = useLocation();

  // Still checking auth — show spinner
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f4f6f9' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: 48, height: 48 }} />
          <p style={{ color: '#888', fontFamily: "'Rubik',sans-serif" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in at all — go to home with auth modal trigger
  if (!isLoggedIn) {
    return <Navigate to="/?need_login=1" replace state={{ from: location }} />;
  }

  // Logged in but not admin/seller
  if (!canAccessAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
