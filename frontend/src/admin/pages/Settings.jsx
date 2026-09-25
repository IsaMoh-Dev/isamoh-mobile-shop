import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings,  setSettings]  = useState({});
  const [messages,  setMessages]  = useState([]);
  const [brands,    setBrands]    = useState([]);
  const [newBrand,  setNewBrand]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data.settings||{})).catch(()=>{});
    api.get('/settings/messages').then(r => setMessages(r.data.messages||[])).catch(()=>{});
    api.get('/settings/brands').then(r => setBrands(r.data.brands||[])).catch(()=>{});
  }, []);

  function setS(k, v) { setSettings(s => ({ ...s, [k]: v })); }

  async function saveSettings(e) {
    e.preventDefault(); setSaving(true);
    try { await api.put('/settings', settings); toast.success('Settings saved!'); }
    catch { toast.error('Failed to save.'); }
    finally { setSaving(false); }
  }

  async function addBrand(e) {
    e.preventDefault();
    if (!newBrand.trim()) return;
    try { const r = await api.post('/settings/brands', { name: newBrand.trim() }); setBrands(bs=>[...bs,r.data.brand]); setNewBrand(''); toast.success('Brand added.'); }
    catch (err) { toast.error(err.response?.data?.message||'Failed.'); }
  }

  async function deleteBrand(id) {
    if (!window.confirm('Delete brand?')) return;
    try { await api.delete(`/settings/brands/${id}`); setBrands(bs=>bs.filter(b=>b._id!==id)); toast.success('Deleted.'); }
    catch { toast.error('Failed.'); }
  }

  async function markRead(id) {
    try { await api.put(`/settings/messages/${id}/read`); setMessages(ms=>ms.map(m=>m._id===id?{...m,isRead:true}:m)); }
    catch {}
  }

  async function deleteMsg(id) {
    try { await api.delete(`/settings/messages/${id}`); setMessages(ms=>ms.filter(m=>m._id!==id)); toast.success('Deleted.'); }
    catch {}
  }

  const TABS = [['general','fas fa-cog','General'],['shop','fas fa-store','Shop Info'],['delivery','fas fa-truck','Delivery'],['brands','fas fa-mobile-alt','Brands'],['messages','fas fa-envelope','Messages'],['maintenance','fas fa-tools','Maintenance']];

  return (
    <>
      <div className="admin-topbar">
        <h5 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Settings</h5>
        <button className="btn btn-primary btn-sm" onClick={saveSettings} disabled={saving}>{saving?'Saving...':'Save All Settings'}</button>
      </div>

      <div className="bg-white rounded-3 shadow-sm overflow-hidden">
        <div style={{ overflowX:'auto', borderBottom:'1px solid #e0e0e0' }}>
          <ul className="nav flex-nowrap" style={{ minWidth:'max-content', padding:'0 16px' }}>
            {TABS.map(([id,icon,label]) => (
              <li key={id} className="nav-item">
                <button className={`nav-link${activeTab===id?' active fw-bold text-primary border-bottom border-primary border-2':' text-muted'}`} style={{ border:'none',background:'none',padding:'14px 16px',fontSize:13,whiteSpace:'nowrap'}} onClick={()=>setActiveTab(id)}>
                  <i className={`${icon} me-2`}/>{label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4">
          <form onSubmit={saveSettings}>
            {/* General */}
            {activeTab==='general' && (
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Shop Name</label><input className="form-control" value={settings.shop_name||''} onChange={e=>setS('shop_name',e.target.value)} /></div>
                <div className="col-md-3"><label className="form-label fw-semibold" style={{fontSize:13}}>Currency</label>
                  <select className="form-select" value={settings.currency||'USD'} onChange={e=>setS('currency',e.target.value)}>
                    <option value="USD">USD</option><option value="ETB">ETB</option>
                  </select>
                </div>
                <div className="col-md-3"><label className="form-label fw-semibold" style={{fontSize:13}}>USD → Birr Rate</label><input type="number" className="form-control" value={settings.usd_to_birr||'57'} onChange={e=>setS('usd_to_birr',e.target.value)} /></div>
                <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Meta Description</label><textarea className="form-control" rows="2" value={settings.meta_description||''} onChange={e=>setS('meta_description',e.target.value)} /></div>
                <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Meta Keywords</label><textarea className="form-control" rows="2" value={settings.meta_keywords||''} onChange={e=>setS('meta_keywords',e.target.value)} /></div>
                <div className="col-12"><button type="submit" className="btn btn-primary px-4" disabled={saving}>{saving?'Saving...':'Save'}</button></div>
              </div>
            )}

            {/* Shop Info */}
            {activeTab==='shop' && (
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Phone</label><input className="form-control" value={settings.shop_phone||''} onChange={e=>setS('shop_phone',e.target.value)} /></div>
                <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Email</label><input type="email" className="form-control" value={settings.shop_email||''} onChange={e=>setS('shop_email',e.target.value)} /></div>
                <div className="col-12"><label className="form-label fw-semibold" style={{fontSize:13}}>Address</label><input className="form-control" value={settings.shop_address||''} onChange={e=>setS('shop_address',e.target.value)} /></div>
                {[['telegram','Telegram Handle'],['facebook','Facebook Page'],['instagram','Instagram'],['youtube','YouTube Channel'],['tiktok','TikTok'],['twitter','X (Twitter)']].map(([k,l]) => (
                  <div key={k} className="col-md-4"><label className="form-label fw-semibold" style={{fontSize:13}}>{l}</label><input className="form-control" value={settings[k]||''} onChange={e=>setS(k,e.target.value)} /></div>
                ))}
                <div className="col-12"><button type="submit" className="btn btn-primary px-4" disabled={saving}>{saving?'Saving...':'Save'}</button></div>
              </div>
            )}

            {/* Delivery */}
            {activeTab==='delivery' && (
              <div className="row g-3">
                <div className="col-md-4"><label className="form-label fw-semibold" style={{fontSize:13}}>Delivery Fee ($)</label><input type="number" className="form-control" value={settings.delivery_fee||'0'} onChange={e=>setS('delivery_fee',e.target.value)} min="0" /></div>
                <div className="col-md-4"><label className="form-label fw-semibold" style={{fontSize:13}}>Free Delivery Above ($)</label><input type="number" className="form-control" value={settings.free_delivery_above||'0'} onChange={e=>setS('free_delivery_above',e.target.value)} min="0" /></div>
                <div className="col-md-4"><label className="form-label fw-semibold" style={{fontSize:13}}>Min Order ($)</label><input type="number" className="form-control" value={settings.min_order_amount||'0'} onChange={e=>setS('min_order_amount',e.target.value)} min="0" /></div>
                <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Delivery Areas</label><input className="form-control" value={settings.delivery_areas||''} onChange={e=>setS('delivery_areas',e.target.value)} /></div>
                <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Delivery Note</label><input className="form-control" value={settings.delivery_note||''} onChange={e=>setS('delivery_note',e.target.value)} /></div>
                <div className="col-12"><label className="form-label fw-semibold" style={{fontSize:13}}>Order Notification Email</label><input type="email" className="form-control" value={settings.order_notify_email||''} onChange={e=>setS('order_notify_email',e.target.value)} /></div>
                <div className="col-12"><button type="submit" className="btn btn-primary px-4" disabled={saving}>{saving?'Saving...':'Save'}</button></div>
              </div>
            )}

            {/* Maintenance */}
            {activeTab==='maintenance' && (
              <div className="row g-3">
                <div className="col-12">
                  <div className="form-check form-switch mb-3">
                    <input type="checkbox" className="form-check-input" id="maintenance" checked={settings.maintenance_mode==='1'} onChange={e=>setS('maintenance_mode',e.target.checked?'1':'0')} style={{width:44,height:22}} />
                    <label className="form-check-label fw-semibold" htmlFor="maintenance">Enable Maintenance Mode</label>
                  </div>
                  {settings.maintenance_mode==='1' && <div className="alert alert-warning" style={{fontSize:13}}>⚠ Site is in maintenance mode. Only admins can access it.</div>}
                </div>
                <div className="col-12"><label className="form-label fw-semibold" style={{fontSize:13}}>Maintenance Message</label><textarea className="form-control" rows="3" value={settings.maintenance_message||''} onChange={e=>setS('maintenance_message',e.target.value)} /></div>
                <div className="col-12"><button type="submit" className="btn btn-primary px-4" disabled={saving}>{saving?'Saving...':'Save'}</button></div>
              </div>
            )}
          </form>

          {/* Brands */}
          {activeTab==='brands' && (
            <div>
              <form onSubmit={addBrand} className="d-flex gap-2 mb-4">
                <input className="form-control" style={{maxWidth:300}} placeholder="New brand name (e.g. Xiaomi)" value={newBrand} onChange={e=>setNewBrand(e.target.value)} />
                <button type="submit" className="btn btn-primary btn-sm px-4">Add Brand</button>
              </form>
              <div className="d-flex flex-wrap gap-2">
                {brands.map(b => (
                  <div key={b._id} className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill" style={{ background:'#f0f9ff', border:'1.5px solid #bee3f8' }}>
                    <i className="fas fa-mobile me-1 text-primary" style={{fontSize:13}} />
                    <span style={{fontSize:14,fontWeight:600}}>{b.name}</span>
                    <button className="btn btn-sm text-danger p-0 ms-1" onClick={()=>deleteBrand(b._id)} style={{lineHeight:1}}><i className="fas fa-times" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {activeTab==='messages' && (
            <div id="messages">
              {messages.length===0 ? <p className="text-muted text-center py-4">No messages.</p> : (
                <div className="d-flex flex-column gap-3">
                  {messages.map(m => (
                    <div key={m._id} className={`p-3 rounded-3 ${!m.isRead?'border border-primary':'bg-light'}`} style={{border:!m.isRead?'1.5px solid #bee3f8':''}}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          {!m.isRead && <span className="badge bg-danger me-2" style={{fontSize:9}}>NEW</span>}
                          <strong style={{fontSize:14}}>{m.name}</strong>
                          <span style={{fontSize:12,color:'#888',marginLeft:8}}>{m.email}</span>
                          <span className="badge bg-secondary ms-2" style={{fontSize:10}}>{m.subject}</span>
                        </div>
                        <span style={{fontSize:11,color:'#888'}}>{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p style={{fontSize:13,color:'#444',lineHeight:1.6,marginBottom:10}}>{m.message}</p>
                      <div className="d-flex gap-2">
                        {!m.isRead && <button className="btn btn-sm btn-outline-success" onClick={()=>markRead(m._id)}><i className="fas fa-check me-1"/>Mark Read</button>}
                        <a href={`mailto:${m.email}`} className="btn btn-sm btn-outline-primary"><i className="fas fa-reply me-1"/>Reply</a>
                        <button className="btn btn-sm btn-outline-danger" onClick={()=>deleteMsg(m._id)}><i className="fas fa-trash me-1"/>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
