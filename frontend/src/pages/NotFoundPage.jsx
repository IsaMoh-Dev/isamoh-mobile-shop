import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function NotFoundPage() {
  return (
    <Layout>
      <section className="py-5" style={{ background: '#f8f9fa', minHeight: '70vh' }}>
        <div className="container text-center py-5">
          <div style={{ fontSize: 100, fontFamily: "'Rubik',sans-serif", fontWeight: 800, color: '#003859', lineHeight: 1 }}>404</div>
          <h3 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859', margin: '16px 0 8px' }}>Page Not Found</h3>
          <p className="text-muted mb-4" style={{ fontSize: 15 }}>The page you're looking for doesn't exist or has been moved.</p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/" className="btn btn-primary-custom px-4"><i className="fas fa-home me-2" />Back to Home</Link>
            <Link to="/search" className="btn btn-outline-primary px-4"><i className="fas fa-search me-2" />Browse Products</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
