import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { imgUrl } from '../../utils/imageUrl';

const EMPTY = { brand:'', name:'', price:'', oldPrice:'', description:'', ram:'', storage:'', display:'', camera:'', battery:'', processor:'', os:'', stock:'10', category:'smartphone', featured:false, onSale:false, image2:'', image3:'' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [imgFile,  setImgFile]  = useState(null);
  const [imgFile2, setImgFile2] = useState(null);
  const [imgFile3, setImgFile3] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');

  function load() {
    setLoading(true);
    api.get('/products?limit=200').then(r => setProducts(r.data.products || [])).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openAdd()     { setForm(EMPTY); setEditing(null); setImgFile(null); setImgFile2(null); setImgFile3(null); setShowForm(true); }
  function openEdit(p)   { setForm({ brand:p.brand, name:p.name, price:p.price, oldPrice:p.oldPrice||'', description:p.description||'', ram:p.ram||'', storage:p.storage||'', display:p.display||'', camera:p.camera||'', battery:p.battery||'', processor:p.processor||'', os:p.os||'', stock:p.stock, category:p.category||'smartphone', featured:p.featured, onSale:p.onSale, image2:p.image2||'', image3:p.image3||'' }); setEditing(p._id); setImgFile(null); setImgFile2(null); setImgFile3(null); setShowForm(true); }
  function setF(k,v)     { setForm(f => ({ ...f, [k]: v })); }

  async function save(e) {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, v);
      });
      if (imgFile)  fd.append('image',  imgFile);
      if (imgFile2) fd.append('image2', imgFile2);
      if (imgFile3) fd.append('image3', imgFile3);
      if (editing) await api.put(`/products/${editing}`, fd);
      else         await api.post('/products', fd);
      toast.success(editing ? 'Product updated.' : 'Product created.');
      setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  }

  async function remove(id) {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Deleted.'); setProducts(ps => ps.filter(p => p._id !== id)); }
    catch { toast.error('Failed to delete.'); }
  }

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="admin-topbar">
        <h5 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Products ({products.length})</h5>
        <div className="d-flex gap-2">
          <input className="form-control form-control-sm" style={{ width:220 }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus me-1" />Add Product</button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal fade show d-block" style={{ background:'rgba(0,0,0,0.5)' }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header" style={{ background:'#003859', color:'#fff' }}>
                <h5 className="modal-title">{editing ? 'Edit Product' : 'Add New Product'}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowForm(false)} />
              </div>
              <div className="modal-body">
                <form onSubmit={save}>
                  <div className="row g-3">
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Brand *</label><input className="form-control" value={form.brand} onChange={e=>setF('brand',e.target.value)} required /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Name *</label><input className="form-control" value={form.name} onChange={e=>setF('name',e.target.value)} required /></div>
                    <div className="col-md-4"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Price ($) *</label><input type="number" className="form-control" value={form.price} onChange={e=>setF('price',e.target.value)} min="0" step="0.01" required /></div>
                    <div className="col-md-4"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Old Price ($)</label><input type="number" className="form-control" value={form.oldPrice} onChange={e=>setF('oldPrice',e.target.value)} min="0" step="0.01" /></div>
                    <div className="col-md-4"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Stock</label><input type="number" className="form-control" value={form.stock} onChange={e=>setF('stock',e.target.value)} min="0" /></div>
                    <div className="col-12"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Main Image</label><input type="file" className="form-control" accept="image/*" onChange={e=>setImgFile(e.target.files[0])} /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Extra Image 2 <span className="text-muted">(optional)</span></label><input type="file" className="form-control" accept="image/*" onChange={e=>setImgFile2(e.target.files[0])} /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Extra Image 3 <span className="text-muted">(optional)</span></label><input type="file" className="form-control" accept="image/*" onChange={e=>setImgFile3(e.target.files[0])} /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{ fontSize:13 }}>RAM</label><input className="form-control" value={form.ram} onChange={e=>setF('ram',e.target.value)} placeholder="e.g. 8GB" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Storage</label><input className="form-control" value={form.storage} onChange={e=>setF('storage',e.target.value)} placeholder="e.g. 128GB" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Display</label><input className="form-control" value={form.display} onChange={e=>setF('display',e.target.value)} placeholder="e.g. 6.5 inch AMOLED" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Camera</label><input className="form-control" value={form.camera} onChange={e=>setF('camera',e.target.value)} placeholder="e.g. 50MP + 12MP" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Battery</label><input className="form-control" value={form.battery} onChange={e=>setF('battery',e.target.value)} placeholder="e.g. 5000mAh" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Processor</label><input className="form-control" value={form.processor} onChange={e=>setF('processor',e.target.value)} placeholder="e.g. Snapdragon 8 Gen 2" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold" style={{ fontSize:13 }}>OS</label><input className="form-control" value={form.os} onChange={e=>setF('os',e.target.value)} placeholder="e.g. Android 14" /></div>
                    <div className="col-12"><label className="form-label fw-semibold" style={{ fontSize:13 }}>Description</label><textarea className="form-control" rows="3" value={form.description} onChange={e=>setF('description',e.target.value)} /></div>
                    <div className="col-12 d-flex gap-4">
                      <div className="form-check"><input type="checkbox" className="form-check-input" id="featured" checked={form.featured} onChange={e=>setF('featured',e.target.checked)} /><label className="form-check-label" htmlFor="featured">Featured</label></div>
                      <div className="form-check"><input type="checkbox" className="form-check-input" id="onSale" checked={form.onSale} onChange={e=>setF('onSale',e.target.checked)} /><label className="form-check-label" htmlFor="onSale">On Sale</label></div>
                    </div>
                  </div>
                  <div className="mt-4 d-flex gap-2">
                    <button type="submit" className="btn btn-primary px-4" disabled={saving}>{saving?'Saving...':editing?'Update':'Create'}</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
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
            <thead><tr><th>Image</th><th>Brand</th><th>Name</th><th>Price</th><th>Stock</th><th>Sale</th><th>Featured</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan="8" className="text-center text-muted py-4">No products found.</td></tr> : (
                filtered.map(p => (
                  <tr key={p._id}>
                    <td><img src={imgUrl(p.image)} alt={p.name} style={{ width:50, height:50, objectFit:'contain', background:'#f8f9fa', borderRadius:6 }} /></td>
                    <td style={{ fontSize:13 }}>{p.brand}</td>
                    <td style={{ fontSize:13, fontWeight:600, maxWidth:200 }}>{p.name}</td>
                    <td style={{ fontSize:13 }} className="text-danger fw-bold">${p.price}</td>
                    <td><span className={`badge ${p.stock<=5?'bg-danger':p.stock<=10?'bg-warning text-dark':'bg-success'}`}>{p.stock}</span></td>
                    <td>{p.onSale   && <span className="badge bg-danger">SALE</span>}</td>
                    <td>{p.featured && <span className="badge bg-warning text-dark">★</span>}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEdit(p)}><i className="fas fa-edit" /></button>
                      <button className="btn btn-sm btn-outline-danger"       onClick={() => remove(p._id)}><i className="fas fa-trash" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
