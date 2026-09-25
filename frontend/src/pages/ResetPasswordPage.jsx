import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [loading,   setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== password2) { toast.error('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const r = await api.post(`/auth/reset-password/${token}`, { password });
      toast.success(r.data.message);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed.');
    } finally { setLoading(false); }
  }

  return (
    <Layout>
      <section className="py-5" style={{ background: '#f8f9fa', minHeight: '70vh' }}>
        <div className="container" style={{ maxWidth: 460 }}>
          <div className="bg-white rounded-3 shadow-sm p-5 text-center">
            <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg,#003859,#00A5C4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="fas fa-key" style={{ color: '#fff', fontSize: 24 }} />
            </div>
            <h4 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859', marginBottom: 8 }}>Reset Password</h4>
            <p className="text-muted mb-4" style={{ fontSize: 14 }}>Enter your new password below.</p>
            <form onSubmit={handleSubmit} className="text-start">
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>New Password *</label>
                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={{ borderRadius: 8, border: '1.5px solid #ddd' }} />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Confirm Password *</label>
                <input type="password" className="form-control" value={password2} onChange={e => setPassword2(e.target.value)} required minLength={6} style={{ borderRadius: 8, border: '1.5px solid #ddd' }} />
              </div>
              <button type="submit" className="btn btn-secondary-custom w-100 py-2" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Resetting...</> : 'Reset Password'}
              </button>
            </form>
            <div className="mt-3"><Link to="/" style={{ fontSize: 13, color: '#00A5C4' }}><i className="fas fa-arrow-left me-1" />Back to Home</Link></div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
