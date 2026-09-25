import { Link } from 'react-router-dom';
import { useCart }     from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth }     from '../context/AuthContext';
import { useState }    from 'react';
import toast from 'react-hot-toast';
import { imgUrl } from '../utils/imageUrl';

export default function ProductCard({ product, inCart = false }) {
  const { addToCart }  = useCart();
  const { formatPrice } = useCurrency();
  const { isLoggedIn } = useAuth();
  const [added, setAdded] = useState(inCart);

  async function handleAdd(e) {
    e.preventDefault();
    if (!isLoggedIn) { toast.error('Please login to add to cart.'); return; }
    const r = await addToCart(product._id);
    if (r.success) setAdded(true);
  }

  return (
    <div className="product-card">
      <div className="card-img-wrap">
        {product.onSale && <span className="badge-sale">SALE</span>}
        <Link to={`/product/${product._id}`}>
          <img src={imgUrl(product.image)} alt={product.name} loading="lazy" />
        </Link>
      </div>
      <div className="card-body">
        <div className="card-brand">{product.brand}</div>
        <div className="card-title">
          <Link to={`/product/${product._id}`} className="text-dark">{product.name}</Link>
        </div>
        <div className="card-price-wrap mb-2">
          <span className="card-price">{formatPrice(product.price)}</span>
          {product.oldPrice && <span className="card-old-price">{formatPrice(product.oldPrice)}</span>}
        </div>
        {added ? (
          <button className="btn-cart in-cart" disabled>
            <i className="fas fa-check me-1" />In Cart
          </button>
        ) : (
          <button className="btn-cart" onClick={handleAdd}>
            <i className="fas fa-cart-plus me-1" />Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
