import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth }     from '../context/AuthContext';
import { useCart }     from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useSettings } from '../context/SettingsContext';
import { imgUrl }      from '../utils/imageUrl';
import api from '../api/axios';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, isLoggedIn, canAccessAdmin, isSeller, logout } = useAuth();
  const { cartCount } = useCart();
  const { currency, switchCurrency } = useCurrency();
  const settings = useSettings();

  const [showAuth,  setShowAuth]  = useState(false);
  const [query,     setQuery]     = useState('');
  const [category,  setCategory]  = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [brands,    setBrands]    = useState([]);
  const searchRef = useRef(null);
  const timerRef  = useRef(null);
  const navigate  = useNavigate();
  const location  = useLocation();

  // Load brands for dropdown
  useEffect(() => {
    api.get('/settings/brands').then(r => setBrands(r.data.brands || [])).catch(() => {});
  }, []);

  // Search suggestions
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const r = await api.get(`/products?q=${encodeURIComponent(query)}&limit=6`);
        setSuggestions(r.data.products || []);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = e => { if (!searchRef.current?.contains(e.target)) setSuggestions([]); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Listen for auth:expired event
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [logout]);

  const handleSearch = e => {
    e.preventDefault();
    setSuggestions([]);
    const params = new URLSearchParams();
    if (query)    params.set('q', query);
    if (category) params.set('category', category);
    navigate(`/search?${params.toString()}`);
  };

  const logoSrc = imgUrl(settings.shop_logo || 'assets/logo.svg');
  const isActive = path => location.pathname === path ? 'active' : '';

  return (
    <>
      {/* ── Top Bar ── */}
      <div id="top-bar" className="top-bar">
        <div className="container-fluid px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="top-bar-brand">
              <i className="fas fa-map-marker-alt top-bar-brand-loc-icon" />
              <span className="top-bar-brand-info">Isa and Dagi · Mobile Shop · Merkato, Samson Building, Addis Ababa</span>
            </div>
            <div className="d-flex align-items-center gap-3 top-bar-links">
              {isLoggedIn ? (
                <div className="dropdown">
                  <a href="#" className="top-bar-link dropdown-toggle" data-bs-toggle="dropdown">
                    <i className="fas fa-user-circle me-1" />
                    Hi, <strong>{user.firstName}</strong>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                    {canAccessAdmin && (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/admin">
                            <i className="fas fa-tachometer-alt me-2 text-primary" />
                            {isSeller ? 'Seller Panel' : 'Admin Panel'}
                          </Link>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                      </>
                    )}
                    <li><Link className="dropdown-item" to="/orders"><i className="fas fa-box me-2 text-success" />My Orders</Link></li>
                    <li><Link className="dropdown-item" to="/profile"><i className="fas fa-user-edit me-2 text-primary" />My Profile</Link></li>
                    <li><Link className="dropdown-item" to="/cart"><i className="fas fa-heart me-2 text-danger" />Wishlist</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item text-danger" onClick={logout}><i className="fas fa-sign-out-alt me-2" />Logout</button></li>
                  </ul>
                </div>
              ) : (
                <button className="top-bar-link border-0 bg-transparent" onClick={() => setShowAuth(true)}>
                  <i className="fas fa-user me-1" /> Login / Register
                </button>
              )}
              <Link to="/cart" className="top-bar-link">
                <i className="fas fa-heart me-1" /> Wishlist
              </Link>
              <button
                className="top-bar-link border-0 bg-transparent"
                onClick={() => switchCurrency(currency === 'ETB' ? 'USD' : 'ETB')}
              >
                <i className="fas fa-exchange-alt me-1" />
                {currency === 'ETB' ? 'USD' : 'ETB Birr'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Navbar ── */}
      <nav id="main-nav" className="navbar navbar-expand-lg sticky-top">
        <div className="container-fluid px-4">
          <Link className="navbar-brand nav-logo" to="/">
            <img src={logoSrc} alt="Isa & Dagi" style={{ height: 48, width: 'auto', display: 'block' }} />
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar">
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            {/* Search */}
            <form className="nav-search mx-auto" onSubmit={handleSearch} ref={searchRef}>
              <div className="nav-search-inner" style={{ position: 'relative' }}>
                <select className="nav-search-cat" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">All</option>
                  <optgroup label="── Brands ──">
                    {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </optgroup>
                  <optgroup label="── Type ──">
                    <option value="onsale">On Sale</option>
                    <option value="featured">Featured</option>
                  </optgroup>
                </select>
                <input
                  type="text" className="nav-search-input"
                  placeholder="Search phones, brands..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoComplete="off"
                />
                <button type="submit" className="nav-search-btn"><i className="fas fa-search" /></button>
              </div>
              {suggestions.length > 0 && (
                <ul className="search-suggestions">
                  {suggestions.map(p => (
                    <li key={p._id}>
                      <Link to={`/product/${p._id}`} onClick={() => setSuggestions([])}>
                        <img src={imgUrl(p.image)} alt={p.name} />
                        <span>{p.name}</span>
                        <strong>${parseFloat(p.price).toFixed(2)}</strong>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </form>

            {/* Nav Links */}
            <ul className="navbar-nav ms-3 align-items-lg-center">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/')}`} to="/">Home</Link>
              </li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Brands</a>
                <ul className="dropdown-menu nav-dropdown shadow border-0">
                  {brands.map(b => (
                    <li key={b._id}>
                      <Link className="dropdown-item" to={`/search?category=${encodeURIComponent(b.name)}`}>
                        <i className="fas fa-mobile me-2" />{b.name}
                      </Link>
                    </li>
                  ))}
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/search"><i className="fas fa-th me-2 text-secondary" />All Brands</Link></li>
                </ul>
              </li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Products</a>
                <ul className="dropdown-menu nav-dropdown shadow border-0">
                  <li><Link className="dropdown-item" to="/search"><i className="fas fa-th me-2" />All Products</Link></li>
                  <li><Link className="dropdown-item" to="/search?filter=onsale"><i className="fas fa-tag me-2 text-danger" />On Sale</Link></li>
                  <li><Link className="dropdown-item" to="/search?filter=featured"><i className="fas fa-star me-2 text-warning" />Featured</Link></li>
                </ul>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/search?filter=onsale">
                  <span className="badge bg-danger me-1">SALE</span>On Sale
                </Link>
              </li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Accessories</a>
                <ul className="dropdown-menu nav-dropdown shadow border-0">
                  <li><Link className="dropdown-item" to="/accessories?cat=Cases"><i className="fas fa-shield-alt me-2 text-primary" />Phone Cases</Link></li>
                  <li><Link className="dropdown-item" to="/accessories?cat=Chargers"><i className="fas fa-bolt me-2 text-warning" />Chargers &amp; Cables</Link></li>
                  <li><Link className="dropdown-item" to="/accessories?cat=Earphones"><i className="fas fa-headphones me-2 text-info" />Earphones</Link></li>
                  <li><Link className="dropdown-item" to="/accessories?cat=Powerbanks"><i className="fas fa-battery-full me-2 text-success" />Power Banks</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/accessories"><i className="fas fa-th me-2" />All Accessories</Link></li>
                </ul>
              </li>
              <li className="nav-item"><Link className={`nav-link ${isActive('/blog')}`} to="/blog">Blog</Link></li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">More</a>
                <ul className="dropdown-menu nav-dropdown shadow border-0">
                  <li><Link className="dropdown-item" to="/about"><i className="fas fa-store me-2 text-primary" />About Us</Link></li>
                  <li><Link className="dropdown-item" to="/support"><i className="fas fa-headset me-2 text-success" />Support</Link></li>
                  <li><Link className="dropdown-item" to="/support#faq"><i className="fas fa-question-circle me-2 text-warning" />FAQ</Link></li>
                  <li><Link className="dropdown-item" to="/support#contact"><i className="fas fa-envelope me-2 text-info" />Contact Us</Link></li>
                </ul>
              </li>
            </ul>

            {/* Cart */}
            <Link to="/cart" className="nav-cart-btn ms-3">
              <i className="fas fa-shopping-cart" />
              {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </nav>

      <AuthModal show={showAuth} onHide={() => setShowAuth(false)} />
    </>
  );
}
