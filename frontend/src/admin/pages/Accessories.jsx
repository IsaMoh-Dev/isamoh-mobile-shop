import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { imgUrl } from '../../utils/imageUrl';

const EMPTY = { name:'', category:'Cases', price:'', oldPrice:'', description:'', stock:'10', featured:false, onSale:false };
const CATS  = ['Cases','Chargers','Earphones','Powerbanks','Screen Protectors','Other'];

export default function AdminAccessories() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [imgFile,  setImgFile]  = useState(null);
  const [saving,   setSaving]   = useState(false);

  function load() { setLoading(true); api.get('/accessories').then(r => setItems(r.data.accessories||[])).catch(()=>{}).finally(()=>setLoading(false)); }
  useEffect(load, []);

  function openAdd()   { setForm(EMPTY); setEditing(null); setImgFile(null); setShowForm(true); }
  function openEdit(a) { setForm({ name:a.name, category:a.category, price:a.price, oldPrice:a.oldPrice||'', description:a.description||'', stock:a.stock, featured:a.featured, onSale:a.onSale }); setEditing(a._id); setImgFile(null); setShowForm(true); }
  function setF(k,v)   { setForm(f=>({...f,[k]:v})); }

  async function save(e) {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, v);
      });
      if (imgFile) fd.append('image', imgFile);
      if (editing) await api.put(`/accessories/${editing}`, fd);
      else         await api.post('/accessories', fd);
      toast.success(editing ? 'Updated.' : 'Created.');
      setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  }

  async function remove(id) {
    if (!window.confirm('Delete?')) return;
    try { await api.delete(`/accessories/${id}`); toast.success('Deleted.'); setItems(is => is.filter(i => i._id !== id)); }
    catch { toast.error('Failed.'); }
  }

  return (
    <>
      <div className="admin-topbar">
        <h5 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Accessories ({items.length})</h5>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus me-1" />Add Accessory</button>
      </div>

      {showForm && (
        <div className="modal fade show d-block" style={{ background:'rgba(0,0,0,0.5)' }} onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header" style={{ background:'#003859', color:'#fff' }}>
                <h5 className="modal-title">{editing?'Edit Accessory':'Add Accessory'}</h5>
                <button className="btn-close btn-close-white" onClick={()=>setShowForm(false)} />
              </div>
              <div className="modal-body">
                <form onSubmit={save}>
                  <div className="row g-3">
                    <div className="col-12"><label className="form-label fw-semibold" style={{fontSize:13}}>Name *</label><input className="form-control" value={form.name} onChange={e=>setF('name',e.target.value)} required /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Category</label>
                      <select className="form-select" value={form.category} onChange={e=>setF('category',e.target.value)}>
                        {CATS.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3"><label className="form-label fw-semibold" style={{fontSize:13}}>Price ($)*</label><input type="number" className="form-control" value={form.price} onChange={e=>setF('price',e.target.value)} min="0" step="0.01" required /></div>
                    <div className="col-md-3"><label className="form-label fw-semibold" style={{fontSize:13}}>Old Price</label><input type="number" className="form-control" value={form.oldPrice} onChange={e=>setF('oldPrice',e.target.value)} min="0" step="0.01" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{fontSize:13}}>Stock</label><input type="number" className="form-control" value={form.stock} onChange={e=>setF('stock',e.target.value)} min="0" /></div>
                    <div className="col-12"><label className="form-label fw-semibold" style={{fontSize:13}}>Image</label><input type="file" className="form-control" accept="image/*" onChange={e=>setImgFile(e.target.files[0])} /></div>
                    <div className="col-12"><label className="form-label fw-semibold" style={{fontSize:13}}>Description</label><textarea className="form-control" rows="3" value={form.description} onChange={e=>setF('description',e.target.value)} /></div>
                    <div className="col-12 d-flex gap-4">
                      <div className="form-check"><input type="checkbox" className="form-check-input" id="afeat" checked={form.featured} onChange={e=>setF('featured',e.target.checked)} /><label className="form-check-label" htmlFor="afeat">Featured</label></div>
                      <div className="form-check"><input type="checkbox" className="form-check-input" id="asale" checked={form.onSale} onChange={e=>setF('onSale',e.target.checked)} /><label className="form-check-label" htmlFor="asale">On Sale</label></div>
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
            <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
            <tbody>
              {items.length===0 ? <tr><td colSpan="6" className="text-center text-muted py-4">No accessories.</td></tr> : items.map(a => (
                <tr key={a._id}>
                  <td><img src={imgUrl(a.image)} alt={a.name} style={{ width:50, height:50, objectFit:'contain', background:'#f8f9fa', borderRadius:6 }} /></td>
                  <td style={{ fontSize:13, fontWeight:600 }}>{a.name}</td>
                  <td><span className="badge bg-secondary">{a.category}</span></td>
                  <td className="text-danger fw-bold" style={{ fontSize:13 }}>${a.price}</td>
                  <td><span className={`badge ${a.stock<=5?'bg-danger':a.stock<=10?'bg-warning text-dark':'bg-success'}`}>{a.stock}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={()=>openEdit(a)}><i className="fas fa-edit" /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>remove(a._id)}><i className="fas fa-trash" /></button>
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
