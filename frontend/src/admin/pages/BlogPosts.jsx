import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { imgUrl } from '../../utils/imageUrl';

export default function AdminBlog() {
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState({ title:'', content:'' });
  const [imgFile,  setImgFile]  = useState(null);
  const [saving,   setSaving]   = useState(false);

  function load() { setLoading(true); api.get('/blog').then(r=>setPosts(r.data.posts||[])).catch(()=>{}).finally(()=>setLoading(false)); }
  useEffect(load, []);

  function openAdd()   { setForm({title:'',content:''}); setEditing(null); setImgFile(null); setShowForm(true); }
  function openEdit(p) { setForm({title:p.title,content:p.content}); setEditing(p._id); setImgFile(null); setShowForm(true); }

  async function save(e) {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title); fd.append('content', form.content);
      if (imgFile) fd.append('image', imgFile);
      if (editing) await api.put(`/blog/${editing}`, fd, { headers:{'Content-Type':'multipart/form-data'} });
      else         await api.post('/blog', fd, { headers:{'Content-Type':'multipart/form-data'} });
      toast.success(editing?'Updated.':'Created.'); setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.message||'Failed.'); }
    finally { setSaving(false); }
  }

  async function remove(id) {
    if (!window.confirm('Delete post?')) return;
    try { await api.delete(`/blog/${id}`); toast.success('Deleted.'); setPosts(ps=>ps.filter(p=>p._id!==id)); }
    catch { toast.error('Failed.'); }
  }

  return (
    <>
      <div className="admin-topbar">
        <h5 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Blog Posts ({posts.length})</h5>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><i className="fas fa-plus me-1" />New Post</button>
      </div>

      {showForm && (
        <div className="modal fade show d-block" style={{ background:'rgba(0,0,0,0.5)' }} onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header" style={{ background:'#003859', color:'#fff' }}>
                <h5 className="modal-title">{editing?'Edit Post':'New Post'}</h5>
                <button className="btn-close btn-close-white" onClick={()=>setShowForm(false)} />
              </div>
              <div className="modal-body">
                <form onSubmit={save}>
                  <div className="mb-3"><label className="form-label fw-semibold" style={{fontSize:13}}>Title *</label><input className="form-control" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required /></div>
                  <div className="mb-3"><label className="form-label fw-semibold" style={{fontSize:13}}>Featured Image</label><input type="file" className="form-control" accept="image/*" onChange={e=>setImgFile(e.target.files[0])} /></div>
                  <div className="mb-3"><label className="form-label fw-semibold" style={{fontSize:13}}>Content *</label><textarea className="form-control" rows="10" value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} required /></div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary px-4" disabled={saving}>{saving?'Saving...':editing?'Update':'Publish'}</button>
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
            <thead><tr><th>Image</th><th>Title</th><th>Published</th><th>Actions</th></tr></thead>
            <tbody>
              {posts.length===0 ? <tr><td colSpan="4" className="text-center text-muted py-4">No posts yet.</td></tr> : posts.map(p => (
                <tr key={p._id}>
                  <td><img src={imgUrl(p.image)} alt={p.title} style={{ width:60, height:45, objectFit:'cover', borderRadius:6 }} /></td>
                  <td style={{ fontSize:13, fontWeight:600 }}>{p.title}</td>
                  <td style={{ fontSize:12 }}>{new Date(p.publishedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={()=>openEdit(p)}><i className="fas fa-edit" /></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>remove(p._id)}><i className="fas fa-trash" /></button>
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
