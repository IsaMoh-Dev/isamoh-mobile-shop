import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useCurrency } from '../context/CurrencyContext';
import { useCart }     from '../context/CartContext';
import { useAuth }     from '../context/AuthContext';
import { fillGrid }    from '../utils/fillGrid';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { imgUrl } from '../utils/imageUrl';

const CATS = [
  { value: '',           label: 'All Accessories', icon: 'fas fa-th' },
  { value: 'Cases',      label: 'Phone Cases',     icon: 'fas fa-shield-alt text-primary' },
  { value: 'Chargers',   label: 'Chargers',        icon: 'fas fa-bolt text-warning' },
  { value: 'Earphones',  label: 'Earphones',       icon: 'fas fa-headphones text-info' },
  { value: 'Powerbanks', label: 'Power Banks',     icon: 'fas fa-battery-full text-success' },
];

export default function AccessoriesPage() {
  const [params] = useSearchParams();
  const { formatPrice } = useCurrency();
  const { addToCart }   = useCart();
  const { isLoggedIn }  = useAuth();
  const [accessories, setAccessories] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [cat,         setCat]         = useState(params.get('cat') || '');
  const [sort,        setSort]        = useState('');

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (cat)  p.set('cat',  cat);
    if (sort) p.set('sort', sort);
    api.get(`/accessories?${p}`).then(r => setAccessories(r.data.accessories || [])).catch(() => {}).finally(() => setLoading(false));
  }, [cat, sort]);

  async function handleAdd(accId) {
    if (!isLoggedIn) { toast.error('Please login to add to cart.'); return; }
    await addToCart(accId, 'Accessory');
  }

  return (
    <Layout>
      <section className="py-4" style={{ background: '#f8f9fa', minHeight: '80vh' }}>
        <div className="container">
          <h4 className="section-heading"><i className="fas fa-headphones me-2" />Accessories</h4>

          {/* Category tabs */}
          <div className="d-flex gap-2 flex-wrap mb-4">
            {CATS.map(c => (
              <button key={c.value} className={`btn btn-sm ${cat === c.value ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setCat(c.value)}>
                <i className={`${c.icon} me-1`} />{c.label}
              </button>
            ))}
            <div className="ms-auto">
              <select className="form-select form-select-sm" style={{ width: 'auto', fontSize: 12 }} value={sort} onChange={e => setSort(e.target.value)}>
                <option value="">Sort: Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : accessories.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-3 shadow-sm">
              <i className="fas fa-search fa-3x text-muted mb-3 d-block" />
              <h5 className="text-muted">No accessories found</h5>
            </div>
          ) : (
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3">
              {/* Fill last row: 5 cols on lg, cycle items so no blank space */}
              {fillGrid(accessories, 5).map(acc => (
                <div
                  key={acc._fillerId || acc._id}
                  className="col"
                  style={acc._isFiller ? { opacity: 0.55, pointerEvents: 'none' } : undefined}
                  aria-hidden={acc._isFiller ? 'true' : undefined}
                >
                  <div className="product-card">
                    <div className="card-img-wrap">
                      {acc.onSale && <span className="badge-sale">SALE</span>}
                      <img src={imgUrl(acc.image)} alt={acc.name} loading="lazy" />
                    </div>
                    <div className="card-body">
                      <div className="card-brand">{acc.category}</div>
                      <div className="card-title">{acc.name}</div>
                      <div className="card-price-wrap mb-2">
                        <span className="card-price">{formatPrice(acc.price)}</span>
                        {acc.oldPrice && <span className="card-old-price">{formatPrice(acc.oldPrice)}</span>}
                      </div>
                      <button className="btn-cart" onClick={() => handleAdd(acc._id)}>
                        <i className="fas fa-cart-plus me-1" />Add to Cart
                      </button>
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
