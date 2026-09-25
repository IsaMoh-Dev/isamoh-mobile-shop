import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import { imgUrl } from '../utils/imageUrl';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/blog/${slug}`).then(r => setPost(r.data.post)).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Layout><div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" /></div></Layout>;
  if (!post)   return <Layout><div className="container py-5 text-center"><h4>Post not found.</h4><Link to="/blog" className="btn btn-primary mt-3">Back to Blog</Link></div></Layout>;

  return (
    <Layout>
      <section className="py-5" style={{ background: '#f8f9fa' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb" style={{ fontSize: 13 }}>
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item"><Link to="/blog">Blog</Link></li>
              <li className="breadcrumb-item active">{post.title}</li>
            </ol>
          </nav>
          <div className="bg-white rounded-3 shadow-sm overflow-hidden">
            <img src={imgUrl(post.image)} alt={post.title} style={{ width: '100%', maxHeight: 420, objectFit: 'cover' }} />
            <div className="p-4 p-md-5">
              <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                <i className="fas fa-calendar me-1" />
                {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <h1 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859', fontSize: 28, marginBottom: 24 }}>{post.title}</h1>
              <div style={{ fontFamily: "'Raleway',sans-serif", fontSize: 16, lineHeight: 1.85, color: '#444', whiteSpace: 'pre-wrap' }}>{post.content}</div>
              <hr className="my-4" />
              <Link to="/blog" className="btn btn-outline-primary"><i className="fas fa-arrow-left me-2" />Back to Blog</Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
