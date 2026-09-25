import { useState, useEffect } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUSES = ['pending','processing','shipped','delivered','cancelled'];
const COLORS   = { pending:'warning', processing:'info', shipped:'primary', delivered:'success', cancelled:'danger' };

export default function AdminOrders() {
  const { formatPrice } = useCurrency();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');
  const [expanded, setExpanded] = useState(null);

  function load() {
    setLoading(true);
    const p = filter ? `?status=${filter}` : '';
    api.get(`/orders${p}`).then(r => setOrders(r.data.orders || [])).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(load, [filter]);

  async function updateStatus(orderId, status) {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Status updated.');
      setOrders(os => os.map(o => o._id === orderId ? { ...o, status } : o));
    } catch { toast.error('Failed to update status.'); }
  }

  return (
    <>
      <div className="admin-topbar">
        <h5 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Orders</h5>
        <div className="d-flex gap-2 flex-wrap">
          <button className={`btn btn-sm ${filter===''?'btn-primary':'btn-outline-secondary'}`} onClick={() => setFilter('')}>All</button>
          {STATUSES.map(s => (
            <button key={s} className={`btn btn-sm ${filter===s?'btn-'+COLORS[s]:'btn-outline-secondary'}`} onClick={() => setFilter(s)}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="admin-table">
        {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div> : (
          <table className="table mb-0">
            <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="8" className="text-center text-muted py-4">No orders found.</td></tr>
              ) : orders.map(o => (
                <>
                  <tr key={o._id} style={{ cursor:'pointer' }} onClick={() => setExpanded(expanded === o._id ? null : o._id)}>
                    <td style={{ fontWeight:600 }}>#{o._id.slice(-8).toUpperCase()}</td>
                    <td>
                      <div style={{ fontSize:13, fontWeight:600 }}>{o.fullName}</div>
                      <div style={{ fontSize:11, color:'#888' }}>{o.email}</div>
                    </td>
                    <td style={{ fontSize:13 }}>{(o.items||[]).length} item(s)</td>
                    <td className="text-danger fw-bold">{formatPrice(o.totalAmount)}</td>
                    <td style={{ textTransform:'uppercase', fontSize:12 }}>{o.paymentMethod}</td>
                    <td>
                      <select className={`form-select form-select-sm border-0 text-${COLORS[o.status]} fw-bold`}
                        style={{ width:'auto', background:'transparent', fontSize:12 }}
                        value={o.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateStatus(o._id, e.target.value)}>
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td style={{ fontSize:12 }}>{new Date(o.orderDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-secondary" onClick={e => { e.stopPropagation(); setExpanded(expanded===o._id?null:o._id); }}>
                        <i className={`fas fa-chevron-${expanded===o._id?'up':'down'}`} />
                      </button>
                    </td>
                  </tr>
                  {expanded === o._id && (
                    <tr key={`${o._id}-detail`}>
                      <td colSpan="8" style={{ background:'#f8f9fa', padding:20 }}>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <strong style={{ fontSize:13 }}>Delivery Details</strong>
                            <p className="mb-1 mt-2" style={{ fontSize:13 }}><i className="fas fa-user me-2" />{o.fullName}</p>
                            <p className="mb-1" style={{ fontSize:13 }}><i className="fas fa-phone me-2" />{o.phone}</p>
                            <p className="mb-1" style={{ fontSize:13 }}><i className="fas fa-envelope me-2" />{o.email}</p>
                            <p className="mb-0" style={{ fontSize:13 }}><i className="fas fa-map-marker-alt me-2" />{o.address}, {o.city}</p>
                          </div>
                          <div className="col-md-6">
                            <strong style={{ fontSize:13 }}>Items</strong>
                            <table className="table table-sm mt-2 mb-0" style={{ fontSize:13 }}>
                              <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
                              <tbody>
                                {(o.items||[]).map((item,i) => (
                                  <tr key={i}>
                                    <td>{item.itemName}</td>
                                    <td>{item.quantity}</td>
                                    <td className="text-danger">{formatPrice(item.itemPrice)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {o.couponDiscount > 0 && <p className="text-success mt-2 mb-0" style={{ fontSize:13 }}><i className="fas fa-tag me-1" />Coupon discount: -{formatPrice(o.couponDiscount)}</p>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
