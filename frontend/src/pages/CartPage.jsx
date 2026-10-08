import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useCart }     from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth }     from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { fillGrid } from '../utils/fillGrid';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { imgUrl } from '../utils/imageUrl';
import usePageTitle from '../hooks/usePageTitle';

export default function CartPage() {
  usePageTitle('Shopping Cart');
  const { cart, cartTotal, updateQty, removeFromCart, fetchCart } = useCart();
  const { formatPrice, currency, switchCurrency } = useCurrency();
  const { isLoggedIn } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [movingToWish, setMovingToWish] = useState({}); // { [productId]: true }

  useEffect(() => {
    if (isLoggedIn) api.get('/wishlist').then(r => setWishlist(r.data.items || [])).catch(() => {});
  }, [isLoggedIn]);

  async function moveToWishlist(productId, itemModel) {
    // Capture item details BEFORE fetchCart clears it from cart state
    const cartItem = (cart.items || []).find(i => i.product === productId);
    setMovingToWish(prev => ({ ...prev, [productId]: true }));
    try {
      await api.post(`/cart/move-to-wishlist/${productId}`, { itemModel });
      await fetchCart();
      // Now add to local wishlist using the details captured above
      if (cartItem) {
        setWishlist(prev => {
          if (prev.some(w => w._id === productId)) return prev;
          return [...prev, {
            _id:   cartItem.product,
            name:  cartItem.name,
            brand: cartItem.brand,
            price: cartItem.price,
            image: cartItem.image,
            stock: cartItem.stock,
          }];
        });
      }
      toast.success('Saved for later!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save for later.');
    } finally {
      setMovingToWish(prev => ({ ...prev, [productId]: false }));
    }
  }

  async function moveToCart(productId) {
    try {
      await api.post(`/wishlist/move-to-cart/${productId}`);
      // Remove locally and refresh cart
      setWishlist(prev => prev.filter(w => w._id !== productId));
      await fetchCart();
      toast.success('Moved to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move to cart.');
    }
  }

  async function removeWish(productId) {
    try {
      await api.delete(`/wishlist/remove/${productId}`);
      setWishlist(prev => prev.filter(w => w._id !== productId));
      toast.success('Removed from wishlist.');
    } catch {
      toast.error('Failed to remove.');
    }
  }

  const items = cart.items || [];

  return (
    <Layout>
      <section className="py-4" style={{ background: '#f8f9fa', minHeight: '80vh' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <h4 className="section-heading mb-0">
              <i className="fas fa-shopping-cart me-2" />Shopping Cart
              {items.length > 0 && <span className="badge bg-secondary ms-2" style={{ fontSize: 14 }}>{items.reduce((s,i)=>s+i.qty,0)} items</span>}
            </h4>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: 13, color: '#666' }}>Currency:</span>
              <button className={`btn btn-sm ${currency==='USD'?'btn-primary':'btn-outline-secondary'}`} onClick={() => switchCurrency('USD')}>USD</button>
              <button className={`btn btn-sm ${currency==='ETB'?'btn-warning text-dark':'btn-outline-secondary'}`} onClick={() => switchCurrency('ETB')}>ETB Birr</button>
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="text-center py-5 bg-white rounded-3 shadow-sm">
              <i className="fas fa-lock fa-3x text-muted mb-3" />
              <h5>Please login to view your cart</h5>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-3 shadow-sm">
              <img src="/assets/blog/empty_cart.png" alt="Empty" style={{ maxWidth: 160 }} className="mb-3" />
              <h5 className="text-muted">Your cart is empty</h5>
              <Link to="/search" className="btn btn-primary-custom mt-2 me-2">Shop Phones</Link>
              <Link to="/accessories" className="btn btn-outline-primary mt-2">Shop Accessories</Link>
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-8">
                <div className="bg-white rounded-3 shadow-sm p-3">
                  {items.map(item => (
                    <div key={item.product} className="cart-item">
                      {/* ── Row 1: image + name/brand/price ── */}
                      <div className="d-flex gap-3 align-items-start">
                        {/* Image — fixed size, never shrinks */}
                        <Link to={`/product/${item.product}`} style={{ flexShrink: 0 }}>
                          <img src={imgUrl(item.image)} alt={item.name}
                            style={{ width: 80, height: 80, objectFit: 'contain', background: '#f8f9fa', borderRadius: 8, padding: 4 }} />
                        </Link>

                        {/* Middle: name + brand + unit price */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link to={`/product/${item.product}`} className="text-dark text-decoration-none">
                            <h6 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 2, lineHeight: 1.3 }}>{item.name}</h6>
                          </Link>
                          {item.brand && <small className="text-muted d-block">by {item.brand}</small>}
                          <div className="text-muted mt-1" style={{ fontSize: 12 }}>Unit: <strong>{formatPrice(item.price)}</strong></div>
                        </div>

                        {/* Price — top right, never wraps */}
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <span className="text-danger fw-bold" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
                            {formatPrice(item.price * item.qty)}
                          </span>
                        </div>
                      </div>

                      {/* ── Row 2: controls (qty + remove + save) ── */}
                      <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                        {/* Qty stepper */}
                        <div className="d-flex align-items-center border rounded overflow-hidden">
                          <button type="button" className="btn btn-sm btn-light border-0"
                            style={{ width: 40, height: 40, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => updateQty(item.product, item.qty - 1, item.itemModel)}
                            aria-label="Decrease quantity">
                            <i className="fas fa-minus" />
                          </button>
                          <span style={{ width: 40, textAlign: 'center', fontWeight: 700, fontSize: 15, lineHeight: '40px' }}>{item.qty}</span>
                          <button type="button" className="btn btn-sm btn-light border-0"
                            style={{ width: 40, height: 40, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => updateQty(item.product, item.qty + 1, item.itemModel)}
                            aria-label="Increase quantity">
                            <i className="fas fa-plus" />
                          </button>
                        </div>

                        {/* Remove */}
                        <button type="button" className="btn btn-sm btn-outline-danger"
                          style={{ minWidth: 40, height: 40 }}
                          onClick={() => removeFromCart(item.product, item.itemModel)}
                          aria-label="Remove item">
                          <i className="fas fa-trash" />
                        </button>

                        {/* Save for Later */}
                        {item.itemModel !== 'Accessory' && (
                          <button type="button" className="btn btn-sm btn-outline-secondary"
                            style={{ fontSize: 12, height: 40, display: 'flex', alignItems: 'center', gap: 4 }}
                            disabled={movingToWish[item.product]}
                            onClick={() => moveToWishlist(item.product, item.itemModel)}>
                            {movingToWish[item.product]
                              ? <><span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} /> Saving...</>
                              : <><i className="fas fa-heart me-1 text-danger" /> <span>Save to Wishlist</span></>
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Order summary ── */}
              <div className="col-lg-4">
                <div className="cart-subtotal-box">
                  <h6 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859' }}>Order Summary</h6>
                  <hr />
                  <div className="d-flex justify-content-between mb-2" style={{ fontSize: 14 }}>
                    <span>Items ({items.reduce((s,i)=>s+i.qty,0)})</span>
                    <span className="text-danger fw-bold">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2" style={{ fontSize: 14 }}>
                    <span>Delivery</span><span className="text-success fw-bold">FREE</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between mb-3" style={{ fontSize: 18, fontWeight: 700 }}>
                    <span>Total</span><span className="text-danger">{formatPrice(cartTotal)}</span>
                  </div>
                  <p className="text-success" style={{ fontSize: 12 }}><i className="fas fa-check-circle me-1" />FREE delivery on all orders</p>
                  <p style={{ fontSize: 12, color: '#555', marginBottom: 10 }}><i className="fas fa-tag me-1 text-warning" />Got a promo code? Apply it at checkout.</p>
                  <Link to="/checkout" className="btn btn-secondary-custom w-100 py-3" style={{ fontSize: 16, minHeight: 52 }}>
                    <i className="fas fa-lock me-2" />Proceed to Checkout
                  </Link>
                  <Link to="/search" className="btn btn-outline-secondary w-100 mt-2" style={{ fontSize: 14, minHeight: 48 }}>
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Wishlist */}
          <div className="mt-5" id="wishlist">
            <h5 className="section-heading"><i className="fas fa-heart me-2 text-danger" />Wishlist / Saved for Later <span className="badge bg-danger ms-2">{wishlist.length}</span></h5>
            {!isLoggedIn ? (
              <div className="text-center py-4 bg-white rounded-3 shadow-sm"><i className="fas fa-lock fa-2x text-muted mb-2" /><p className="text-muted mb-0">Please login to view your wishlist</p></div>
            ) : wishlist.length === 0 ? (
              <div className="text-center py-4 bg-white rounded-3 shadow-sm"><i className="fas fa-heart fa-2x text-muted mb-2" /><p className="text-muted mb-0">Your wishlist is empty</p></div>
            ) : (
              <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
                {fillGrid(wishlist, 5).map(w => (
                  <div key={w._fillerId || w._id} className="col">
                    <div className="product-card">
                      <div className="card-img-wrap"><Link to={`/product/${w._id}`}><img src={imgUrl(w.image)} alt={w.name} /></Link></div>
                      <div className="card-body">
                        <div className="card-brand">{w.brand}</div>
                        <div className="card-title">{w.name}</div>
                        <div className="card-price mb-2">{formatPrice(w.price)}</div>
                        <button className="btn-cart mb-1" onClick={() => moveToCart(w._id)}><i className="fas fa-cart-plus me-1" />Move to Cart</button>
                        <button className="btn btn-sm btn-outline-danger w-100 mt-1" onClick={() => removeWish(w._id)}><i className="fas fa-trash me-1" />Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
