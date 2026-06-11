import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Guards
import PrivateRoute from './PrivateRoute'
import AdminGuard from './AdminGuard'

// Layouts
import AuthLayout from '../layouts/AuthLayout'
import PublicLayout from '../layouts/PublicLayout'
import AccountLayout from '../layouts/AccountLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import AdminLayout from '../layouts/AdminLayout'

// ── Pages publiques ────────────────────────────────────────────────
import HomePage from '../pages/home/HomePage'
import MarketplacePage from '../pages/marketplace/MarketplacePage'
import ProductDetailPage from '../pages/marketplace/ProductDetailPage'
import SearchPage from '../pages/search/SearchPage'
import VendorProfilePage from '../pages/vendors/VendorProfilePage'
import CartPage from '../pages/cart/CartPage'

// ── Checkout + commandes acheteur ──────────────────────────────────
import CheckoutPage from '../pages/checkout/CheckoutPage'
import CustomerOrdersPage from '../pages/orders/OrdersPage'
import CustomerOrderDetailPage from '../pages/orders/OrderDetailPage'

// ── Espace client ──────────────────────────────────────────────────
import AccountPage            from '../pages/account/AccountPage'
import AccountOrdersPage      from '../pages/account/AccountOrdersPage'
import AccountOrderDetailPage from '../pages/account/AccountOrderDetailPage'
import AccountAddressesPage   from '../pages/account/AccountAddressesPage'
import AccountFavoritesPage   from '../pages/account/AccountFavoritesPage'
import AccountSettingsPage    from '../pages/account/AccountSettingsPage'

// ── Pages d'authentification ───────────────────────────────────────
import LoginPage from '../pages/auth/login/LoginPage'
import RegisterPage from '../pages/auth/register/RegisterPage'
import ForgotPasswordPage from '../pages/auth/forgotpassword/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/resetpassword/ResetPasswordPage'
import VerifyEmailPage from '../pages/auth/verifyemail/VerifyEmailPage'

// ── Dashboard vendeur ──────────────────────────────────────────────
import DashboardPage from '../pages/dashboard/DashboardPage'
import ProductsPage from '../pages/dashboard/products/ProductsPage'
import NewProductPage from '../pages/dashboard/products/NewProductPage'
import EditProductPage from '../pages/dashboard/products/EditProductPage'
import OrdersPage from '../pages/dashboard/orders/OrdersPage'
import OrderDetailPage from '../pages/dashboard/orders/OrderDetailPage'
import WalletPage from '../pages/dashboard/wallet/WalletPage'
import AnalyticsPage from '../pages/dashboard/analytics/AnalyticsPage'
import ShopSettingsPage from '../pages/dashboard/shop/ShopSettingsPage'
import AdsPage from '../pages/dashboard/ads/AdsPage'
import DisputesPage from '../pages/dashboard/disputes/DisputesPage'
import NotificationsPage from '../pages/dashboard/notifications/NotificationsPage'
import ProfilePage from '../pages/dashboard/profile/ProfilePage'

// ── Admin ──────────────────────────────────────────────────────────
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import VendorsPage from '../pages/admin/vendors/VendorsPage'
import VendorDetailPage from '../pages/admin/vendors/VendorDetailPage'
import UsersPage from '../pages/admin/users/UsersPage'
import AdminOrdersPage from '../pages/admin/orders/OrdersPage'
import AdminProductsPage from '../pages/admin/products/ProductsPage'
import PaymentsPage from '../pages/admin/payments/PaymentsPage'
import CategoriesPage from '../pages/admin/categories/CategoriesPage'
import AdminAnalyticsPage from '../pages/admin/analytics/AnalyticsPage'
import AdminDisputesPage from '../pages/admin/disputes/DisputesPage'
import AdminAdsPage from '../pages/admin/ads/AdsPage'

// ── Erreurs ────────────────────────────────────────────────────────
import NotFoundPage from '../pages/errors/NotFoundPage'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public (avec NavBar) ────────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:slug" element={<ProductDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/vendors/:slug" element={<VendorProfilePage />} />
          <Route path="/cart" element={<CartPage />} />
        </Route>

        {/* ── Checkout + commandes acheteur (auth requise) ─────────── */}
        <Route element={<PrivateRoute />}>
          <Route element={<PublicLayout />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<CustomerOrdersPage />} />
            <Route path="/orders/:id" element={<CustomerOrderDetailPage />} />
          </Route>
        </Route>

        {/* ── Espace client (auth requise) ─────────────────────────── */}
        <Route element={<PrivateRoute />}>
          <Route element={<PublicLayout />}>
            <Route element={<AccountLayout />}>
              <Route path="/account"                   element={<AccountPage />} />
              <Route path="/account/orders"            element={<AccountOrdersPage />} />
              <Route path="/account/orders/:id"        element={<AccountOrderDetailPage />} />
              <Route path="/account/addresses"         element={<AccountAddressesPage />} />
              <Route path="/account/favorites"         element={<AccountFavoritesPage />} />
              <Route path="/account/settings"          element={<AccountSettingsPage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Authentification ────────────────────────────────────── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:uid/:token" element={<VerifyEmailPage />} />
        </Route>

        {/* ── Vendeur (authentifié) ────────────────────────────────── */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/products" element={<ProductsPage />} />
            <Route path="/dashboard/products/new" element={<NewProductPage />} />
            <Route path="/dashboard/products/:id/edit" element={<EditProductPage />} />
            <Route path="/dashboard/orders" element={<OrdersPage />} />
            <Route path="/dashboard/orders/:id" element={<OrderDetailPage />} />
            <Route path="/dashboard/wallet" element={<WalletPage />} />
            <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
            <Route path="/dashboard/shop" element={<ShopSettingsPage />} />
            <Route path="/dashboard/ads" element={<AdsPage />} />
            <Route path="/dashboard/disputes" element={<DisputesPage />} />
            <Route path="/dashboard/notifications" element={<NotificationsPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* ── Admin (rôle admin requis) ────────────────────────────── */}
        <Route element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/vendors" element={<VendorsPage />} />
            <Route path="/admin/vendors/:id" element={<VendorDetailPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/payments" element={<PaymentsPage />} />
            <Route path="/admin/categories" element={<CategoriesPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/disputes" element={<AdminDisputesPage />} />
            <Route path="/admin/ads" element={<AdminAdsPage />} />
          </Route>
        </Route>

        {/* ── 404 ─────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
