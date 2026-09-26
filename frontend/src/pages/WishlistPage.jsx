import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { fillGrid } from '../utils/fillGrid';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { imgUrl } from '../utils/imageUrl';
import usePageTitle from '../hooks/usePageTitle';

export default function WishlistPage() {
  usePageTitle('My Wishlist');
  const { formatPrice } = useCurrency();
  const { fetchCart } = useCart();
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [movingToCart, setMovingToCart] = useState({}); // { [_id]: true }

  useEffect(() => {
    api.get('/wishlist')
      // Backend returns flat populated objects: [{ _id, name, brand, price, ... }]
      .then(r => setItems(r.data.items || []))
      .catch(() => toast.error('Failed to load wishlist.'))
      .finally(() => setLoading(false));
  }, []);

  async function removeItem(productId) {
    try {
      await api.delete(`/wishlist/${productId}`);
      // items are flat — filter by item._id, not item.product?._id
      setItems(prev => prev.filter(i => i._id !== productId));
      toast.success('Removed from wishlist.');
    } catch {
      toast.error('Failed to remove item.');
    }
  }

  async function moveToCart(productId) {
    setMovingToCart(prev => ({ ...prev, [productId]: true }));
    try {
      // Correct: productId goes in the URL, not the request body
      await api.post(`/wishlist/move-to-cart/${productId}`);
      // Remove from local wishlist state
      setItems(prev => prev.filter(i => i._id !== productId));
      // Sync cart count in navbar / CartContext
      await fetchCart();
      toast.success('Moved to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move to cart.');
    } finally {
      setMovingToCart(prev => ({ ...prev, [productId]: false }));
    }
  }

  return (
    <Layout>
      <section className="py-4" style={{ background: '#f8f9fa', minHeight: '80vh' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <h4 className="section-heading mb-0">
              <i className="fas fa-heart me-2 text-danger" />My Wishlist
              {items.length > 0 && (
                <span className="badge bg-danger ms-2" style={{ fontSize: 13 }}>{items.length}</span>
              )}
            </h4>
            <div className="d-flex gap-2">
              <Link to="/cart" className="btn btn-outline-secondary btn-sm">
                <i className="fas fa-shopping-cart me-1" />View Cart
              </Link>
              <Link to="/search" className="btn btn-outline-primary btn-sm">
                <i className="fas fa-shopping-bag me-1" />Continue Shopping
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-3 shadow-sm">
              <i className="fas fa-heart-broken fa-3x text-muted mb-3 d-block" />
              <h5 className="text-muted">Your wishlist is empty</h5>
              <p className="text-muted small">Browse products and click the heart icon to save them here.</p>
              <Link to="/search" className="btn btn-primary-custom mt-2">
                <i className="fas fa-search me-1" />Browse Products
              </Link>
            </div>
          ) : (
            <div className="row g-3">
              {fillGrid(items, 3).map(p => (
                // p is a flat populated product object: { _id, name, brand, price, image, stock, onSale, ... }
                <div key={p._fillerId || p._id} className="col-12 col-sm-6 col-lg-4">
                  <div className="bg-white rounded-3 shadow-sm h-100 overflow-hidden" style={{ border: '1px solid #eee' }}>

                    {/* Product image */}
                    <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: '#f9f9f9' }}>
                      <Link to={`/product/${p._id}`}>
                        <img
                          src={imgUrl(p.image)}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }}
                        />
                      </Link>
                      {p.onSale && (
                        <span className="badge bg-danger" style={{ position: 'absolute', top: 10, left: 10, fontSize: 11 }}>
                          SALE
                        </span>
                      )}
                      {/* Remove button */}
                      <button
                        className="btn btn-sm btn-light"
                        style={{
                          position: 'absolute', top: 8, right: 8, borderRadius: '50%',
                          width: 32, height: 32, padding: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                        }}
                        onClick={() => removeItem(p._id)}
                        aria-label="Remove from wishlist"
                        title="Remove from wishlist"
                      >
                        <i className="fas fa-times text-danger" style={{ fontSize: 12 }} />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{p.brand}</div>
                      <Link to={`/product/${p._id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', marginBottom: 6, lineHeight: 1.4 }}>
                          {p.name}
                        </div>
                      </Link>
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <span style={{ fontWeight: 800, fontSize: 17, color: '#dc3545', fontFamily: "'Rubik', sans-serif" }}>
                          {formatPrice(p.price)}
                        </span>
                        {p.oldPrice > p.price && (
                          <span style={{ fontSize: 12, color: '#aaa', textDecoration: 'line-through' }}>
                            {formatPrice(p.oldPrice)}
                          </span>
                        )}
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary-custom btn-sm flex-grow-1"
                          disabled={p.stock <= 0 || movingToCart[p._id]}
                          onClick={() => moveToCart(p._id)}
                          style={{ fontSize: 12 }}
                        >
                          {movingToCart[p._id] ? (
                            <><span className="spinner-border spinner-border-sm me-1" style={{ width: 11, height: 11 }} />Moving...</>
                          ) : (
                            <><i className="fas fa-cart-plus me-1" />{p.stock > 0 ? 'Move to Cart' : 'Out of Stock'}</>
                          )}
                        </button>
                        <Link to={`/product/${p._id}`} className="btn btn-outline-secondary btn-sm" style={{ fontSize: 12 }}>
                          <i className="fas fa-eye" />
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
