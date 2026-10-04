import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout      from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { fillGrid } from '../utils/fillGrid';
import api from '../api/axios';
import { useCurrency } from '../context/CurrencyContext';
import usePageTitle from '../hooks/usePageTitle';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const { formatPrice, currency } = useCurrency();

  const q        = params.get('q')        || '';
  const category = params.get('category') || '';
  const filter   = params.get('filter')   || '';

  usePageTitle(q ? `Search: ${q}` : category ? category : filter ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Products` : 'All Products');
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const sort     = params.get('sort')     || '';
  const page     = parseInt(params.get('page') || '1');

  const [products, setProducts] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [brands,   setBrands]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);

  useEffect(() => {
    api.get('/settings/brands').then(r => setBrands(r.data.brands || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q)        p.set('q',        q);
    if (category) p.set('brand',    category);
    if (filter === 'onsale')   p.set('filter', 'onsale');
    if (filter === 'featured') p.set('filter', 'featured');
    if (minPrice) p.set('minPrice', minPrice);
    if (maxPrice) p.set('maxPrice', maxPrice);
    if (sort)     p.set('sort',     sort);
    p.set('page',  page);
    p.set('limit', 20);

    api.get(`/products?${p}`)
      .then(r => { setProducts(r.data.products || []); setTotal(r.data.total || 0); setPages(r.data.pages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, category, filter, minPrice, maxPrice, sort, page]);

  function nav(extra) {
    const p = new URLSearchParams(params);
    Object.entries(extra).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    setParams(p);
  }

  function applyPrice(e) {
    e.preventDefault();
    nav({ minPrice: minInput, maxPrice: maxInput, page: null });
  }

  // XSS-safe heading — never use dangerouslySetInnerHTML with user input
  let heading = 'All Products';
  if (q)                  heading = `Search results for: "${q}"`;
  else if (category)      heading = `${category} Phones`;
  else if (filter === 'onsale')   heading = 'On Sale';
  else if (filter === 'featured') heading = 'Featured Products';

  const curLabel = currency === 'ETB' ? 'BIRR' : 'USD';

  return (
    <Layout>
      <section className="py-4" style={{ background: '#f8f9fa', minHeight: '80vh' }}>
        {/* Mobile filter toggle */}
        <div className="d-md-none px-3 mb-3">
          <button className="btn btn-outline-primary w-100" data-bs-toggle="offcanvas" data-bs-target="#filterOffcanvas">
            <i className="fas fa-filter me-2" />Filter &amp; Browse
          </button>
        </div>

        {/* Mobile offcanvas */}
        <div className="offcanvas offcanvas-start d-md-none" tabIndex="-1" id="filterOffcanvas" style={{ width: 'min(280px, 90vw)' }}>
          <div className="offcanvas-header" style={{ background: 'var(--primary)', color: '#fff' }}>
            <h6 className="offcanvas-title mb-0"><i className="fas fa-filter me-2" />Filter</h6>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" />
          </div>
          <div className="offcanvas-body p-3">
            <SidebarContent brands={brands} category={category} filter={filter} nav={nav} />
          </div>
        </div>

        <div className="container-fluid px-4">
          <div className="row g-4">
            {/* Sidebar */}
            <div className="col-lg-2 col-md-3 d-none d-md-block">
              <div className="filter-sidebar">
                <h6><i className="fas fa-filter me-2" />Filter</h6><hr />
                <SidebarContent brands={brands} category={category} filter={filter} nav={nav} />
              </div>
            </div>

            {/* Products */}
            <div className="col-12 col-md-9 col-lg-10">
              {/* Heading + sort */}
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h5 className="section-heading mb-0">{heading}</h5>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="text-muted" style={{ fontSize: 13 }}>{total} found</span>
                  <select className="form-select form-select-sm" style={{ width: 'auto', fontSize: 12 }} value={sort} onChange={e => nav({ sort: e.target.value, page: null })}>
                    <option value="">Sort: Default</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </div>
              </div>

              {/* Price filter */}
              <form className="bg-white rounded-3 shadow-sm p-3 mb-3 d-flex align-items-end gap-2 flex-wrap" onSubmit={applyPrice}>
                <div style={{ flex: '1 1 90px', minWidth: 80 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#888', display: 'block', marginBottom: 3 }}>MIN ({curLabel})</label>
                  <input type="number" className="form-control form-control-sm" placeholder="0" value={minInput} onChange={e => setMinInput(e.target.value)} min="0" />
                </div>
                <div style={{ flex: '1 1 90px', minWidth: 80 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#888', display: 'block', marginBottom: 3 }}>MAX ({curLabel})</label>
                  <input type="number" className="form-control form-control-sm" placeholder="Any" value={maxInput} onChange={e => setMaxInput(e.target.value)} min="0" />
                </div>
                <button type="submit" className="btn btn-primary btn-sm px-3" style={{ height: 31 }}>Apply</button>
                {(minPrice || maxPrice) && (
                  <button type="button" className="btn btn-outline-secondary btn-sm" style={{ height: 31 }} onClick={() => { setMinInput(''); setMaxInput(''); nav({ minPrice: null, maxPrice: null, page: null }); }}>Clear</button>
                )}
              </form>

              {/* Grid */}
              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              ) : products.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-3 shadow-sm">
                  <i className="fas fa-search fa-3x text-muted mb-3 d-block" />
                  <h5 className="text-muted">No products found</h5>
                  <Link to="/search" className="btn btn-primary-custom mt-3">View All Products</Link>
                </div>
              ) : (
                <div className="row row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
                  {/* Fill last row so no blank columns remain */}
                  {fillGrid(products, 5).map(p => (
                    <div key={p._fillerId || p._id} className="col">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <nav className="mt-5 d-flex justify-content-center">
                  <ul className="pagination pagination-custom">
                    <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => nav({ page: page - 1 })}><i className="fas fa-chevron-left" /></button>
                    </li>
                    {Array.from({ length: pages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === pages || Math.abs(n - page) <= 2)
                      .reduce((acc, n, i, arr) => {
                        if (i > 0 && n - arr[i - 1] > 1) acc.push('...');
                        acc.push(n); return acc;
                      }, [])
                      .map((n, i) => n === '...' ? (
                        <li key={`e${i}`} className="page-item disabled"><span className="page-link">…</span></li>
                      ) : (
                        <li key={n} className={`page-item ${n === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => nav({ page: n })}>{n}</button>
                        </li>
                      ))}
                    <li className={`page-item ${page >= pages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => nav({ page: page + 1 })}><i className="fas fa-chevron-right" /></button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function SidebarContent({ brands, category, filter, nav }) {
  return (
    <>
      <p className="mb-2" style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>By Brand</p>
      <ul className="list-unstyled mb-3">
        <li className="mb-1"><button className={`border-0 bg-transparent text-decoration-none ${!category && !filter ? 'fw-bold text-primary' : 'text-muted'}`} style={{ fontSize: 13 }} onClick={() => nav({ category: null, filter: null, page: null })}>All Brands</button></li>
        {brands.map(b => (
          <li key={b._id} className="mb-1">
            <button className={`border-0 bg-transparent ${category === b.name ? 'fw-bold text-primary' : 'text-muted'}`} style={{ fontSize: 13 }} onClick={() => nav({ category: b.name, page: null })}>{b.name}</button>
          </li>
        ))}
      </ul>
      <hr />
      <p className="mb-2" style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>By Type</p>
      <ul className="list-unstyled mb-3">
        <li className="mb-1"><button className={`border-0 bg-transparent ${filter === 'onsale' ? 'fw-bold text-danger' : 'text-muted'}`} style={{ fontSize: 13 }} onClick={() => nav({ filter: 'onsale', category: null, page: null })}><i className="fas fa-tag me-1 text-danger" />On Sale</button></li>
        <li className="mb-1"><button className={`border-0 bg-transparent ${filter === 'featured' ? 'fw-bold text-warning' : 'text-muted'}`} style={{ fontSize: 13 }} onClick={() => nav({ filter: 'featured', category: null, page: null })}><i className="fas fa-star me-1 text-warning" />Featured</button></li>
      </ul>
      <hr />
      <p className="mb-2" style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>Accessories</p>
      <ul className="list-unstyled">
        {[['','All Accessories','fas fa-th'],['Cases','Cases','fas fa-shield-alt text-primary'],['Chargers','Chargers','fas fa-bolt text-warning'],['Earphones','Earphones','fas fa-headphones text-info'],['Powerbanks','Power Banks','fas fa-battery-full text-success']].map(([cat, label, icon]) => (
          <li key={label} className="mb-1">
            <Link to={`/accessories${cat ? `?cat=${cat}` : ''}`} className="text-muted text-decoration-none" style={{ fontSize: 13 }}><i className={`${icon} me-1`} />{label}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
