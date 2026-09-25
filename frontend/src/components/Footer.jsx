import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { imgUrl } from '../utils/imageUrl';
import api from '../api/axios';

export default function Footer() {
  const settings = useSettings();
  const [email,  setEmail]  = useState('');
  const [nlMsg,  setNlMsg]  = useState('');
  const [nlColor,setNlColor]= useState('');

  async function subscribe(e) {
    e.preventDefault();
    try {
      const r = await api.post('/settings/newsletter', { email });
      setNlMsg(r.data.message); setNlColor(r.data.success ? '#90ee90' : '#ffaaaa');
      if (r.data.success) setEmail('');
    } catch (err) {
      setNlMsg(err.response?.data?.message || 'Something went wrong.');
      setNlColor('#ffaaaa');
    }
  }

  const phone = settings.shop_phone || '+251 929 346 248';
  const waPhone = phone.replace(/[^0-9]/g, '');

  return (
    <footer id="footer">
      {/* Floating Buttons */}
      <div className="float-contact-group">
        <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="float-btn float-whatsapp" title="WhatsApp">
          <i className="fab fa-whatsapp" /><span className="float-btn-label">WhatsApp</span>
        </a>
        <a href={`https://t.me/${settings.telegram || 'isadagishop'}`} target="_blank" rel="noreferrer" className="float-btn float-telegram" title="Telegram">
          <i className="fab fa-telegram-plane" /><span className="float-btn-label">Telegram</span>
        </a>
      </div>

      <div className="footer-top">
        <div className="container">
          <div className="row g-4">
            {/* Brand */}
            <div className="col-lg-3 col-md-6">
              <div className="footer-brand">
                <h4><i className="fas fa-mobile-alt me-2" />Isa &amp; Dagi</h4>
                <p>Your trusted mobile destination in Addis Ababa. We bring the latest smartphones and accessories to Merkato's Samson Building.</p>
                <div className="footer-social">
                  {settings.facebook  && <a href={`https://facebook.com/${settings.facebook}`}  target="_blank" rel="noreferrer"><i className="fab fa-facebook-f" /></a>}
                  {settings.instagram && <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer"><i className="fab fa-instagram" /></a>}
                  {settings.telegram  && <a href={`https://t.me/${settings.telegram}`}           target="_blank" rel="noreferrer"><i className="fab fa-telegram-plane" /></a>}
                  {settings.youtube   && <a href={`https://youtube.com/@${settings.youtube}`}    target="_blank" rel="noreferrer"><i className="fab fa-youtube" /></a>}
                  {settings.tiktok    && <a href={`https://tiktok.com/@${settings.tiktok}`}      target="_blank" rel="noreferrer"><i className="fab fa-tiktok" /></a>}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-lg-2 col-md-6">
              <h5 className="footer-heading">Quick Links</h5>
              <ul className="footer-links">
                <li><Link to="/"><i className="fas fa-chevron-right me-1" />Home</Link></li>
                <li><Link to="/search"><i className="fas fa-chevron-right me-1" />All Products</Link></li>
                <li><Link to="/search?filter=onsale"><i className="fas fa-chevron-right me-1" />On Sale</Link></li>
                <li><Link to="/cart"><i className="fas fa-chevron-right me-1" />Cart</Link></li>
                <li><Link to="/blog"><i className="fas fa-chevron-right me-1" />Blog</Link></li>
                <li><Link to="/about"><i className="fas fa-chevron-right me-1" />About Us</Link></li>
              </ul>
            </div>

            {/* Brands */}
            <div className="col-lg-2 col-md-6">
              <h5 className="footer-heading">Brands</h5>
              <ul className="footer-links">
                {['Samsung','Apple','Redmi','Tecno','Infinix','Huawei'].map(b => (
                  <li key={b}><Link to={`/search?category=${b}`}><i className="fas fa-chevron-right me-1" />{b}</Link></li>
                ))}
              </ul>
            </div>

            {/* Customer Care */}
            <div className="col-lg-2 col-md-6">
              <h5 className="footer-heading">Customer Care</h5>
              <ul className="footer-links">
                <li><Link to="/orders"><i className="fas fa-chevron-right me-1" />My Orders</Link></li>
                <li><Link to="/support#contact"><i className="fas fa-chevron-right me-1" />Contact Us</Link></li>
                <li><Link to="/support#faq"><i className="fas fa-chevron-right me-1" />FAQ</Link></li>
                <li><Link to="/support"><i className="fas fa-chevron-right me-1" />Returns</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="col-lg-3 col-md-6">
              <h5 className="footer-heading">Get Exclusive Deals</h5>
              <p className="footer-text" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Subscribe for price alerts on new iPhones and Samsungs.</p>
              <form className="footer-newsletter" onSubmit={subscribe}>
                <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} required />
                <button type="submit">JOIN</button>
              </form>
              {nlMsg && <div style={{ fontSize: 12, marginTop: 6, color: nlColor }}>{nlMsg}</div>}
              <div className="footer-contact mt-3">
                <p><i className="fas fa-phone me-2" />{phone}</p>
                <p><i className="fas fa-envelope me-2" />{settings.shop_email || 'isamohammedabere@gmail.com'}</p>
                <p><i className="fas fa-map-marker-alt me-2" />{settings.shop_address || 'Merkato, Samson Building'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="footer-payment">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>We Accept:</span>
            <div className="d-flex gap-3 flex-wrap align-items-center">
              {[['fas fa-money-bill-wave','Cash on Delivery'],['fas fa-university','Bank Transfer'],['fas fa-mobile-alt','Telebirr'],['fas fa-credit-card','CBE Birr']].map(([ic,lb]) => (
                <span key={lb} className="payment-badge"><i className={`${ic} me-1`} />{lb}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <p className="m-0">&copy; {new Date().getFullYear()} <strong>Isa &amp; Dagi Mobile Shop</strong>. All Rights Reserved.</p>
            <div className="d-flex gap-3 align-items-center flex-wrap" style={{ fontSize: 12 }}>
              <Link to="/terms" style={{ color: 'rgba(255,255,255,0.5)' }}>Terms of Service</Link>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.5)' }}>Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
