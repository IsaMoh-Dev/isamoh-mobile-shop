import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import { imgUrl } from '../utils/imageUrl';

export default function BlogPage() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blog?limit=20').then(r => setPosts(r.data.posts || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <section className="py-4" style={{ background: '#f8f9fa', minHeight: '80vh' }}>
        <div className="container">
          <h4 className="section-heading"><i className="fas fa-newspaper me-2" />Blog &amp; News</h4>
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-3 shadow-sm"><p className="text-muted">No blog posts yet.</p></div>
          ) : (
            <div className="row g-4">
              {posts.map(post => (
                <div key={post._id} className="col-md-4">
                  <div className="bg-white rounded-3 shadow-sm overflow-hidden h-100" style={{ transition: 'transform 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'}
                    onMouseLeave={e=>e.currentTarget.style.transform=''}>
                    <div className="blog-card-img-wrap">
                      <img src={imgUrl(post.image)} alt={post.title} />
                    </div>
                    <div className="p-4">
                      <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
                        <i className="fas fa-calendar me-1" />
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <h5 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859', marginBottom: 10 }}>{post.title}</h5>
                      <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 16 }}>{post.content.slice(0, 120)}...</p>
                      <Link to={`/blog/${post.slug}`} className="btn btn-primary-custom" style={{ fontSize: 13, padding: '8px 20px' }}>Read More <i className="fas fa-arrow-right ms-1" /></Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
