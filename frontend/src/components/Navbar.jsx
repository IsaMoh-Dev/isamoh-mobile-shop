import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth }     from '../context/AuthContext';
import { useCart }     from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme }    from '../context/ThemeContext';
import { useLang }     from '../context/LanguageContext';
import { imgUrl }      from '../utils/imageUrl';
import api from '../api/axios';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, isLoggedIn, canAccessAdmin, isSeller, logout, setUser } = useAuth();
  const { cartCount }                   = useCart();
  const { currency, switchCurrency }    = useCurrency();
  const settings                        = useSettings();
  const { isDark, toggleTheme }         = useTheme();
  const { lang, setLang, t }            = useLang();

  const [showAuth,    setShowAuth]    = useState(false);
  const [query,       setQuery]       = useState('');
  const [category,    setCategory]    = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [brands,      setBrands]      = useState([]);
  const searchRef    = useRef(null);
  const mobileSearch = useRef(null);
  const timerRef     = useRef(null);
  const navigate     = useNavigate();
  const location     = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('need_login') === '1' && !isLoggedIn) setShowAuth(true);
  }, [location.search, isLoggedIn]);

  useEffect(() => {
    api.get('/settings/brands').then(r => setBrands(r.data.brands || [])).catch(() => {});
  }, []);

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

  useEffect(() => {
    const handler = e => {
      if (!searchRef.current?.contains(e.target) && !mobileSearch.current?.contains(e.target))
        setSuggestions([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [setUser]);

  const handleSearch = e => {
    e.preventDefault();
    setSuggestions([]);
    const params = new URLSearchParams();
    if (query)    params.set('q', query);
    if (category) params.set('category', category);
    navigate(`/search?${params.toString()}`);
  };

  const logoSrc  = imgUrl(settings.shop_logo || 'assets/logo.svg');
  const isActive = path => location.pathname === path ? 'active' : '';

  return (
    <>
      {/* ════════════════════════════════════════
          TOP BAR
          ════════════════════════════════════════ */}
      <div id="top-bar" className="top-bar">
        <div className="container-fluid px-3 px-lg-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="top-bar-brand">
              <i className="fas fa-map-marker-alt top-bar-brand-loc-icon" />
              <span className="top-bar-brand-info">{t('topbar.location')}</span>
            </div>
            <div className="d-flex align-items-center gap-2 topbar-controls">
              <button className="ctrl-pill border-0"
                onClick={() => switchCurrency(currency === 'ETB' ? 'USD' : 'ETB')}
                title="Switch currency">
                <span className="ctrl-pill-icon"><i className="fas fa-exchange-alt" /></span>
                <span>{currency === 'ETB' ? 'USD' : 'ETB'}</span>
              </button>
              <Link to="/wishlist" className="top-bar-link d-none d-md-inline">
                <i className="fas fa-heart me-1" />{t('topbar.wishlist')}
              </Link>
              {isLoggedIn ? (
                <div className="dropdown">
                  <a href="#" className="top-bar-link dropdown-toggle" data-bs-toggle="dropdown" onClick={e => e.preventDefault()}>
                    <i className="fas fa-user-circle me-1" />
                    <span className="d-none d-sm-inline">{t('topbar.hi')} </span>
                    <strong>{user.firstName}</strong>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                    {canAccessAdmin && (<>
                      <li><Link className="dropdown-item" to="/admin">
                        <i className="fas fa-tachometer-alt me-2 text-primary" />
                        {isSeller ? t('user.sellerPanel') : t('user.adminPanel')}
                      </Link></li>
                      <li><hr className="dropdown-divider" /></li>
                    </>)}
                    <li><Link className="dropdown-item" to="/orders"><i className="fas fa-box me-2 text-success" />{t('user.myOrders')}</Link></li>
                    <li><Link className="dropdown-item" to="/profile"><i className="fas fa-user-edit me-2 text-primary" />{t('user.myProfile')}</Link></li>
                    <li><Link className="dropdown-item" to="/wishlist"><i className="fas fa-heart me-2 text-danger" />{t('user.wishlist')}</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item text-danger" onClick={logout}><i className="fas fa-sign-out-alt me-2" />{t('user.logout')}</button></li>
                  </ul>
                </div>
              ) : (
                <button className="top-bar-link border-0 bg-transparent" onClick={() => setShowAuth(true)}>
                  <i className="fas fa-user me-1" />{t('topbar.login')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAIN NAVBAR
          ════════════════════════════════════════ */}
      <nav id="main-nav" className="navbar navbar-expand-lg sticky-top">
        <div className="container-fluid px-3">

          {/* ── Logo — always visible ── */}
          <Link className="navbar-brand nav-logo me-3" to="/">
            <img src={logoSrc} alt="Isa Moh" style={{ height: 42, width: 'auto', display: 'block' }} />
          </Link>

          {/* ── Mobile: search + cart + hamburger ── */}
          <div className="d-flex align-items-center gap-2 flex-grow-1 d-lg-none">
            <form className="flex-grow-1" style={{ position: 'relative', minWidth: 0 }}
              onSubmit={handleSearch} ref={mobileSearch}>
              <div style={{ borderRadius: 8, border: '2px solid var(--accent)', display: 'flex', overflow: 'hidden', background: 'rgba(255,255,255,0.15)' }}>
                <input type="text"
                  placeholder={t('nav.searchPlaceholder')}
                  value={query} onChange={e => setQuery(e.target.value)} autoComplete="off"
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '9px 10px', fontSize: 16, background: 'transparent', color: '#fff', minWidth: 0 }} />
                <button type="submit" style={{ flexShrink: 0, background: 'var(--accent)', border: 'none', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--primary)', cursor: 'pointer' }}>
                  <i className="fas fa-search" />
                </button>
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

            <Link to="/cart" className="nav-cart-btn flex-shrink-0" aria-label="Cart">
              <i className="fas fa-shopping-cart" />
              {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
            </Link>

            <button className="navbar-toggler flex-shrink-0" type="button"
              data-bs-toggle="collapse" data-bs-target="#mainNavbar"
              aria-controls="mainNavbar" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon" />
            </button>
          </div>

          {/* ── Desktop + Mobile collapsed menu ── */}
          <div className="collapse navbar-collapse" id="mainNavbar">

            {/* Desktop search — inside collapse so it shares the flex row */}
            <form className="nav-search d-none d-lg-flex me-3" onSubmit={handleSearch} ref={searchRef}>
              <div className="nav-search-inner">
                <select className="nav-search-cat" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">{t('nav.searchAll')}</option>
                  <optgroup label={t('nav.brands_label')}>
                    {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </optgroup>
                  <optgroup label={t('nav.type_label')}>
                    <option value="onsale">{t('nav.onSale')}</option>
                    <option value="featured">{t('nav.featured')}</option>
                  </optgroup>
                </select>
                <input type="text" className="nav-search-input"
                  placeholder={t('nav.searchPlaceholder')}
                  value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" />
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

            {/* Nav links */}
            <ul className="navbar-nav align-items-lg-center me-auto">
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/')}`} to="/">{t('nav.home')}</Link>
              </li>
              <li className="nav-item dropdown">
                <button className="nav-link dropdown-toggle border-0 bg-transparent" data-bs-toggle="dropdown" aria-expanded="false">{t('nav.brands')}</button>
                <ul className="dropdown-menu nav-dropdown shadow border-0">
                  {brands.map(b => (
                    <li key={b._id}>
                      <Link className="dropdown-item" to={`/search?category=${encodeURIComponent(b.name)}`}>
                        <i className="fas fa-mobile me-2" />{b.name}
                      </Link>
                    </li>
                  ))}
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/search"><i className="fas fa-th me-2 text-secondary" />{t('nav.allBrands')}</Link></li>
                </ul>
              </li>
              <li className="nav-item dropdown">
                <button className="nav-link dropdown-toggle border-0 bg-transparent" data-bs-toggle="dropdown" aria-expanded="false">{t('nav.products')}</button>
                <ul className="dropdown-menu nav-dropdown shadow border-0">
                  <li><Link className="dropdown-item" to="/search"><i className="fas fa-th me-2" />{t('nav.allProducts')}</Link></li>
                  <li><Link className="dropdown-item" to="/search?filter=onsale"><i className="fas fa-tag me-2 text-danger" />{t('nav.onSale')}</Link></li>
                  <li><Link className="dropdown-item" to="/search?filter=featured"><i className="fas fa-star me-2 text-warning" />{t('nav.featured')}</Link></li>
                </ul>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/search?filter=onsale">
                  <span className="badge bg-danger me-1">{t('general.sale')}</span>{t('nav.onSale')}
                </Link>
              </li>
              <li className="nav-item dropdown">
                <button className="nav-link dropdown-toggle border-0 bg-transparent" data-bs-toggle="dropdown" aria-expanded="false">{t('nav.accessories')}</button>
                <ul className="dropdown-menu nav-dropdown shadow border-0">
                  <li><Link className="dropdown-item" to="/accessories?cat=Cases"><i className="fas fa-shield-alt me-2 text-primary" />{t('nav.cases')}</Link></li>
                  <li><Link className="dropdown-item" to="/accessories?cat=Chargers"><i className="fas fa-bolt me-2 text-warning" />{t('nav.chargers')}</Link></li>
                  <li><Link className="dropdown-item" to="/accessories?cat=Earphones"><i className="fas fa-headphones me-2 text-info" />{t('nav.earphones')}</Link></li>
                  <li><Link className="dropdown-item" to="/accessories?cat=Powerbanks"><i className="fas fa-battery-full me-2 text-success" />{t('nav.powerbanks')}</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/accessories"><i className="fas fa-th me-2" />{t('nav.allAccessories')}</Link></li>
                </ul>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/blog')}`} to="/blog">{t('nav.blog')}</Link>
              </li>
              <li className="nav-item dropdown">
                <button className="nav-link dropdown-toggle border-0 bg-transparent" data-bs-toggle="dropdown" aria-expanded="false">{t('nav.more')}</button>
                <ul className="dropdown-menu nav-dropdown shadow border-0">
                  <li><Link className="dropdown-item" to="/about"><i className="fas fa-store me-2 text-primary" />{t('nav.about')}</Link></li>
                  <li><Link className="dropdown-item" to="/support"><i className="fas fa-headset me-2 text-success" />{t('nav.support')}</Link></li>
                  <li><Link className="dropdown-item" to="/support#faq"><i className="fas fa-question-circle me-2 text-warning" />{t('nav.faq')}</Link></li>
                  <li><Link className="dropdown-item" to="/support#contact"><i className="fas fa-envelope me-2 text-info" />{t('nav.contact')}</Link></li>
                </ul>
              </li>
            </ul>

            {/* Desktop: theme + lang + cart */}
            <div className="d-none d-lg-flex align-items-center gap-2">
              <button className="nav-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
                <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`} />
              </button>
              <div className="dropdown">
                <button className="nav-lang-btn dropdown-toggle" data-bs-toggle="dropdown">
                  {lang === 'en' ? 'EN' : 'አማ'}
                </button>
                <ul className="dropdown-menu nav-dropdown shadow border-0 dropdown-menu-end" style={{ minWidth: 140 }}>
                  <li><button className={`dropdown-item d-flex align-items-center gap-2 ${lang==='en'?'fw-bold':''}`} onClick={() => setLang('en')}>
                    {lang==='en' ? <i className="fas fa-check text-secondary" style={{fontSize:11}}/> : <span style={{width:14}}/>} English
                  </button></li>
                  <li><button className={`dropdown-item d-flex align-items-center gap-2 ${lang==='am'?'fw-bold':''}`} onClick={() => setLang('am')}>
                    {lang==='am' ? <i className="fas fa-check text-secondary" style={{fontSize:11}}/> : <span style={{width:14}}/>} አማርኛ
                  </button></li>
                </ul>
              </div>
              <Link to="/cart" className="nav-cart-btn" aria-label="Cart">
                <i className="fas fa-shopping-cart" />
                {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
              </Link>
            </div>

            {/* Mobile: theme + lang at bottom of menu */}
            <div className="mobile-nav-utils d-lg-none">
              <button className="nav-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
                <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`} />
              </button>
              <span className="theme-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              <div className="ms-auto dropdown">
                <button className="nav-lang-btn dropdown-toggle" data-bs-toggle="dropdown">
                  {lang === 'en' ? 'EN' : 'አማ'}
                </button>
                <ul className="dropdown-menu nav-dropdown shadow border-0 dropdown-menu-end" style={{ minWidth: 140 }}>
                  <li><button className={`dropdown-item d-flex align-items-center gap-2 ${lang==='en'?'fw-bold':''}`} onClick={() => setLang('en')}>
                    {lang==='en' ? <i className="fas fa-check text-secondary" style={{fontSize:11}}/> : <span style={{width:14}}/>} English
                  </button></li>
                  <li><button className={`dropdown-item d-flex align-items-center gap-2 ${lang==='am'?'fw-bold':''}`} onClick={() => setLang('am')}>
                    {lang==='am' ? <i className="fas fa-check text-secondary" style={{fontSize:11}}/> : <span style={{width:14}}/>} አማርኛ
                  </button></li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </nav>

      <AuthModal show={showAuth} onHide={() => setShowAuth(false)} />
    </>
  );
}
