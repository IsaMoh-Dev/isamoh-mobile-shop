import Layout from '../components/Layout';
export default function TermsPage() {
  return (
    <Layout>
      <section className="py-5" style={{ background: '#f8f9fa' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="bg-white rounded-3 shadow-sm p-5">
            <h1 style={{ fontFamily:"'Rubik',sans-serif", fontWeight:700, color:'#003859', marginBottom:8 }}>Terms of Service</h1>
            <p className="text-muted" style={{ fontSize:13, marginBottom:32 }}>Last updated: January 2026</p>
            {[['Acceptance','By using our website and services, you agree to these Terms of Service.'],['Orders','All orders are subject to product availability. We reserve the right to cancel orders that cannot be fulfilled.'],['Payments','We accept Cash on Delivery, Bank Transfer, Telebirr, and CBE Birr. Payment must be completed before delivery.'],['Returns','Products may be returned within 10 days of purchase if defective or not as described. Items must be in original condition.'],['Warranty','All smartphones carry a 1-year manufacturer warranty. Accessories carry a 6-month warranty.'],['Limitation of Liability','We are not liable for indirect or consequential damages arising from the use of our products or services.'],['Contact','For questions about these Terms, contact us at isamohammedabere@gmail.com or +251 929 346 248.']].map(([title,text]) => (
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
