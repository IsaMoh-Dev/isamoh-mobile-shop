import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { fillGrid } from '../utils/fillGrid';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { imgUrl } from '../utils/imageUrl';
import usePageTitle from '../hooks/usePageTitle';

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [mainImg,    setMainImg]    = useState('');
  const [rating,     setRating]     = useState(5);
  const [hoverRating,setHoverRating]= useState(0);
  const [comment,    setComment]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inCart,     setInCart]     = useState(false);

  // Set page title once product data loads
  const productName = data?.product?.name || '';
  const productBrand = data?.product?.brand || '';
  usePageTitle(productName ? `${productBrand} ${productName}` : '');

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(r => {
        setData(r.data);
        setMainImg(imgUrl(r.data.product.image));
        if (r.data.userReview) {
          setComment(r.data.userReview.comment);
          setRating(r.data.userReview.rating); // restore saved rating
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddToCart() {
    if (!isLoggedIn) { toast.error('Please login to add to cart.'); return; }
    const r = await addToCart(id);
    if (r.success) setInCart(true);
  }

  async function handleBuyNow() {
    if (!isLoggedIn) { toast.error('Please login first.'); return; }
    await addToCart(id);
    navigate('/checkout');
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Please login to review.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, { rating, comment });
      toast.success('Review submitted!');
      const r = await api.get(`/products/${id}`);
      setData(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally { setSubmitting(false); }
  }

  if (loading) return <Layout><div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}><div className="spinner-border text-primary" /></div></Layout>;
  if (!data)   return <Layout><div className="container py-5 text-center"><h4>Product not found.</h4><Link to="/search" className="btn btn-primary mt-3">Back to Products</Link></div></Layout>;

  const { product, related, reviews, avgRating, userReview } = data;
  const discount = product.oldPrice > 0 ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
  const allImages = [product.image, product.image2, product.image3].filter(Boolean).map(imgUrl);

  const specs = [
    product.processor && { icon: 'fas fa-microchip',   label: 'Processor', value: product.processor },
    product.ram       && { icon: 'fas fa-memory',       label: 'RAM',       value: product.ram },
    product.storage   && { icon: 'fas fa-hdd',          label: 'Storage',   value: product.storage },
    product.display   && { icon: 'fas fa-mobile-alt',   label: 'Display',   value: product.display },
    product.camera    && { icon: 'fas fa-camera',       label: 'Camera',    value: product.camera },
    product.battery   && { icon: 'fas fa-battery-full', label: 'Battery',   value: product.battery },
    product.os        && { icon: 'fab fa-android',      label: 'OS',        value: product.os },
  ].filter(Boolean);

  return (
    <Layout>
      <section id="product-detail" className="py-4" style={{ background: '#f8f9fa' }}>
        <div className="container">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb" style={{ fontSize: 13 }}>
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item"><Link to="/search">Products</Link></li>
              <li className="breadcrumb-item"><Link to={`/search?category=${product.brand}`}>{product.brand}</Link></li>
              <li className="breadcrumb-item active">{product.name}</li>
            </ol>
          </nav>

          <div className="row g-4">
            {/* Image Gallery */}
            <div className="col-lg-5 col-md-6">
              <div className="bg-white rounded-3 p-4 shadow-sm text-center" style={{ position: 'sticky', top: 80 }}>
                {discount > 0 && <span className="badge bg-danger mb-3 px-3 py-2 d-inline-block" style={{ fontSize: 13 }}>{discount}% OFF</span>}
                <img src={imgUrl(mainImg)} alt={product.name} className="img-fluid" style={{ maxHeight: 320, objectFit: 'contain', transition: 'opacity 0.2s' }} />
                {allImages.length > 1 && (
                  <div className="d-flex gap-2 justify-content-center mt-3 flex-wrap">
                    {allImages.map((img, i) => (
                      <img key={i} src={img} alt={`View ${i+1}`} onClick={() => setMainImg(img)}
                        style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 10, border: `2px solid ${mainImg === img ? '#00A5C4' : '#e0e0e0'}`, background: '#f8f9fa', padding: 6, cursor: 'pointer' }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="col-lg-7 col-md-6">
              <div className="bg-white rounded-3 p-4 shadow-sm">
                <p className="mb-1" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#00A5C4', fontWeight: 700 }}>{product.brand}</p>
                <h1 style={{ fontFamily: "'Rubik',sans-serif", fontSize: 22, fontWeight: 700, color: '#003859' }}>{product.name}</h1>

                {/* Rating */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="text-warning" style={{ fontSize: 13 }}>
                    {[1,2,3,4,5].map(i => <i key={i} className={`${i <= avgRating ? 'fas' : i - 0.5 <= avgRating ? 'fas fa-star-half-alt' : 'far'} fa-star`} />)}
                  </div>
                  {reviews.length > 0 && <><span style={{ fontSize: 12, fontWeight: 700 }}>{avgRating}</span><a href="#reviews" style={{ fontSize: 12, color: '#888' }}>({reviews.length} reviews)</a></>}
                  {product.onSale && <span className="badge bg-danger ms-1">ON SALE</span>}
                </div>

                <hr style={{ borderColor: '#f0f0f0' }} />

                {/* Price */}
                <div className="mb-3 d-flex align-items-baseline gap-3 flex-wrap">
                  <span style={{ fontSize: 30, fontWeight: 800, color: '#dc3545', fontFamily: "'Rubik',sans-serif" }}>{formatPrice(product.price)}</span>
                  {product.oldPrice && <><span className="text-muted text-decoration-line-through" style={{ fontSize: 17 }}>{formatPrice(product.oldPrice)}</span>{discount > 0 && <span className="badge bg-danger">Save {discount}%</span>}</>}
                </div>

                <p className="mb-3" style={{ fontSize: 13 }}>
                  {product.stock > 0
                    ? <><span className="text-success fw-bold"><i className="fas fa-check-circle me-1" />In Stock</span> <span className="text-muted ms-1">({product.stock} units)</span></>
                    : <span className="text-danger fw-bold"><i className="fas fa-times-circle me-1" />Out of Stock</span>}
                </p>

                {product.description && (
                  <div style={{ fontFamily: "'Raleway',sans-serif", fontSize: 15, lineHeight: 1.85, color: '#444', background: 'linear-gradient(135deg,#f0f9ff,#fafafa)', borderLeft: '4px solid #00A5C4', borderRadius: '0 10px 10px 0', padding: '16px 20px', margin: '16px 0' }}>
                    {product.description}
                  </div>
                )}

                {specs.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 my-3">
                    {specs.slice(0, 4).map(s => (
                      <span key={s.label} style={{ background: '#f0f9ff', border: '1px solid #bee3f8', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#003859' }}>
                        <i className={`${s.icon} me-1`} style={{ color: '#00A5C4' }} />{s.value}
                      </span>
                    ))}
                  </div>
                )}

                <hr style={{ borderColor: '#f0f0f0' }} />

                {/* Actions */}
                <div className="d-flex gap-3 align-items-center flex-wrap mb-4">
                  {inCart ? (
                    <><button className="btn fw-bold text-white px-4 py-2" style={{ background: '#28a745', border: 'none', borderRadius: 10 }} disabled><i className="fas fa-check me-2" />In Cart</button><Link to="/cart" className="btn btn-outline-primary px-4 py-2">View Cart</Link></>
                  ) : (
                    <><button className="btn px-4 py-2 fw-bold text-white" style={{ background: 'linear-gradient(135deg,#003859,#00A5C4)', border: 'none', borderRadius: 10, fontSize: 15 }} onClick={handleAddToCart}><i className="fas fa-cart-plus me-2" />Add to Cart</button>
                    <button className="btn px-4 py-2 fw-bold" style={{ background: '#FFD289', color: '#003859', border: 'none', borderRadius: 10, fontSize: 15 }} onClick={handleBuyNow}><i className="fas fa-bolt me-2" />Buy Now</button></>
                  )}
                </div>

                {/* Policy badges */}
                <div className="d-flex gap-2 flex-wrap">
                  {[['fas fa-retweet','10 Days Return'],['fas fa-truck','Fast Delivery'],['fas fa-shield-alt','1 Year Warranty'],['fas fa-headset','24/7 Support']].map(([ic, lb]) => (
                    <div key={lb} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 16px', background: '#f8f9fa', borderRadius: 10, border: '1px solid #e9ecef', minWidth: 80, textAlign: 'center' }}>
                      <i className={ic} style={{ fontSize: 20, color: '#00A5C4' }} />
                      <span style={{ fontSize: 11, color: '#666' }}>{lb}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Specs */}
              {specs.length > 0 && (
                <div className="bg-white rounded-3 p-4 shadow-sm mt-4">
                  <div style={{ fontFamily: "'Rubik',sans-serif", fontSize: 16, fontWeight: 700, color: '#003859', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fas fa-list-ul" style={{ color: '#00A5C4' }} /> Full Specifications
                  </div>
                  {specs.map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0', gap: 12 }}>
                      <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#003859,#00A5C4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={s.icon} style={{ color: '#fff', fontSize: 13 }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, width: 90, flexShrink: 0 }}>{s.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#222', fontFamily: "'Rubik',sans-serif" }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-5">
              <h4 className="section-heading">Related Products</h4>
              <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-3">
                {fillGrid(related, 4).map(r => (
                  <div key={r._fillerId || r._id} className="col">
                    <ProductCard product={r} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="mt-5" id="reviews">
            <h4 className="section-heading">Customer Reviews {reviews.length > 0 && <span className="text-muted" style={{ fontSize: 14, fontWeight: 400 }}>{avgRating}/5 · {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>}</h4>
            <div className="row g-4">
              <div className="col-lg-4">
                <div className="bg-white rounded-3 shadow-sm p-4">
                  <h6 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859', marginBottom: 16 }}><i className="fas fa-pen me-2" />{userReview ? 'Update Your Review' : 'Write a Review'}</h6>
                  {isLoggedIn ? (
                    <form onSubmit={submitReview}>
                      <div className="mb-3">
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>Your Rating</label>
                        <div className="d-flex gap-1 mt-1">
                          {[1,2,3,4,5].map(i => (
                            <i key={i} className={`${i <= (hoverRating || rating) ? 'fas' : 'far'} fa-star`}
                              style={{ fontSize: 24, cursor: 'pointer', color: '#ffc107' }}
                              onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(i)} />
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>Comment</label>
                        <textarea className="form-control mt-1" rows="4" placeholder="Share your experience..." value={comment} onChange={e => setComment(e.target.value)} required style={{ border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13 }} />
                      </div>
                      <button type="submit" className="btn w-100 fw-bold text-white" style={{ background: 'linear-gradient(135deg,#003859,#00A5C4)', border: 'none', borderRadius: 8 }} disabled={submitting}>
                        {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</> : <><i className="fas fa-paper-plane me-2" />{userReview ? 'Update Review' : 'Submit Review'}</>}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-3">
                      <i className="fas fa-lock fa-2x text-muted mb-2 d-block" />
                      <p className="text-muted" style={{ fontSize: 13 }}>Please login to leave a review.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-lg-8">
                {reviews.length === 0 ? (
                  <div className="bg-white rounded-3 shadow-sm p-4 text-center text-muted"><i className="fas fa-comment-slash fa-2x mb-2 d-block" />No reviews yet. Be the first!</div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {reviews.map(rv => (
                      <div key={rv._id} className="bg-white rounded-3 shadow-sm p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#003859,#00A5C4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                              {rv.user.firstName[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{rv.user.firstName} {rv.user.lastName}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>{new Date(rv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                          </div>
                          <div className="text-warning" style={{ fontSize: 13 }}>
                            {[1,2,3,4,5].map(i => <i key={i} className={`${i <= rv.rating ? 'fas' : 'far'} fa-star`} />)}
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: '#444', margin: 0, lineHeight: 1.6 }}>{rv.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
