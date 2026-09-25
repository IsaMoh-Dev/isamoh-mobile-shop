import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLES = ['customer','seller','admin','superadmin'];
const ROLE_COLORS = { superadmin:'danger', admin:'danger', seller:'success', customer:'primary' };

export default function AdminUsers() {
  const { user: me, isSuperAdmin } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  function load() {
    setLoading(true);
    const p = search ? `?q=${encodeURIComponent(search)}` : '';
    api.get(`/users${p}`).then(r => setUsers(r.data.users||[])).catch(()=>{}).finally(()=>setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  async function changeRole(userId, role) {
    try { await api.put(`/users/${userId}/role`, { role }); toast.success('Role updated.'); setUsers(us => us.map(u => u._id===userId ? {...u,role} : u)); }
    catch (err) { toast.error(err.response?.data?.message||'Failed.'); }
  }

  async function deleteUser(userId) {
    if (!window.confirm('Delete this user?')) return;
    try { await api.delete(`/users/${userId}`); toast.success('User deleted.'); setUsers(us => us.filter(u=>u._id!==userId)); }
    catch { toast.error('Failed.'); }
  }

  return (
    <>
      <div className="admin-topbar">
        <h5 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Users ({users.length})</h5>
        <input className="form-control form-control-sm" style={{ width:240 }} placeholder="Search by name or email..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      <div className="admin-table">
        {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : (
          <table className="table mb-0">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.length===0 ? <tr><td colSpan="6" className="text-center text-muted py-4">No users found.</td></tr> : users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      {u.avatar ? <img src={u.avatar} style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover' }} /> : (
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#003859,#00A5C4)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700 }}>
                          {(u.firstName||'?')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{u.firstName} {u.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:13 }}>{u.email}</td>
                  <td style={{ fontSize:13 }}>{u.phone||'—'}</td>
                  <td>
                    {isSuperAdmin && u._id !== me?._id ? (
                      <select className={`form-select form-select-sm border-0 text-${ROLE_COLORS[u.role]} fw-bold`} style={{ width:'auto', background:'transparent', fontSize:12 }} value={u.role} onChange={e=>changeRole(u._id,e.target.value)}>
                        {ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                      </select>
                    ) : (
                      <span className={`badge bg-${ROLE_COLORS[u.role]}`}>{u.role}</span>
                    )}
                  </td>
                  <td style={{ fontSize:12 }}>{new Date(u.registerDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                  <td>
                    {u._id !== me?._id && (
                      <button className="btn btn-sm btn-outline-danger" onClick={()=>deleteUser(u._id)}><i className="fas fa-trash" /></button>
                    )}
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
