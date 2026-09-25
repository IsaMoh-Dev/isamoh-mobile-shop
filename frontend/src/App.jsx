import { Routes, Route } from 'react-router-dom';
import { useSettings }   from './context/SettingsContext';
import SettingsProvider  from './context/SettingsContext';

// Public pages
import HomePage         from './pages/HomePage';
import SearchPage       from './pages/SearchPage';
import ProductPage      from './pages/ProductPage';
import CartPage         from './pages/CartPage';
import CheckoutPage     from './pages/CheckoutPage';
import OrdersPage       from './pages/OrdersPage';
import ProfilePage      from './pages/ProfilePage';
import BlogPage         from './pages/BlogPage';
import BlogPostPage     from './pages/BlogPostPage';
import AccessoriesPage  from './pages/AccessoriesPage';
import AboutPage        from './pages/AboutPage';
import SupportPage      from './pages/SupportPage';
import PrivacyPage      from './pages/PrivacyPage';
import TermsPage        from './pages/TermsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import NotFoundPage     from './pages/NotFoundPage';

// Admin pages
import AdminLayout      from './admin/AdminLayout';
import AdminDashboard   from './admin/pages/Dashboard';
import AdminProducts    from './admin/pages/Products';
import AdminAccessories from './admin/pages/Accessories';
import AdminOrders      from './admin/pages/Orders';
import AdminUsers       from './admin/pages/Users';
import AdminBlog        from './admin/pages/BlogPosts';
import AdminCoupons     from './admin/pages/Coupons';
import AdminReviews     from './admin/pages/Reviews';
import AdminBanners     from './admin/pages/Banners';
import AdminSettings    from './admin/pages/Settings';

// Guards
import ProtectedRoute   from './components/ProtectedRoute';
import AdminRoute       from './components/AdminRoute';
import MaintenancePage  from './pages/MaintenancePage';

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/"                    element={<HomePage />} />
      <Route path="/search"              element={<SearchPage />} />
      <Route path="/product/:id"         element={<ProductPage />} />
      <Route path="/cart"                element={<CartPage />} />
      <Route path="/blog"                element={<BlogPage />} />
      <Route path="/blog/:slug"          element={<BlogPostPage />} />
      <Route path="/accessories"         element={<AccessoriesPage />} />
      <Route path="/about"               element={<AboutPage />} />
      <Route path="/support"             element={<SupportPage />} />
      <Route path="/privacy"             element={<PrivacyPage />} />
      <Route path="/terms"               element={<TermsPage />} />
      <Route path="/forgot-password"     element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/maintenance"         element={<MaintenancePage />} />

      {/* ── Authenticated ── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/checkout"  element={<CheckoutPage />} />
        <Route path="/orders"    element={<OrdersPage />} />
        <Route path="/profile"   element={<ProfilePage />} />
      </Route>

      {/* ── Admin ── */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index             element={<AdminDashboard />} />
          <Route path="products"   element={<AdminProducts />} />
          <Route path="accessories"element={<AdminAccessories />} />
          <Route path="orders"     element={<AdminOrders />} />
          <Route path="users"      element={<AdminUsers />} />
          <Route path="blog"       element={<AdminBlog />} />
          <Route path="coupons"    element={<AdminCoupons />} />
          <Route path="reviews"    element={<AdminReviews />} />
          <Route path="banners"    element={<AdminBanners />} />
          <Route path="settings"   element={<AdminSettings />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppRoutes />
    </SettingsProvider>
  );
}
