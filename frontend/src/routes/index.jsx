import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'

// Guards
import PrivateRoute from './PrivateRoute'
import AdminGuard from './AdminGuard'
import VendorGuard from './VendorGuard'

// Layouts (non-lazy — toujours nécessaires)
import AuthLayout from '../layouts/AuthLayout'
import PublicLayout from '../layouts/PublicLayout'
import AccountLayout from '../layouts/AccountLayout'
import DashboardLayout from '../layouts/DashboardLayout'
import AdminLayout from '../layouts/AdminLayout'

// ── Pages publiques ────────────────────────────────────────────────
const HomePage            = lazy(() => import('../pages/home/HomePage'))
const MarketplacePage     = lazy(() => import('../pages/marketplace/MarketplacePage'))
const ProductDetailPage   = lazy(() => import('../pages/marketplace/ProductDetailPage'))
const SearchPage          = lazy(() => import('../pages/search/SearchPage'))
const VendorProfilePage   = lazy(() => import('../pages/vendors/VendorProfilePage'))
const CartPage            = lazy(() => import('../pages/cart/CartPage'))
const TermsPage           = lazy(() => import('../pages/legal/TermsPage'))
const PrivacyPage         = lazy(() => import('../pages/legal/PrivacyPage'))

// ── Checkout ──────────────────────────────────────────────────────
const CheckoutPage        = lazy(() => import('../pages/checkout/CheckoutPage'))

// ── Espace client ──────────────────────────────────────────────────
const AccountPage             = lazy(() => import('../pages/account/AccountPage'))
const AccountOrdersPage       = lazy(() => import('../pages/account/AccountOrdersPage'))
const AccountOrderDetailPage  = lazy(() => import('../pages/account/AccountOrderDetailPage'))
const AccountAddressesPage    = lazy(() => import('../pages/account/AccountAddressesPage'))
const AccountFavoritesPage    = lazy(() => import('../pages/account/AccountFavoritesPage'))
const AccountSettingsPage     = lazy(() => import('../pages/account/AccountSettingsPage'))
const AccountReviewsPage      = lazy(() => import('../pages/account/AccountReviewsPage'))

// ── Auth ──────────────────────────────────────────────────────────
const LoginPage           = lazy(() => import('../pages/auth/login/LoginPage'))
const RegisterPage        = lazy(() => import('../pages/auth/register/RegisterPage'))
const ForgotPasswordPage  = lazy(() => import('../pages/auth/forgotpassword/ForgotPasswordPage'))
const ResetPasswordPage   = lazy(() => import('../pages/auth/resetpassword/ResetPasswordPage'))
const VerifyEmailPage     = lazy(() => import('../pages/auth/verifyemail/VerifyEmailPage'))
const GuestOrderDetailPage = lazy(() => import('../pages/orders/GuestOrderDetailPage'))

// ── Dashboard vendeur ──────────────────────────────────────────────
const DashboardPage       = lazy(() => import('../pages/dashboard/DashboardPage'))
const ProductsPage        = lazy(() => import('../pages/dashboard/products/ProductsPage'))
const NewProductPage      = lazy(() => import('../pages/dashboard/products/NewProductPage'))
const EditProductPage     = lazy(() => import('../pages/dashboard/products/EditProductPage'))
const OrdersPage          = lazy(() => import('../pages/dashboard/orders/OrdersPage'))
const OrderDetailPage     = lazy(() => import('../pages/dashboard/orders/OrderDetailPage'))
const WalletPage          = lazy(() => import('../pages/dashboard/wallet/WalletPage'))
const DeliveryPage        = lazy(() => import('../pages/dashboard/delivery/DeliveryPage'))
const AnalyticsPage       = lazy(() => import('../pages/dashboard/analytics/AnalyticsPage'))
const ShopSettingsPage    = lazy(() => import('../pages/dashboard/shop/ShopSettingsPage'))
const AdsPage             = lazy(() => import('../pages/dashboard/ads/AdsPage'))
const DisputesPage        = lazy(() => import('../pages/dashboard/disputes/DisputesPage'))
const NotificationsPage   = lazy(() => import('../pages/dashboard/notifications/NotificationsPage'))
const ProfilePage         = lazy(() => import('../pages/dashboard/profile/ProfilePage'))

