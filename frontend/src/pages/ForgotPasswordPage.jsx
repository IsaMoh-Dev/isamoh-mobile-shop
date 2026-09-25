import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [msg,     setMsg]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true);
    try {
      const r = await api.post('/auth/forgot-password', { email });
      setMsg(r.data.message);
    } catch { setMsg('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <Layout>
      <section className="py-5" style={{ background: '#f8f9fa', minHeight: '70vh' }}>
        <div className="container" style={{ maxWidth: 460 }}>
          <div className="bg-white rounded-3 shadow-sm p-5 text-center">
            <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg,#003859,#00A5C4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <i className="fas fa-lock" style={{ color: '#fff', fontSize: 24 }} />
            </div>
            <h4 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859', marginBottom: 8 }}>Forgot Password?</h4>
            <p className="text-muted mb-4" style={{ fontSize: 14 }}>Enter your email and we'll send you a reset link.</p>
            {msg ? (
              <div className="alert alert-success" style={{ borderRadius: 8, fontSize: 14 }}>{msg}</div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3 text-start">
                  <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Email Address</label>
                  <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" style={{ borderRadius: 8, border: '1.5px solid #ddd' }} />
                </div>
                <button type="submit" className="btn btn-secondary-custom w-100 py-2" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</> : <><i className="fas fa-paper-plane me-2" />Send Reset Link</>}
                </button>
              </form>
            )}
            <div className="mt-3"><Link to="/" style={{ fontSize: 13, color: '#00A5C4' }}><i className="fas fa-arrow-left me-1" />Back to Home</Link></div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
