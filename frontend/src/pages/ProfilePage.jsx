import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth }     from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { imgUrl }      from '../utils/imageUrl';
import api from '../api/axios';
import toast from 'react-hot-toast';
import usePageTitle from '../hooks/usePageTitle';

export default function ProfilePage() {
  usePageTitle('My Profile');
  const { user, setUser } = useAuth();
  const { currency, switchCurrency } = useCurrency();
  const [tab, setTab] = useState('info');

  // Info form
  const [info, setInfo] = useState({ firstName: user?.firstName||'', lastName: user?.lastName||'', email: user?.email||'', phone: user?.phone||'' });
  // Address form
  const [addr, setAddr] = useState({ defaultAddress: user?.defaultAddress||'', defaultCity: user?.defaultCity||'' });
  // Password form
  const [pw, setPw] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [showPw, setShowPw] = useState({ cur:false, new:false, con:false });
  const [saving, setSaving] = useState(false);

  async function saveInfo(e) {
    e.preventDefault(); setSaving(true);
    try {
      const r = await api.put('/users/profile', info);
      setUser(r.data.user); toast.success(r.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    finally { setSaving(false); }
  }

  async function saveAddr(e) {
    e.preventDefault(); setSaving(true);
    try {
      const r = await api.put('/users/profile', { ...info, ...addr });
      setUser(r.data.user); toast.success('Address saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) { toast.error('Passwords do not match.'); return; }
    setSaving(true);
    try {
      const r = await api.put('/users/password', pw);
      toast.success(r.data.message); setPw({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  }

  async function saveSettings(e) {
    e.preventDefault(); setSaving(true);
    try {
      const cur = e.target.currency?.value || 'USD';
      const newsletter = e.target.newsletter?.checked || false;
      switchCurrency(cur);
      const r = await api.put('/users/settings', { currency: cur, newsletterSubscribed: newsletter });
      setUser(r.data.user); toast.success('Settings saved!');
    } catch (err) { toast.error('Failed.'); }
    finally { setSaving(false); }
  }

  async function uploadAvatar(e) {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('avatar', file);
    try {
      const r = await api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser(u => ({ ...u, avatar: r.data.avatar })); toast.success('Avatar updated!');
    } catch { toast.error('Upload failed.'); }
  }

  async function deleteAccount(e) {
    e.preventDefault();
    const password = e.target.password.value;
    if (!password) { toast.error('Enter your password.'); return; }
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      await api.delete('/users/account', { data: { password } });
      toast.success('Account deleted.');
      window.location.href = '/';
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  }

  const initials = ((user?.firstName||'')[0]+(user?.lastName||user?.firstName||'')[0] || 'U').toUpperCase();
  const avatarSrc = user?.avatar;

  const TABS = [['info','fas fa-user','Personal Info'],['address','fas fa-map-marker-alt','Address'],['password','fas fa-lock','Password'],['settings','fas fa-cog','Settings'],['danger','fas fa-exclamation-triangle text-danger','Account']];

  return (
    <Layout>
      <section className="py-5" style={{ background: '#f8f9fa', minHeight: '80vh' }}>
        <div className="container">
          <div className="row g-4">
            {/* Left */}
            <div className="col-lg-3">
              <div className="bg-white rounded-3 shadow-sm p-4 text-center mb-4">
                <div className="position-relative d-inline-block mb-3">
                  {avatarSrc ? (
                    <img src={imgUrl(avatarSrc)} id="avatarPreview" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #00A5C4' }} alt="Avatar" />
                  ) : (
                    <div className="profile-avatar mx-auto">{initials}</div>
                  )}
                  <label htmlFor="avatarInput" style={{ position: 'absolute', bottom: 0, right: 0, background: '#00A5C4', color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11 }} title="Change photo">
                    <i className="fas fa-camera" />
                  </label>
                </div>
                <input type="file" id="avatarInput" accept="image/*" className="d-none" onChange={uploadAvatar} />
                <h5 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, marginBottom: 2 }}>{user?.firstName} {user?.lastName}</h5>
                <p className="text-muted mb-2" style={{ fontSize: 13 }}>{user?.email}</p>
                <span className={`badge bg-${user?.role === 'superadmin' || user?.role === 'admin' ? 'danger' : user?.role === 'seller' ? 'success' : 'primary'} px-3 py-1`} style={{ fontSize: 11, borderRadius: 20 }}>
                  {user?.role === 'superadmin' ? 'Super Admin' : user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
                <hr />
                <p className="text-muted mb-0" style={{ fontSize: 11 }}><i className="fas fa-calendar me-1" />Member since {user?.registerDate ? new Date(user.registerDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</p>
              </div>
              <div className="bg-white rounded-3 shadow-sm p-3">
                <h6 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 600, color: 'var(--primary)', marginBottom: 14 }}><i className="fas fa-chart-bar me-2" />Quick Links</h6>
                <Link to="/orders" className="btn btn-outline-primary w-100 btn-sm mb-2"><i className="fas fa-box me-1" />View My Orders</Link>
                <Link to="/wishlist" className="btn btn-outline-danger w-100 btn-sm"><i className="fas fa-heart me-1" />View Wishlist</Link>
              </div>
            </div>

            {/* Right */}
            <div className="col-lg-9">
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <ul className="nav profile-tabs mb-4 flex-nowrap" style={{ minWidth: 'max-content' }}>
                  {TABS.map(([id, icon, label]) => (
                    <li key={id} className="nav-item">
                      <button className={`nav-link${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
                        <i className={`${icon} me-2`} />{label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Personal Info */}
              {tab === 'info' && (
                <div className="bg-white rounded-3 shadow-sm p-4">
                  <h5 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 600, color: 'var(--primary)', marginBottom: 20 }}><i className="fas fa-user-edit me-2" />Edit Personal Information</h5>
                  <form onSubmit={saveInfo}>
                    <div className="row g-3">
                      <div className="col-md-6"><label className="form-label profile-label">First Name *</label><input type="text" className="form-control profile-input" value={info.firstName} onChange={e => setInfo(i=>({...i,firstName:e.target.value}))} required /></div>
                      <div className="col-md-6"><label className="form-label profile-label">Last Name</label><input type="text" className="form-control profile-input" value={info.lastName} onChange={e => setInfo(i=>({...i,lastName:e.target.value}))} /></div>
                      <div className="col-md-6"><label className="form-label profile-label">Email *</label><input type="email" className="form-control profile-input" value={info.email} onChange={e => setInfo(i=>({...i,email:e.target.value}))} required /></div>
                      <div className="col-md-6"><label className="form-label profile-label">Phone</label><input type="text" className="form-control profile-input" value={info.phone} onChange={e => setInfo(i=>({...i,phone:e.target.value}))} /></div>
                      <div className="col-12"><button type="submit" className="btn btn-primary-custom px-5" disabled={saving}>{saving ? 'Saving...' : <><i className="fas fa-save me-2" />Save Changes</>}</button></div>
                    </div>
                  </form>
                </div>
              )}

              {/* Address */}
              {tab === 'address' && (
                <div className="bg-white rounded-3 shadow-sm p-4">
                  <h5 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}><i className="fas fa-map-marker-alt me-2" />Default Delivery Address</h5>
                  <p className="text-muted mb-4" style={{ fontSize: 13 }}>This address will be pre-filled at checkout.</p>
                  <form onSubmit={saveAddr}>
                    <div className="row g-3">
                      <div className="col-12"><label className="form-label profile-label">Street Address</label><input type="text" className="form-control profile-input" value={addr.defaultAddress} onChange={e => setAddr(a=>({...a,defaultAddress:e.target.value}))} placeholder="e.g. Bole, near Edna Mall" /></div>
                      <div className="col-md-6"><label className="form-label profile-label">City</label><input type="text" className="form-control profile-input" value={addr.defaultCity} onChange={e => setAddr(a=>({...a,defaultCity:e.target.value}))} placeholder="e.g. Addis Ababa" /></div>
                      <div className="col-12"><button type="submit" className="btn btn-primary-custom px-5" disabled={saving}>{saving ? 'Saving...' : <><i className="fas fa-save me-2" />Save Address</>}</button></div>
                    </div>
                  </form>
                </div>
              )}

              {/* Password */}
              {tab === 'password' && (
                <div className="bg-white rounded-3 shadow-sm p-4">
                  <h5 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 600, color: 'var(--primary)', marginBottom: 20 }}><i className="fas fa-key me-2" />Change Password</h5>
                  <form onSubmit={changePassword} style={{ maxWidth: 480 }}>
                    {[['currentPassword','Current Password','cur'],['newPassword','New Password','new'],['confirmPassword','Confirm New Password','con']].map(([field, label, key]) => (
                      <div key={field} className="mb-3">
                        <label className="form-label profile-label">{label} *</label>
                        <div className="position-relative">
                          <input type={showPw[key] ? 'text' : 'password'} className="form-control profile-input" value={pw[field]} onChange={e => setPw(p=>({...p,[field]:e.target.value}))} placeholder={label} required />
                          <button type="button" className="pw-eye-btn" onClick={() => setShowPw(s=>({...s,[key]:!s[key]}))}><i className={`fas ${showPw[key]?'fa-eye-slash':'fa-eye'}`} /></button>
                        </div>
                      </div>
                    ))}
                    <button type="submit" className="btn btn-secondary-custom px-5" disabled={saving}>{saving ? 'Updating...' : <><i className="fas fa-lock me-2" />Update Password</>}</button>
                  </form>
                </div>
              )}

              {/* Settings */}
              {tab === 'settings' && (
                <div className="bg-white rounded-3 shadow-sm p-4">
                  <h5 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 600, color: 'var(--primary)', marginBottom: 20 }}><i className="fas fa-cog me-2" />Account Settings</h5>
                  <form onSubmit={saveSettings}>
                    <div className="mb-4 pb-4 border-bottom">
                      <h6 className="fw-bold mb-3" style={{ fontSize: 14 }}><i className="fas fa-exchange-alt me-2 text-primary" />Currency Preference</h6>
                      <div className="d-flex gap-3">
                        {['USD','ETB'].map(cur => (
                          <label key={cur} className="d-flex align-items-center gap-2 p-3 rounded-2 border" style={{ cursor: 'pointer', minWidth: 130, borderColor: currency === cur ? '#00A5C4' : '#dee2e6', background: currency === cur ? '#f0fbff' : '#fff' }}>
                            <input type="radio" name="currency" value={cur} defaultChecked={currency === cur} style={{ accentColor: '#00A5C4' }} />
                            <div><div className="fw-bold" style={{ fontSize: 14 }}>{cur}</div><div className="text-muted" style={{ fontSize: 11 }}>{cur === 'USD' ? 'US Dollar' : 'Ethiopian Birr'}</div></div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4 pb-4 border-bottom">
                      <h6 className="fw-bold mb-3" style={{ fontSize: 14 }}><i className="fas fa-envelope-open-text me-2 text-primary" />Newsletter</h6>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" name="newsletter" id="newsletterToggle" defaultChecked={user?.newsletterSubscribed} style={{ width: 44, height: 22, cursor: 'pointer', accentColor: '#00A5C4' }} />
                        <label className="form-check-label ms-2" htmlFor="newsletterToggle" style={{ fontSize: 13, fontWeight: 600 }}>Subscribe to latest deals</label>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary-custom px-5" disabled={saving}>{saving ? 'Saving...' : <><i className="fas fa-save me-2" />Save Settings</>}</button>
                  </form>
                </div>
              )}

              {/* Danger Zone */}
              {tab === 'danger' && (
                <div className="bg-white rounded-3 shadow-sm p-4">
                  <h5 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 600, color: '#dc3545', marginBottom: 20 }}><i className="fas fa-exclamation-triangle me-2" />Danger Zone</h5>
                  <div className="p-4 rounded-3" style={{ background: '#fff5f5', border: '1.5px solid #f5c6cb' }}>
                    <h6 className="fw-bold text-danger mb-2">Delete Account</h6>
                    <p className="text-muted mb-3" style={{ fontSize: 13 }}>This will permanently delete your account, orders history, and all data. This cannot be undone.</p>
                    <form onSubmit={deleteAccount}>
                      <div className="mb-3" style={{ maxWidth: 360 }}>
                        <label className="form-label profile-label">Confirm your password</label>
                        <input type="password" name="password" className="form-control profile-input" placeholder="Enter your password to confirm" required />
                      </div>
                      <button type="submit" className="btn btn-danger px-4"><i className="fas fa-trash me-2" />Delete My Account</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
