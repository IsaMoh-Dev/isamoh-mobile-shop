import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useLang }     from '../context/LanguageContext';
import { imgUrl } from '../utils/imageUrl';
import api from '../api/axios';

export default function Footer() {
  const settings = useSettings();
  const { t }    = useLang();

  const [email,   setEmail]   = useState('');
  const [nlMsg,   setNlMsg]   = useState('');
  const [nlColor, setNlColor] = useState('');

  async function subscribe(e) {
    e.preventDefault();
    try {
      const r = await api.post('/settings/newsletter', { email });
      setNlMsg(r.data.message);
      setNlColor(r.data.success ? '#90ee90' : '#ffaaaa');
      if (r.data.success) setEmail('');
    } catch (err) {
      setNlMsg(err.response?.data?.message || 'Something went wrong.');
      setNlColor('#ffaaaa');
    }
  }

  const phone    = settings.shop_phone || '';
  const shopEmail= settings.shop_email || '';
  const address  = settings.shop_address || 'Merkato, Samson Building';

  return (
    <footer id="footer">
      <div className="footer-top">
        <div className="container">
          <div className="row g-4">

            {/* ── Brand ── */}
            <div className="col-lg-3 col-md-6 col-12">
              <div className="footer-brand">
                <h4><i className="fas fa-mobile-alt me-2" />Isa Moh</h4>
                <p>{t('footer.tagline')}</p>
                <div className="footer-social">
                  {settings.facebook  && <a href={`https://facebook.com/${settings.facebook}`}  target="_blank" rel="noreferrer" aria-label="Facebook"><i className="fab fa-facebook-f" /></a>}
                  {settings.instagram && <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" aria-label="Instagram"><i className="fab fa-instagram" /></a>}
                  {settings.telegram  && <a href={`https://t.me/${settings.telegram}`}           target="_blank" rel="noreferrer" aria-label="Telegram"><i className="fab fa-telegram-plane" /></a>}
                  {settings.youtube   && <a href={`https://youtube.com/@${settings.youtube}`}    target="_blank" rel="noreferrer" aria-label="YouTube"><i className="fab fa-youtube" /></a>}
                  {settings.tiktok    && <a href={`https://tiktok.com/@${settings.tiktok}`}      target="_blank" rel="noreferrer" aria-label="TikTok"><i className="fab fa-tiktok" /></a>}
                </div>
              </div>
            </div>

            {/* ── Quick Links ── */}
            <div className="col-lg-2 col-6">
              <h5 className="footer-heading">{t('footer.quickLinks')}</h5>
              <ul className="footer-links">
                <li><Link to="/"><i className="fas fa-chevron-right me-1" />{t('nav.home')}</Link></li>
                <li><Link to="/search"><i className="fas fa-chevron-right me-1" />{t('nav.allProducts')}</Link></li>
                <li><Link to="/search?filter=onsale"><i className="fas fa-chevron-right me-1" />{t('nav.onSale')}</Link></li>
                <li><Link to="/cart"><i className="fas fa-chevron-right me-1" />{t('cart.title')}</Link></li>
                <li><Link to="/blog"><i className="fas fa-chevron-right me-1" />{t('nav.blog')}</Link></li>
                <li><Link to="/about"><i className="fas fa-chevron-right me-1" />{t('nav.about')}</Link></li>
              </ul>
            </div>

            {/* ── Brands ── */}
            <div className="col-lg-2 col-6">
              <h5 className="footer-heading">{t('nav.brands')}</h5>
              <ul className="footer-links">
                {['Samsung','Apple','Redmi','Tecno','Infinix','Huawei'].map(b => (
                  <li key={b}>
                    <Link to={`/search?category=${b}`}>
                      <i className="fas fa-chevron-right me-1" />{b}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Customer Care ── */}
            <div className="col-lg-2 col-6">
              <h5 className="footer-heading">{t('footer.customerService')}</h5>
              <ul className="footer-links">
                <li><Link to="/orders"><i className="fas fa-chevron-right me-1" />{t('user.myOrders')}</Link></li>
                <li><Link to="/support#contact"><i className="fas fa-chevron-right me-1" />{t('nav.contact')}</Link></li>
                <li><Link to="/support#faq"><i className="fas fa-chevron-right me-1" />{t('nav.faq')}</Link></li>
                <li><Link to="/support"><i className="fas fa-chevron-right me-1" />{t('footer.returnPolicy')}</Link></li>
                <li><Link to="/privacy"><i className="fas fa-chevron-right me-1" />{t('footer.privacy')}</Link></li>
                <li><Link to="/terms"><i className="fas fa-chevron-right me-1" />{t('footer.terms')}</Link></li>
              </ul>
            </div>

            {/* ── Newsletter + Contact ── */}
            <div className="col-lg-3 col-md-6 col-12">
              <h5 className="footer-heading">{t('footer.newsletter')}</h5>
              <p style={{ fontSize: 13, color: 'var(--footer-muted)' }}>{t('footer.newsletterText')}</p>
              <form onSubmit={subscribe} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="email"
                  className="footer-nl-input"
                  placeholder={t('footer.emailPlaceholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="footer-nl-btn">
                  <i className="fas fa-paper-plane me-2" />{t('footer.subscribe')}
                </button>
              </form>
              {nlMsg && <div style={{ fontSize: 12, marginTop: 6, color: nlColor }}>{nlMsg}</div>}

              <div className="footer-contact mt-3">
                {phone     && <p><i className="fas fa-phone me-2" />{phone}</p>}
                {shopEmail && <p><i className="fas fa-envelope me-2" />{shopEmail}</p>}
                <p><i className="fas fa-map-marker-alt me-2" />{address}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Trust badges ── */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid var(--footer-border)', padding: '14px 0' }}>
        <div className="container">
          <div className="d-flex flex-wrap justify-content-center gap-3 text-center">
            {[
              ['fas fa-truck',          'footer.delivery'],
              ['fas fa-lock',           'footer.secure'],
              ['fas fa-headset',        'footer.support'],
              ['fas fa-certificate',    'footer.genuine'],
            ].map(([icon, key]) => (
              <div key={key} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className={`${icon} text-secondary`} />
                <span>{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payment methods ── */}
      <div className="footer-payment">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span style={{ fontSize: 13, color: 'var(--footer-muted)' }}>{t('footer.paymentTitle')}:</span>
            <div className="d-flex gap-2 flex-wrap align-items-center">
              {[
                ['fas fa-money-bill-wave', 'footer.cashOnDelivery'],
                ['fas fa-university',      'Bank Transfer'],
                ['fas fa-mobile-alt',      'Telebirr'],
                ['fas fa-credit-card',     'CBE Birr'],
              ].map(([ic, lb]) => (
                <span key={lb} className="payment-badge">
                  <i className={`${ic} me-1`} />
                  {lb.includes('.') ? t(lb) : lb}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Copyright ── */}
      <div className="footer-bottom">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <p className="m-0">
              &copy; {new Date().getFullYear()} <strong>Isa Moh Mobile Shop</strong>.{' '}
              {t('footer.rights')}
            </p>
            <div className="d-flex gap-3 align-items-center flex-wrap" style={{ fontSize: 12 }}>
              <Link to="/terms"   style={{ color: 'rgba(255,255,255,0.5)' }}>{t('footer.terms')}</Link>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('footer.privacy')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
