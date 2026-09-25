import Layout from '../components/Layout';
export default function PrivacyPage() {
  return (
    <Layout>
      <section className="py-5" style={{ background: '#f8f9fa' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="bg-white rounded-3 shadow-sm p-5">
            <h1 style={{ fontFamily:"'Rubik',sans-serif", fontWeight:700, color:'#003859', marginBottom:8 }}>Privacy Policy</h1>
            <p className="text-muted" style={{ fontSize:13, marginBottom:32 }}>Last updated: January 2026</p>
            {[['Information We Collect','We collect information you provide when registering, placing orders, or contacting us — including your name, email, phone number, and delivery address.'],['How We Use Your Information','We use your information to process orders, send confirmation emails, improve our services, and communicate important updates.'],['Data Security','Your data is protected using industry-standard encryption. We never sell or share your personal information with third parties.'],['Cookies','We use cookies to improve your browsing experience and remember your preferences. You can disable cookies in your browser settings.'],['Contact Us','If you have any questions about this Privacy Policy, please contact us at: isamohammedabere@gmail.com or +251 929 346 248']].map(([title, text]) => (
              <div key={title} className="mb-4">
                <h5 style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600, color:'#003859', marginBottom:8 }}>{title}</h5>
                <p style={{ fontSize:15, lineHeight:1.8, color:'#555' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
