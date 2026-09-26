import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STEP = { EMAIL: 'email', CREDS: 'creds', FORGOT: 'forgot' };

export default function AuthModal({ show, onHide }) {
  const { login, register } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [step,     setStep]     = useState(STEP.EMAIL);
  const [mode,     setMode]     = useState('login'); // 'login' | 'register'
  const [email,    setEmail]    = useState('');
  const [alert,    setAlert]    = useState({ msg: '', type: '' });
  const [loading,  setLoading]  = useState(false);
  // login fields
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  // register fields
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [regPw,     setRegPw]     = useState('');
  const [regPw2,    setRegPw2]    = useState('');
  const [agreed,    setAgreed]    = useState(false);
  const [pwStr,     setPwStr]     = useState({ pct: 0, color: '#eee', label: '' });
  // forgot
  const [forgotEmail, setForgotEmail] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (show) { reset(); }
  }, [show]);

  function reset() {
    setStep(STEP.EMAIL); setMode('login'); setEmail(''); setAlert({ msg: '', type: '' });
    setPassword(''); setFirstName(''); setLastName(''); setPhone('');
    setRegPw(''); setRegPw2(''); setAgreed(false); setForgotEmail(''); setLoading(false);
  }

  function showAlert(msg, type = 'error') { setAlert({ msg, type }); }
  function clearAlert() { setAlert({ msg: '', type: '' }); }

  function calcStrength(pw) {
    let s = 0;
    if (pw.length >= 8)           s++;
    if (pw.length >= 12)          s++;
    if (/[A-Z]/.test(pw))         s++;
    if (/[0-9]/.test(pw))         s++;
    if (/[^A-Za-z0-9]/.test(pw))  s++;
    const colors = ['#eee','#dc3545','#fd7e14','#ffc107','#28a745','#20c997'];
    const labels = ['','Weak','Fair','Good','Strong','Very Strong'];
    setPwStr({ pct: s > 0 ? (s / 5) * 100 : 0, color: colors[s], label: labels[s] });
  }

  async function handleContinue() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showAlert('Please enter a valid email address.'); return;
    }
    clearAlert(); setLoading(true);
    try {
      const r = await api.post('/auth/check-email', { email: email.trim() });
      setMode(r.data.exists ? 'login' : 'register');
      setStep(STEP.CREDS);
    } catch { setMode('login'); setStep(STEP.CREDS); }
    finally { setLoading(false); }
  }

  async function handleLogin() {
    if (!password) { showAlert('Please enter your password.'); return; }
    clearAlert(); setLoading(true);
    try {
      const r = await login(email.trim(), password);
      if (r.success) {
        toast.success(r.message);
        onHide();
        // Redirect back to the page that required login (e.g. /admin)
        const from = location.state?.from?.pathname;
        if (from && from !== '/') navigate(from, { replace: true });
      }
      else showAlert(r.message);
    } catch (err) { showAlert(err.response?.data?.message || 'Login failed.'); }
    finally { setLoading(false); }
  }

  async function handleRegister() {
    if (!firstName.trim())        { showAlert('First name is required.'); return; }
    if (regPw.length < 8)         { showAlert('Password must be at least 8 characters.'); return; }
    if (regPw !== regPw2)         { showAlert('Passwords do not match.'); return; }
    if (!agreed)                  { showAlert('Please agree to the Terms of Service.'); return; }
    clearAlert(); setLoading(true);
    try {
      const r = await register({ firstName, lastName, email: email.trim(), password: regPw, phone });
      if (r.success) { toast.success(r.message); onHide(); }
      else showAlert(r.message);
    } catch (err) { showAlert(err.response?.data?.message || 'Registration failed.'); }
    finally { setLoading(false); }
  }

  async function handleForgot() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      showAlert('Please enter a valid email.'); return;
    }
    clearAlert(); setLoading(true);
    try {
      const r = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      showAlert(r.data.message, 'success');
    } catch (err) { showAlert(err.response?.data?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => e.target === e.currentTarget && onHide()}>
      <div className="modal-dialog modal-dialog-centered auth-modal-dialog">
        <div className="modal-content auth-modal-content">
          <button type="button" className="auth-close-btn" onClick={onHide}><i className="fas fa-times" /></button>
          <div className="modal-body auth-modal-body">

            {/* Header */}
            <div className="text-center mb-4">
              <div className="auth-shield-icon mb-3"><i className="fas fa-shield-alt" /></div>
              <h4 className="auth-title">
                {step === STEP.FORGOT ? 'Reset Password' : mode === 'register' && step === STEP.CREDS ? 'Create Account' : step === STEP.CREDS ? 'Welcome back!' : 'Register / Sign in'}
              </h4>
              <p className="auth-subtitle"><i className="fas fa-check-circle text-success me-1" />Your information is protected</p>
            </div>

            {/* Alert */}
            {alert.msg && <div className={`auth-alert ${alert.type}`}>{alert.msg}</div>}

            {/* ── Step 1: Email ── */}
            {step === STEP.EMAIL && (
              <>
                <div className="auth-input-group mb-3">
                  <input type="email" className="auth-input" placeholder="Enter your email" value={email}
                    onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleContinue()} autoFocus />
                </div>
                <button className="auth-continue-btn w-100 mb-2" onClick={handleContinue} disabled={loading}>
                  {loading ? <><span className="auth-spinner" />Please wait...</> : 'Continue'}
                </button>
                <div className="text-center d-flex justify-content-center gap-3" style={{ fontSize: 13 }}>
                  <button className="auth-trouble-link border-0 bg-transparent" onClick={() => { setMode('register'); setStep(STEP.CREDS); }}>New customer? Register</button>
                  <span style={{ color: '#ccc' }}>|</span>
                  <button className="auth-trouble-link border-0 bg-transparent" onClick={() => { setForgotEmail(email); setStep(STEP.FORGOT); clearAlert(); }}>Forgot password?</button>
                </div>
                <div className="auth-divider my-3">Or continue with</div>
                <div className="auth-social-grid">
                  {['Google','Facebook','Apple','X'].map(s => (
                    <button key={s} className="auth-social-btn" title={s} onClick={() => showAlert(`${s} sign-in coming soon! Please use email for now.`)}>
                      <i className={s === 'Google' ? 'fab fa-google' : s === 'Facebook' ? 'fab fa-facebook-f' : s === 'Apple' ? 'fab fa-apple' : 'fab fa-x-twitter'} style={{ fontSize: 18 }} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── Step 2: Login ── */}
            {step === STEP.CREDS && mode === 'login' && (
              <>
                <p className="auth-step-label text-center mb-3">Sign in as <strong>{email}</strong> <button className="auth-change-link border-0 bg-transparent ms-1" onClick={() => { setStep(STEP.EMAIL); clearAlert(); }}>Change</button></p>
                <div className="auth-input-group mb-3">
                  <input type={showPw ? 'text' : 'password'} className="auth-input" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPw(v => !v)}><i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} /></button>
                </div>
                <div className="d-flex justify-content-between mb-3" style={{ fontSize: 13 }}>
                  <span />
                  <button className="auth-trouble-link border-0 bg-transparent" onClick={() => { setForgotEmail(email); setStep(STEP.FORGOT); clearAlert(); }}>Forgot password?</button>
                </div>
                <button className="auth-continue-btn w-100 mb-2" onClick={handleLogin} disabled={loading}>
                  {loading ? <><span className="auth-spinner" />Please wait...</> : 'Sign In'}
                </button>
                <div className="text-center mt-2"><button className="auth-trouble-link border-0 bg-transparent" onClick={() => { setMode('register'); clearAlert(); }}>New here? Create account</button></div>
              </>
            )}

            {/* ── Step 2: Register ── */}
            {step === STEP.CREDS && mode === 'register' && (
              <>
                <p className="auth-step-label text-center mb-3">Create account for <strong>{email}</strong> <button className="auth-change-link border-0 bg-transparent ms-1" onClick={() => { setStep(STEP.EMAIL); clearAlert(); }}>Change</button></p>
                <div className="row g-2 mb-2">
                  <div className="col-6"><input type="text" className="auth-input" placeholder="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus /></div>
                  <div className="col-6"><input type="text" className="auth-input" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
                </div>
                <div className="auth-input-group mb-2">
                  <input type="tel" className="auth-input" placeholder="Phone (e.g. +251 9XX XXX XXX)" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="auth-input-group mb-2">
                  <input type="password" className="auth-input" placeholder="Password (min 8 chars)" value={regPw} onChange={e => { setRegPw(e.target.value); calcStrength(e.target.value); }} />
                </div>
                <div className="auth-input-group mb-3">
                  <input type="password" className="auth-input" placeholder="Confirm Password" value={regPw2} onChange={e => setRegPw2(e.target.value)} />
                </div>
                <div className="mb-3">
                  <div style={{ height: 4, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pwStr.pct}%`, background: pwStr.color, transition: 'width 0.3s, background 0.3s', borderRadius: 4 }} />
                  </div>
                  <small style={{ fontSize: 11, color: pwStr.color }}>{pwStr.label}</small>
                </div>
                <div className="mb-3 d-flex align-items-start gap-2" style={{ fontSize: 12 }}>
                  <input type="checkbox" id="agreeTerms" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ accentColor: '#00A5C4', width: 14, height: 14, marginTop: 2, flexShrink: 0 }} />
                  <label htmlFor="agreeTerms" style={{ color: '#555', cursor: 'pointer' }}>
                    I agree to the <a href="/terms" target="_blank" style={{ color: '#00A5C4' }}>Terms</a> and <a href="/privacy" target="_blank" style={{ color: '#00A5C4' }}>Privacy Policy</a>
                  </label>
                </div>
                <button className="auth-continue-btn w-100 mb-2" onClick={handleRegister} disabled={loading}>
                  {loading ? <><span className="auth-spinner" />Please wait...</> : 'Create Account'}
                </button>
                <div className="text-center mt-2"><button className="auth-trouble-link border-0 bg-transparent" onClick={() => { setMode('login'); clearAlert(); }}>Already have an account? Sign in</button></div>
              </>
            )}

            {/* ── Step 3: Forgot Password ── */}
            {step === STEP.FORGOT && (
              <>
                <p className="auth-step-label text-center mb-3">Enter your email and we'll send you a reset link.</p>
                <div className="auth-input-group mb-3">
                  <input type="email" className="auth-input" placeholder="Enter your email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleForgot()} autoFocus />
                </div>
                <button className="auth-continue-btn w-100 mb-2" onClick={handleForgot} disabled={loading}>
                  {loading ? <><span className="auth-spinner" />Sending...</> : <><i className="fas fa-paper-plane me-2" />Send Reset Link</>}
                </button>
                <div className="text-center mt-2">
                  <button className="auth-trouble-link border-0 bg-transparent" onClick={() => { setStep(STEP.CREDS); setMode('login'); clearAlert(); }}>
                    <i className="fas fa-arrow-left me-1" />Back to Sign In
                  </button>
                </div>
              </>
            )}

            <p className="auth-terms text-center mt-3">By continuing, you agree to our <a href="/terms" target="_blank">Terms</a> and <a href="/privacy" target="_blank">Privacy Policy</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
