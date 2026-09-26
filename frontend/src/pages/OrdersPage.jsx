import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { imgUrl } from '../utils/imageUrl';
import usePageTitle from '../hooks/usePageTitle';

const STATUS_CONFIG = {
  pending:    { label:'Pending',    color:'#856404', bg:'#fff3cd', icon:'fa-clock',        step:0 },
  processing: { label:'Processing', color:'#0c5460', bg:'#d1ecf1', icon:'fa-cog',          step:1 },
  shipped:    { label:'Shipped',    color:'#004085', bg:'#cce5ff', icon:'fa-truck',        step:2 },
  delivered:  { label:'Delivered',  color:'#155724', bg:'#d4edda', icon:'fa-check-circle', step:3 },
  cancelled:  { label:'Cancelled',  color:'#721c24', bg:'#f8d7da', icon:'fa-times-circle', step:-1 },
};
const STEPS = ['pending','processing','shipped','delivered'];

export default function OrdersPage() {
  usePageTitle('My Orders');
  const { formatPrice } = useCurrency();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my').then(r => setOrders(r.data.orders || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function cancelOrder(orderId) {
    if (!window.confirm(`Cancel order #${orderId.slice(-8).toUpperCase()}?`)) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled.');
      setOrders(os => os.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel.'); }
  }

  function printInvoice(order) {
    const items = order.items.map(i => `<tr><td style="padding:8px;border:1px solid #ddd">${i.itemName}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${i.quantity}</td><td style="padding:8px;border:1px solid #ddd;text-align:right">$${i.itemPrice.toFixed(2)}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:700">$${(i.itemPrice*i.quantity).toFixed(2)}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>Invoice</title><style>body{font-family:Arial,sans-serif;padding:30px;max-width:700px;margin:0 auto}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#003859;color:#fff;padding:10px;text-align:left}@media print{button{display:none}}</style></head><body><div style="display:flex;justify-content:space-between;margin-bottom:30px"><div><h1 style="color:#003859">Isa Moh Mobile Shop</h1><p style="color:#888;margin:0">Merkato, Samson Building, Addis Ababa</p></div><div style="text-align:right"><h2 style="color:#003859;margin:0">INVOICE</h2><p style="margin:4px 0;font-size:14px">Order #${order._id.slice(-8).toUpperCase()}</p><p style="margin:4px 0;font-size:13px;color:#888">${new Date(order.orderDate).toLocaleDateString()}</p></div></div><hr><div style="display:flex;justify-content:space-between;margin-bottom:20px"><div><strong>Bill To:</strong><br>${order.fullName}<br>${order.email}<br>${order.phone}<br>${order.address}, ${order.city}</div><div style="text-align:right"><strong>Payment:</strong><br>${order.paymentMethod.toUpperCase()}<br><strong>Status:</strong><br>${order.status.toUpperCase()}</div></div><table><thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${items}</tbody><tfoot><tr><td colspan="3" style="padding:10px;border:1px solid #ddd;text-align:right;font-weight:700">TOTAL</td><td style="padding:10px;border:1px solid #ddd;text-align:right;color:#dc3545;font-weight:700">$${order.totalAmount.toFixed(2)}</td></tr></tfoot></table><p style="margin-top:30px;font-size:12px;color:#888;text-align:center">Thank you for shopping with Isa Moh Mobile Shop!</p><div style="text-align:center;margin-top:10px"><button onclick="window.print()" style="background:#003859;color:#fff;border:none;padding:10px 30px;border-radius:8px;cursor:pointer">🖨 Print Invoice</button></div></body></html>`;
    const win = window.open('', '_blank'); win.document.write(html); win.document.close();
  }

  const counts = { total: orders.length, delivered: 0, inProgress: 0 };
  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((s,o) => s + o.totalAmount, 0);
  orders.forEach(o => {
    if (o.status === 'delivered') counts.delivered++;
    if (['pending','processing','shipped'].includes(o.status)) counts.inProgress++;
  });

  return (
    <Layout>
      <section className="py-4" style={{ background: '#f8f9fa', minHeight: '80vh' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <h4 className="section-heading mb-0"><i className="fas fa-box me-2" />My Orders</h4>
            <Link to="/search" className="btn btn-outline-primary btn-sm"><i className="fas fa-shopping-bag me-1" />Continue Shopping</Link>
          </div>

          {loading ? <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          : orders.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-3 shadow-sm">
              <i className="fas fa-box-open fa-3x text-muted mb-3 d-block" />
              <h5 className="text-muted">No orders yet</h5>
              <Link to="/search" className="btn btn-primary-custom mt-2">Shop Now</Link>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="row g-3 mb-4">
                {[['Total Orders', counts.total, '#003859'], ['Delivered', counts.delivered, '#28a745'], ['In Progress', counts.inProgress, '#00A5C4'], ['Total Spent', formatPrice(totalSpent), '#dc3545']].map(([label, val, color]) => (
                  <div key={label} className="col-6 col-md-3">
                    <div className="bg-white rounded-3 shadow-sm p-3 text-center">
                      <div style={{ fontSize: label === 'Total Spent' ? 22 : 24, fontWeight: 700, fontFamily: "'Rubik',sans-serif", color }}>{val}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Cards */}
              {orders.map(order => {
                const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const isCancelled = order.status === 'cancelled';
                const linePct = isCancelled ? '0%' : `${(sc.step / (STEPS.length - 1)) * 100}%`;
                return (
                  <div key={order._id} className="bg-white rounded-3 shadow-sm mb-4 overflow-hidden" style={{ border: '1px solid #eee' }}>
                    {/* Header */}
                    <div style={{ background: 'linear-gradient(135deg,#003859,#005580)', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, fontSize: 16 }}><i className="fas fa-receipt me-2" />Order #{order._id.slice(-8).toUpperCase()}</div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}><i className="fas fa-calendar me-1" />{new Date(order.orderDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color }}>
                          <i className={`fas ${sc.icon}`} />{sc.label}
                        </span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#FFD289' }}>{formatPrice(order.totalAmount)}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    {!isCancelled && (
                      <div style={{ padding: '18px 20px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', marginBottom: 8 }}>
                          <div style={{ position: 'absolute', top: 16, left: 16, right: 16, height: 3, background: '#e9ecef', zIndex: 0 }} />
                          <div style={{ position: 'absolute', top: 16, left: 16, height: 3, background: 'linear-gradient(90deg,#003859,#00A5C4)', zIndex: 1, width: linePct, transition: 'width 0.5s' }} />
                          {STEPS.map((step, i) => {
                            const dotClass = i < sc.step ? 'done' : i === sc.step ? 'active' : 'idle';
                            return (
                              <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                                <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: dotClass === 'done' ? '#003859' : dotClass === 'active' ? '#00A5C4' : '#fff', border: `3px solid ${dotClass === 'idle' ? '#dee2e6' : dotClass === 'done' ? '#003859' : '#00A5C4'}`, color: dotClass === 'idle' ? '#aaa' : '#fff', boxShadow: dotClass === 'active' ? '0 0 0 4px rgba(0,165,196,0.2)' : 'none' }}>
                                  <i className={`fas ${dotClass === 'done' ? 'fa-check' : STATUS_CONFIG[step].icon}`} style={{ fontSize: 12 }} />
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: dotClass === 'done' ? '#003859' : dotClass === 'active' ? '#00A5C4' : '#888', marginTop: 6, textAlign: 'center' }}>{STATUS_CONFIG[step].label}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div style={{ padding: '0 20px 16px' }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{item.itemName}</div>
                            <div style={{ fontSize: 11, color: '#888' }}>Qty: {item.quantity} · {formatPrice(item.itemPrice)} each</div>
                          </div>
                          <div className="text-danger fw-bold" style={{ fontSize: 14 }}>{formatPrice(item.itemPrice * item.quantity)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div style={{ background: '#f8f9fa', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderTop: '1px solid #eee' }}>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        <i className="fas fa-map-marker-alt me-1" />{order.address}, {order.city} · <i className="fas fa-credit-card me-1" />{order.paymentMethod.toUpperCase()}
                      </div>
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div style={{ fontSize: 14, fontWeight: 700 }}>Total: <span className="text-danger">{formatPrice(order.totalAmount)}</span></div>
                        <button type="button" className="btn btn-sm btn-outline-secondary" style={{ fontSize: 12, borderRadius: 20 }} onClick={() => printInvoice(order)}><i className="fas fa-print me-1" />Invoice</button>
                        {['pending','processing'].includes(order.status) && (
                          <button type="button" className="btn btn-sm btn-outline-danger" style={{ fontSize: 12, borderRadius: 20 }} onClick={() => cancelOrder(order._id)}><i className="fas fa-times me-1" />Cancel</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