// ── Admin ──────────────────────────────────────────────────────────
const AdminDashboardPage  = lazy(() => import('../pages/admin/AdminDashboardPage'))
const VendorsPage         = lazy(() => import('../pages/admin/vendors/VendorsPage'))
const VendorDetailPage    = lazy(() => import('../pages/admin/vendors/VendorDetailPage'))
const UsersPage           = lazy(() => import('../pages/admin/users/UsersPage'))
const AdminOrdersPage     = lazy(() => import('../pages/admin/orders/OrdersPage'))
const AdminProductsPage   = lazy(() => import('../pages/admin/products/ProductsPage'))
const PaymentsPage        = lazy(() => import('../pages/admin/payments/PaymentsPage'))
const WalletsPage         = lazy(() => import('../pages/admin/wallets/WalletsPage'))
const CategoriesPage      = lazy(() => import('../pages/admin/categories/CategoriesPage'))
const ReviewsPage         = lazy(() => import('../pages/admin/reviews/ReviewsPage'))
const AdminAnalyticsPage  = lazy(() => import('../pages/admin/analytics/AnalyticsPage'))
const AdminDisputesPage   = lazy(() => import('../pages/admin/disputes/DisputesPage'))
const AdminAdsPage        = lazy(() => import('../pages/admin/ads/AdsPage'))
const PlatformSettingsPage = lazy(() => import('../pages/admin/platform/PlatformSettingsPage'))
const AuditLogsPage       = lazy(() => import('../pages/admin/audit/AuditLogsPage'))

// ── Erreurs ────────────────────────────────────────────────────────
const NotFoundPage        = lazy(() => import('../pages/errors/NotFoundPage'))

function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function LegacyOrderRedirect() {
  const { id } = useParams()
  return <Navigate to={`/account/orders/${id}`} replace />
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ── Public (avec NavBar) ────────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:slug" element={<ProductDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/vendors/:slug" element={<VendorProfilePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/cgu" element={<TermsPage />} />
            <Route path="/confidentialite" element={<PrivacyPage />} />
          </Route>

          {/* ── Redirections commandes acheteur (auth requise) ───────── */}
          <Route element={<PrivateRoute />}>
            <Route element={<PublicLayout />}>
              <Route path="/orders" element={<Navigate to="/account/orders" replace />} />
              <Route path="/orders/:id" element={<LegacyOrderRedirect />} />
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
                <Route path="/account/reviews"           element={<AccountReviewsPage />} />
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

          <Route element={<PublicLayout />}>
            <Route path="/guest/orders/:id" element={<GuestOrderDetailPage />} />
          </Route>

          {/* ── Vendeur (rôle VENDOR requis) ────────────────────────── */}
          <Route element={<VendorGuard />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/products" element={<ProductsPage />} />
              <Route path="/dashboard/products/new" element={<NewProductPage />} />
              <Route path="/dashboard/products/:id/edit" element={<EditProductPage />} />
              <Route path="/dashboard/orders" element={<OrdersPage />} />
              <Route path="/dashboard/orders/:id" element={<OrderDetailPage />} />
              <Route path="/dashboard/wallet" element={<WalletPage />} />
              <Route path="/dashboard/delivery" element={<DeliveryPage />} />
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
              <Route path="/admin/wallets" element={<WalletsPage />} />
              <Route path="/admin/categories" element={<CategoriesPage />} />
              <Route path="/admin/reviews" element={<ReviewsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/platform" element={<PlatformSettingsPage />} />
              <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
              <Route path="/admin/disputes" element={<AdminDisputesPage />} />
              <Route path="/admin/ads" element={<AdminAdsPage />} />
            </Route>
          </Route>

          {/* ── 404 ─────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRoutes
