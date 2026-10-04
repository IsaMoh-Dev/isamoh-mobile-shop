import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

export default function AboutPage() {
  usePageTitle('About Us');
  const stats = [['8+','Years in Business'],['50,000+','Happy Customers'],['500+','Phone Models'],['10+','Top Brands']];
  const features = [['fas fa-certificate','100% Original Products','All our products are genuine, sourced directly from authorized distributors.'],['fas fa-truck','Same-Day Delivery','Order before 2 PM and get your phone delivered the same day in Addis Ababa.'],['fas fa-headset','Expert Support','Our team is available to help you pick the right device for your needs and budget.'],['fas fa-shield-alt','1 Year Warranty','All smartphones come with a full 1-year manufacturer warranty.'],['fas fa-rotate-left','10-Day Returns','Not happy? Return within 10 days for a full refund or exchange.'],['fas fa-tag','Best Prices','We price-match and offer exclusive deals you won\'t find anywhere else.']];
  const brands = ['Samsung','Apple','Redmi','Huawei','Tecno','Infinix','Nokia','Oppo','Vivo','OnePlus'];

  return (
    <Layout>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg,#003859 0%,#005580 60%,#00A5C4 100%)', color: '#fff', padding: 'clamp(40px,8vw,70px) 0 clamp(30px,6vw,50px)' }}>
        <div className="container text-center">
          <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 30 }}>
            <i className="fas fa-mobile-alt" />
          </div>
          <h1 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 800, fontSize: 'clamp(24px,6vw,40px)', marginBottom: 12 }}>Isa Moh Mobile Shop</h1>
          <p style={{ fontSize: 'clamp(14px,3vw,18px)', opacity: 0.85, maxWidth: 600, margin: '0 auto 24px' }}>Your trusted destination for the latest smartphones and accessories in Addis Ababa's Merkato district.</p>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <Link to="/search" className="btn btn-light fw-bold" style={{ color: '#003859', borderRadius: 8, fontSize: 14, padding: '10px 24px' }}><i className="fas fa-shopping-bag me-2" />Shop Now</Link>
            <a href="#contact-section" className="btn btn-outline-light fw-bold" style={{ borderRadius: 8, fontSize: 14, padding: '10px 24px' }}><i className="fas fa-phone me-2" />Contact Us</a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-5" style={{ background: '#fff' }}>
        <div className="container">
          <div className="row g-4 justify-content-center">
            {stats.map(([val, label]) => (
              <div key={label} className="col-6 col-md-3">
                <div className="about-stat-card text-center p-4">
                  <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Rubik',sans-serif", color: '#003859', marginBottom: 8 }}>{val}</div>
                  <div style={{ fontSize: 14, color: '#666' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-5" style={{ background: '#f8f9fa' }}>
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <h2 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859', marginBottom: 16 }}>Our Story</h2>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: '#444', marginBottom: 16 }}>Isa Moh Mobile Shop was founded with one goal: to bring the latest smartphones and accessories to the people of Addis Ababa at the best prices.</p>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: '#444', marginBottom: 16 }}>Located in the heart of Merkato at Samson Building, we serve thousands of customers every month — from first-time smartphone buyers to tech enthusiasts looking for the latest flagship.</p>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: '#444', marginBottom: 24 }}>We carry all major brands including Samsung, Apple, Redmi, Tecno, Infinix, and more — all 100% original with full warranty.</p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/search" className="btn btn-primary-custom px-4"><i className="fas fa-mobile-alt me-2" />Browse Phones</Link>
                <Link to="/support" className="btn btn-outline-primary px-4"><i className="fas fa-headset me-2" />Get Support</Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div style={{ background: 'linear-gradient(135deg,#003859,#00A5C4)', borderRadius: 20, padding: 'clamp(20px,5vw,40px)', color: '#fff', textAlign: 'center' }}>
                <i className="fas fa-map-marker-alt" style={{ fontSize: 48, marginBottom: 20 }} />
                <h4 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, marginBottom: 12 }}>Visit Us In Person</h4>
                <p style={{ opacity: 0.9, marginBottom: 8 }}><i className="fas fa-building me-2" />Merkato, Samson Building</p>
                <p style={{ opacity: 0.9, marginBottom: 8 }}><i className="fas fa-phone me-2" />+251 929 346 248</p>
                <p style={{ opacity: 0.9, marginBottom: 8 }}><i className="fab fa-telegram-plane me-2" />@isadagishop</p>
                <p style={{ opacity: 0.9, marginBottom: 0 }}><i className="fas fa-clock me-2" />Mon–Sat: 8 AM – 8 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-5">
        <div className="container">
          <h2 className="section-heading text-center mb-5">Why Choose Us?</h2>
          <div className="row g-4">
            {features.map(([icon, title, desc]) => (
              <div key={title} className="col-6 col-md-4">
                <div className="about-feature-card p-4 text-center">
                  <div className="about-feature-icon mb-3"><i className={icon} /></div>
                  <h6 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859', marginBottom: 8 }}>{title}</h6>
                  <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="py-5" style={{ background: '#f8f9fa' }}>
        <div className="container text-center">
          <h2 className="section-heading mb-4">Brands We Carry</h2>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            {brands.map(b => (
              <Link key={b} to={`/search?category=${b}`} className="about-brand-badge" style={{ textDecoration: 'none' }}>
                <i className="fas fa-mobile-alt me-2" />{b}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
