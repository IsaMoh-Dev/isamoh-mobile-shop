import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const EMPTY = { code:'', type:'percent', value:'10', minOrder:'0', maxUses:'100', expiresAt:'', isActive:true };

export default function AdminCoupons() {
  const [coupons,  setCoupons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  function load() { setLoading(true); api.get('/coupons').then(r=>setCoupons(r.data.coupons||[])).catch(()=>{}).finally(()=>setLoading(false)); }
  useEffect(load, []);

  function openAdd()   { setForm(EMPTY); setEditing(null); setShowForm(true); }
  function openEdit(c) { setForm({ code:c.code, type:c.type, value:c.value, minOrder:c.minOrder, maxUses:c.maxUses, expiresAt:c.expiresAt?c.expiresAt.slice(0,10):'', isActive:c.isActive }); setEditing(c._id); setShowForm(true); }
  function setF(k,v)   { setForm(f=>({...f,[k]:v})); }

  async function save(e) {
    e.preventDefault(); setSaving(true);
    try {
      const data = { ...form, value:parseFloat(form.value), minOrder:parseFloat(form.minOrder), maxUses:parseInt(form.maxUses) };
      if (!data.expiresAt) delete data.expiresAt;
      if (editing) await api.put(`/coupons/${editing}`, data);
      else         await api.post('/coupons', data);
      toast.success(editing?'Updated.':'Created.'); setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.message||'Failed.'); }
    finally { setSaving(false); }
  }

  async function remove(id) {
    if (!window.confirm('Delete coupon?')) return;
    try { await api.delete(`/coupons/${id}`); toast.success('Deleted.'); setCoupons(cs=>cs.filter(c=>c._id!==id)); }
    catch { toast.error('Failed.'); }
  }

  return (
    <>
      <div className="admin-topbar">
        <h5 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Coupons ({coupons.length})</h5>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus me-1" />New Coupon</button>
      </div>

      {showForm && (
        <div className="modal fade show d-block" style={{ background:'rgba(0,0,0,0.5)' }} onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header" style={{ background:'#003859', color:'#fff' }}>
                <h5 className="modal-title">{editing?'Edit Coupon':'New Coupon'}</h5>
                <button className="btn-close btn-close-white" onClick={()=>setShowForm(false)} />
              </div>
              <div className="modal-body">
                <form onSubmit={save}>
                  <div className="row g-3">
                    <div className="col-12"><label className="form-label fw-semibold" style={{fontSize:13}}>Code *</label><input className="form-control text-uppercase" value={form.code} onChange={e=>setF('code',e.target.value.toUpperCase())} required /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Type</label>
                      <select className="form-select" value={form.type} onChange={e=>setF('type',e.target.value)}>
                        <option value="percent">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Value</label><input type="number" className="form-control" value={form.value} onChange={e=>setF('value',e.target.value)} min="0" step="0.01" required /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Min. Order ($)</label><input type="number" className="form-control" value={form.minOrder} onChange={e=>setF('minOrder',e.target.value)} min="0" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Max Uses</label><input type="number" className="form-control" value={form.maxUses} onChange={e=>setF('maxUses',e.target.value)} min="1" /></div>
                    <div className="col-12"><label className="form-label fw-semibold" style={{fontSize:13}}>Expires At (optional)</label><input type="date" className="form-control" value={form.expiresAt} onChange={e=>setF('expiresAt',e.target.value)} /></div>
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input type="checkbox" className="form-check-input" id="isActive" checked={form.isActive} onChange={e=>setF('isActive',e.target.checked)} style={{width:44,height:22}} />
                        <label className="form-check-label" htmlFor="isActive">Active</label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 d-flex gap-2">
                    <button type="submit" className="btn btn-primary px-4" disabled={saving}>{saving?'Saving...':editing?'Update':'Create'}</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-table">
        {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : (
          <table className="table mb-0">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Uses</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {coupons.length===0 ? <tr><td colSpan="8" className="text-center text-muted py-4">No coupons.</td></tr> : coupons.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight:700, fontFamily:"'Rubik',sans-serif" }}>{c.code}</td>
                  <td><span className="badge bg-secondary">{c.type}</span></td>
                  <td style={{ fontSize:13 }}>{c.type==='percent'?`${c.value}%`:`$${c.value}`}</td>
                  <td style={{ fontSize:13 }}>{c.minOrder>0?`$${c.minOrder}`:'None'}</td>
                  <td style={{ fontSize:13 }}>{c.usedCount}/{c.maxUses}</td>
                  <td style={{ fontSize:12 }}>{c.expiresAt?new Date(c.expiresAt).toLocaleDateString():'Never'}</td>
                  <td><span className={`badge ${c.isActive?'bg-success':'bg-secondary'}`}>{c.isActive?'Active':'Inactive'}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={()=>openEdit(c)}><i className="fas fa-edit" /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>remove(c._id)}><i className="fas fa-trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
