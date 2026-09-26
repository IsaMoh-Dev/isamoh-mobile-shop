import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useCart }     from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth }     from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { imgUrl } from '../utils/imageUrl';
import usePageTitle from '../hooks/usePageTitle';

const PAYMENTS = [
  { value: 'cod',      icon: 'fas fa-money-bill-wave', color: '#28a745', label: 'Cash on Delivery' },
  { value: 'bank',     icon: 'fas fa-university',      color: '#003859', label: 'Bank Transfer' },
  { value: 'telebirr', icon: 'fas fa-mobile-alt',      color: '#00A5C4', label: 'Telebirr' },
  { value: 'cbe',      icon: 'fas fa-credit-card',     color: '#e63946', label: 'CBE Birr' },
];

export default function CheckoutPage() {
  usePageTitle('Checkout');
  const { cart, cartTotal, fetchCart } = useCart();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    email:    user?.email || '',
    phone:    user?.phone || '',
    address:  user?.defaultAddress || '',
    city:     user?.defaultCity    || 'Addis Ababa',
    paymentMethod: 'cod',
  });
  const [couponCode,     setCouponCode]     = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponId,       setCouponId]       = useState('');
  const [couponMsg,      setCouponMsg]      = useState('');
  const [couponMsgColor, setCouponMsgColor] = useState('');
  const [couponApplied,  setCouponApplied]  = useState(false);
  const [placing,        setPlacing]        = useState(false);
  const [orderPlaced,    setOrderPlaced]    = useState(null);
  const [errors,         setErrors]         = useState([]);

  const items      = cart.items || [];
  const grandTotal = cartTotal;
  const finalTotal = Math.max(0, grandTotal - couponDiscount);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function applyCoupon() {
    if (!couponCode) { setCouponMsg('Please enter a coupon code.'); setCouponMsgColor('#dc3545'); return; }
    try {
      const r = await api.post('/coupons/check', { code: couponCode, total: grandTotal });
      if (r.data.success) {
        setCouponDiscount(r.data.discount);
        setCouponId(r.data.couponId);
        setCouponMsg(r.data.message);
        setCouponMsgColor('#28a745');
        setCouponApplied(true);
      } else {
        setCouponMsg(r.data.message); setCouponMsgColor('#dc3545');
      }
    } catch (err) {
      setCouponMsg(err.response?.data?.message || 'Invalid coupon.'); setCouponMsgColor('#dc3545');
    }
  }

  async function placeOrder(e) {
    e.preventDefault();
    const errs = [];
    if (!form.fullName) errs.push('Full name is required.');
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push('Valid email is required.');
    if (!form.phone)   errs.push('Phone number is required.');
    if (!form.address) errs.push('Delivery address is required.');
    if (!form.city)    errs.push('City is required.');
    if (errs.length)   { setErrors(errs); return; }
    setErrors([]); setPlacing(true);
    try {
      const r = await api.post('/orders', { ...form, couponCode, couponId, couponDiscount });
      if (r.data.success) {
        setOrderPlaced(r.data.order);
        await fetchCart();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
    } finally { setPlacing(false); }
  }

  if (items.length === 0 && !orderPlaced) {
    navigate('/cart'); return null;
  }

  return (
    <Layout>
      <section className="checkout-section">
        <div className="container">
          {orderPlaced ? (
            <div className="row justify-content-center">
              <div className="col-lg-6 text-center py-5">
                <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#003859,#00A5C4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <i className="fas fa-check" style={{ fontSize: 36, color: '#fff' }} />
                </div>
                <h3 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859' }}>Order Placed!</h3>
                <p className="text-muted mb-1">Thank you for your order. We'll contact you shortly.</p>
                <p style={{ fontSize: 14, color: '#555' }}>Order ID: <strong>#{orderPlaced._id.slice(-8).toUpperCase()}</strong></p>
                <div className="d-flex gap-3 justify-content-center mt-4 flex-wrap">
                  <Link to="/orders" className="btn btn-primary-custom px-4"><i className="fas fa-box me-2" />View My Orders</Link>
                  <Link to="/" className="btn btn-outline-secondary px-4"><i className="fas fa-home me-2" />Back to Home</Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h4 className="section-heading mb-0"><i className="fas fa-lock me-2" />Checkout</h4>
                <Link to="/cart" className="btn btn-outline-secondary btn-sm"><i className="fas fa-arrow-left me-1" />Back to Cart</Link>
              </div>

              {errors.length > 0 && (
                <div className="alert alert-danger mb-4" style={{ borderRadius: 10 }}>
                  <i className="fas fa-exclamation-circle me-2" />
                  {errors.map((e,i) => <div key={i}>{e}</div>)}
                </div>
              )}

              <div className="row g-4">
                {/* Left */}
                <div className="col-lg-7">
                  <div className="checkout-card mb-4">
                    <h5><i className="fas fa-map-marker-alt me-2 text-danger" />Delivery Information</h5>
                    <form onSubmit={placeOrder} id="checkoutForm">
                      <div className="row g-3">
                        <div className="col-sm-6">
                          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Full Name *</label>
                          <input type="text" className="form-control" value={form.fullName} onChange={e => setField('fullName', e.target.value)} required />
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Email *</label>
                          <input type="email" className="form-control" value={form.email} onChange={e => setField('email', e.target.value)} required />
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Phone *</label>
                          <input type="tel" className="form-control" placeholder="+251 9XX XXX XXX" value={form.phone} onChange={e => setField('phone', e.target.value)} required />
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>City *</label>
                          <input type="text" className="form-control" value={form.city} onChange={e => setField('city', e.target.value)} required />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Delivery Address *</label>
                          <textarea className="form-control" rows="2" placeholder="Street, building, area..." value={form.address} onChange={e => setField('address', e.target.value)} required />
                        </div>
                      </div>

                      <h5 className="mt-4"><i className="fas fa-credit-card me-2 text-primary" />Payment Method</h5>
                      <div className="row g-3">
                        {PAYMENTS.map(p => (
                          <div key={p.value} className="col-6 col-sm-3">
                            <label className={`payment-option${form.paymentMethod === p.value ? ' selected' : ''}`} onClick={() => setField('paymentMethod', p.value)}>
                              <i className={p.icon} style={{ fontSize: 22, color: p.color, display: 'block', marginBottom: 6 }} />
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{p.label}</span>
                            </label>
                          </div>
                        ))}
                      </div>

                      <button type="submit" className="btn btn-secondary-custom w-100 py-3 mt-4" style={{ fontSize: 16 }} disabled={placing}>
                        {placing ? <><span className="spinner-border spinner-border-sm me-2" />Placing Order...</> : <><i className="fas fa-check-circle me-2" />Place Order</>}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right - Order Summary */}
                <div className="col-lg-5">
                  <div className="checkout-card">
                    <h5><i className="fas fa-receipt me-2 text-success" />Order Summary</h5>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {items.map(item => (
                        <div key={item.product} className="d-flex align-items-center gap-3 py-2 border-bottom">
                          <img src={imgUrl(item.image)} alt={item.name} style={{ width: 52, height: 52, objectFit: 'contain', background: '#f8f9fa', borderRadius: 8, padding: 4, flexShrink: 0 }} />
                          <div className="flex-grow-1">
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>Qty: {item.qty} × {formatPrice(item.price)}</div>
                          </div>
                          <div className="text-danger fw-bold" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{formatPrice(item.price * item.qty)}</div>
                        </div>
                      ))}
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between mb-2" style={{ fontSize: 14 }}><span>Subtotal</span><span className="fw-bold">{formatPrice(grandTotal)}</span></div>
                    <div className="d-flex justify-content-between mb-2" style={{ fontSize: 14 }}><span>Delivery</span><span className="text-success fw-bold">FREE</span></div>

                    {/* Coupon */}
                    <div className="mt-3 mb-2">
                      <p style={{ fontSize: 12, color: '#555', marginBottom: 6 }}><i className="fas fa-tag me-1 text-success" />Have a promo code?</p>
                      <div className="input-group" style={{ fontSize: 13 }}>
                        <input type="text" className="form-control" placeholder="Coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && applyCoupon()} style={{ borderRadius: '8px 0 0 8px', fontSize: 13 }} disabled={couponApplied} />
                        <button type="button" className="btn btn-outline-success" onClick={applyCoupon} disabled={couponApplied} style={{ borderRadius: '0 8px 8px 0', fontSize: 13 }}>
                          {couponApplied ? '✓ Applied' : 'Apply'}
                        </button>
                      </div>
                      {couponMsg && <div style={{ fontSize: 12, marginTop: 5, color: couponMsgColor }}>{couponMsg}</div>}
                    </div>

                    {couponDiscount > 0 && (
                      <div className="d-flex justify-content-between mb-2" style={{ fontSize: 14 }}>
                        <span className="text-success"><i className="fas fa-tag me-1" />Discount ({couponCode})</span>
                        <span className="text-success fw-bold">-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}
                    <hr />
                    <div className="d-flex justify-content-between" style={{ fontSize: 18, fontWeight: 700 }}>
                      <span>Total</span><span className="text-danger">{formatPrice(finalTotal)}</span>
                    </div>
                    <div className="mt-3 p-3 rounded-3" style={{ background: '#f0f9ff', border: '1px solid #bee3f8' }}>
                      <p className="mb-1" style={{ fontSize: 12, color: '#003859', fontWeight: 600 }}><i className="fas fa-shield-alt me-1" />Secure Checkout</p>
                      <p className="mb-0" style={{ fontSize: 11, color: '#555' }}>Your order is protected. We'll confirm via phone/Telegram after placing.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
