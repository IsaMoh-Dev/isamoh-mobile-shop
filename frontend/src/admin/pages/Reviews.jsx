import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { imgUrl } from '../../utils/imageUrl';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reviews').then(r => setReviews(r.data.reviews||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  async function remove(id) {
    if (!window.confirm('Delete this review?')) return;
    try { await api.delete(`/reviews/${id}`); toast.success('Deleted.'); setReviews(rs=>rs.filter(r=>r._id!==id)); }
    catch { toast.error('Failed.'); }
  }

  return (
    <>
      <div className="admin-topbar">
        <h5 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Reviews ({reviews.length})</h5>
      </div>
      <div className="admin-table">
        {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : (
          <table className="table mb-0">
            <thead><tr><th>Product</th><th>User</th><th>Rating</th><th>Comment</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {reviews.length===0 ? <tr><td colSpan="6" className="text-center text-muted py-4">No reviews.</td></tr> : reviews.map(r => (
                <tr key={r._id}>
                  <td>
                    {r.product && <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <img src={imgUrl(r.product.image)} style={{ width:36, height:36, objectFit:'contain', background:'#f8f9fa', borderRadius:4 }} alt="" />
                      <span style={{ fontSize:12, fontWeight:600 }}>{r.product.name}</span>
                    </div>}
                  </td>
                  <td style={{ fontSize:13 }}>{r.user?.firstName} {r.user?.lastName}</td>
                  <td>
                    <span className="text-warning" style={{ fontSize:13 }}>
                      {[1,2,3,4,5].map(i=><i key={i} className={`${i<=r.rating?'fas':'far'} fa-star`} />)}
                    </span>
                  </td>
                  <td style={{ fontSize:13, maxWidth:300 }}>{r.comment}</td>
                  <td style={{ fontSize:12 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>remove(r._id)}><i className="fas fa-trash" /></button>
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
