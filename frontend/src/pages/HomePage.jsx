import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css'; import 'swiper/css/pagination'; import 'swiper/css/navigation';
import Layout      from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { useSettings } from '../context/SettingsContext';
import { imgUrl } from '../utils/imageUrl';
import api from '../api/axios';

export default function HomePage() {
  const settings = useSettings();
  const [saleProducts,     setSaleProducts]     = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [blogs,            setBlogs]            = useState([]);

  useEffect(() => {
    api.get('/products/onsale').then(r  => setSaleProducts(r.data.products || [])).catch(() => {});
    api.get('/products/featured').then(r => setFeaturedProducts(r.data.products || [])).catch(() => {});
    api.get('/blog?limit=3').then(r => setBlogs(r.data.posts || [])).catch(() => {});
  }, []);

  const banners = [
    settings.banner_1, settings.banner_2, settings.banner_3, settings.banner_4,
  ].filter(Boolean);

  const adBanners = [settings.ad_banner_1, settings.ad_banner_2].filter(Boolean);

  function fill(arr, min = 8) {
    if (!arr.length) return [];
    const out = [...arr];
    while (out.length < min) out.push(...arr);
    return out.slice(0, Math.max(min, arr.length));
  }

  return (
    <Layout>
      {/* ── Banner Carousel ── */}
      {banners.length > 0 && (
        <div id="banner-area" style={{ borderTop: '10px solid #0d1b2a' }}>
          <Swiper modules={[Autoplay, Pagination]} autoplay={{ delay: 3500 }} pagination={{ clickable: true }} loop style={{ lineHeight: 0 }}>
            {banners.map((b, i) => (
              <SwiperSlide key={i}>
                <img src={imgUrl(b)} alt={`Banner ${i + 1}`} style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* ── Top Sale ── */}
      {saleProducts.length > 0 && (
        <section id="top-sale" className="py-4">
          <div className="container-fluid px-4">
            <h2 className="section-heading"><i className="fas fa-fire me-2 text-danger" />Top Sale</h2>
            <Swiper modules={[Navigation]} navigation loop spaceBetween={16}
              breakpoints={{ 0:{slidesPerView:1}, 600:{slidesPerView:3}, 1000:{slidesPerView:5} }}>
              {fill(saleProducts).map((p, i) => (
                <SwiperSlide key={`${p._id}-${i}`}><ProductCard product={p} /></SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* ── Special Price (on-sale grid) ── */}
      {saleProducts.length > 0 && (
        <section className="py-4" style={{ background: '#f8f9fa' }}>
          <div className="container-fluid px-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h2 className="section-heading mb-0"><i className="fas fa-tag me-2 text-danger" />Special Prices</h2>
              <Link to="/search?filter=onsale" className="btn btn-outline-danger btn-sm">View All <i className="fas fa-arrow-right ms-1" /></Link>
            </div>
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-xl-6 g-3">
              {saleProducts.slice(0, 12).map(p => (
                <div className="col" key={p._id}><ProductCard product={p} /></div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Ad Banners ── */}
      {adBanners.length > 0 && (
        <section className="py-3">
          <div className="container-fluid px-4">
            <div className="row g-3">
              {adBanners.map((b, i) => (
                <div key={i} className="col-md-6">
                  <Link to="/search?filter=onsale">
                    <img src={imgUrl(b)} alt={`Ad ${i + 1}`} className="w-100 rounded-3" style={{ objectFit: 'cover', maxHeight: 160 }} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── New / Featured Phones ── */}
      {featuredProducts.length > 0 && (
        <section id="new-phones" className="py-4">
          <div className="container-fluid px-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h2 className="section-heading mb-0"><i className="fas fa-star me-2 text-warning" />Featured Phones</h2>
              <Link to="/search?filter=featured" className="btn btn-outline-primary btn-sm">View All <i className="fas fa-arrow-right ms-1" /></Link>
            </div>
            <Swiper modules={[Pagination]} pagination={{ clickable: true }} loop spaceBetween={16}
              breakpoints={{ 0:{slidesPerView:1}, 600:{slidesPerView:3}, 1000:{slidesPerView:4} }}>
              {fill(featuredProducts).map((p, i) => (
                <SwiperSlide key={`${p._id}-${i}`}><ProductCard product={p} /></SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* ── Blog ── */}
      {blogs.length > 0 && (
        <section id="blogs" className="py-4" style={{ background: '#f8f9fa' }}>
          <div className="container-fluid px-4">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h2 className="section-heading mb-0"><i className="fas fa-newspaper me-2" />Latest Blog</h2>
              <Link to="/blog" className="btn btn-outline-primary btn-sm">All Posts <i className="fas fa-arrow-right ms-1" /></Link>
            </div>
            <div className="row g-4">
              {blogs.map(post => (
                <div key={post._id} className="col-md-4">
                  <div className="bg-white rounded-3 shadow-sm overflow-hidden h-100" style={{ transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = ''}>
                    <div className="blog-card-img-wrap">
                      <img src={imgUrl(post.image)} alt={post.title} />
                    </div>
                    <div className="p-3">
                      <p style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
                        <i className="fas fa-calendar me-1" />
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <h6 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859', marginBottom: 8 }}>{post.title}</h6>
                      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{post.content.slice(0, 100)}...</p>
                      <Link to={`/blog/${post.slug}`} className="btn-primary-custom btn" style={{ fontSize: 12, padding: '6px 16px' }}>Read More</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
