import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import toast from 'react-hot-toast';

const FAQS = [
  ['Do you offer warranty?','Yes! All smartphones come with a full 1-year manufacturer warranty. Accessories come with a 6-month warranty.'],
  ['Can I return a product?','Yes — within 10 days of purchase, for any defect or mismatch. The product must be in original condition with all accessories.'],
  ['Do you deliver outside Addis Ababa?','Currently we deliver within Addis Ababa only. We are working on expanding to other cities soon.'],
  ['How long does delivery take?','Orders placed before 2 PM are delivered same-day. Orders after 2 PM are delivered next morning.'],
  ['Are your products original?','100%. We source directly from authorized distributors. All products come with official manufacturer packaging.'],
  ['What payment methods do you accept?','Cash on Delivery, Bank Transfer, Telebirr, and CBE Birr.'],
];

export default function SupportPage() {
  const [form, setForm] = useState({ name:'', email:'', subject:'General', message:'' });
  const [sending, setSending] = useState(false);

  async function sendMessage(e) {
    e.preventDefault(); setSending(true);
    try {
      await api.post('/settings/contact', form);
      toast.success('Message sent! We will get back to you soon.');
      setForm({ name:'', email:'', subject:'General', message:'' });
    } catch { toast.error('Failed to send. Please try again.'); }
    finally { setSending(false); }
  }

  return (
    <Layout>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg,#003859,#00A5C4)', color: '#fff', padding: '50px 0 40px' }}>
        <div className="container text-center">
          <h1 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 800, fontSize: 36 }}>Support Center</h1>
          <p style={{ opacity: 0.85, fontSize: 16, maxWidth: 500, margin: '10px auto 0' }}>We're here to help. Find answers or get in touch with our team.</p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4 justify-content-center">
            {[['fas fa-phone','Call Us','+251 929 346 248','Mon–Sat, 8 AM – 8 PM','#28a745'],['fab fa-telegram-plane','Telegram','@isadagishop','Instant response','#229ED9'],['fab fa-whatsapp','WhatsApp','+251 929 346 248','Chat with us','#25D366'],['fas fa-map-marker-alt','Visit Us','Merkato, Samson Building','Addis Ababa, Ethiopia','#003859']].map(([icon,title,main,sub,color]) => (
              <div key={title} className="col-md-3 col-sm-6">
                <div className="support-card p-4 text-center">
                  <div className="support-card-icon mb-3" style={{ background: `${color}18`, color }}><i className={icon} /></div>
                  <h6 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859' }}>{title}</h6>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4 }}>{main}</p>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 0 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-5" style={{ background: '#f8f9fa' }} id="faq">
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 className="section-heading text-center mb-4">Frequently Asked Questions</h2>
          <div className="accordion" id="faqAccordion">
            {FAQS.map(([q, a], i) => (
              <div key={i} className="support-accordion-item accordion-item mb-2">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#faq${i}`}>{q}</button>
                </h2>
                <div id={`faq${i}`} className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div className="accordion-body" style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>{a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-5" id="contact">
        <div className="container" style={{ maxWidth: 700 }}>
          <h2 className="section-heading text-center mb-4">Send Us a Message</h2>
          <div className="bg-white rounded-3 shadow-sm p-4 p-md-5">
            <form onSubmit={sendMessage}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Your Name *</label>
                  <input type="text" className="form-control support-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Email Address *</label>
                  <input type="email" className="form-control support-input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
                </div>
                <div className="col-12">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Subject</label>
                  <select className="form-select support-input" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}>
                    {['General','Order Issue','Product Inquiry','Warranty Claim','Return Request','Technical Support'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Message *</label>
                  <textarea className="form-control support-input" rows="5" value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="How can we help you?" required />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-secondary-custom w-100 py-3" style={{ fontSize: 15 }} disabled={sending}>
                    {sending ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</> : <><i className="fas fa-paper-plane me-2" />Send Message</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
