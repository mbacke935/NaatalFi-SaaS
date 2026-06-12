# Routes Frontend — NaatalFi SaaS

Toutes les routes sont déclarées dans `src/routes/index.jsx`. Elles sont organisées en cinq périmètres : **public**, **authentification**, **espace client**, **vendeur** (protégé) et **administration** (protégé + rôle admin).

---

## Système de protection

| Composant | Fichier | Comportement |
| :--- | :--- | :--- |
| `PrivateRoute` | `src/routes/PrivateRoute.jsx` | Vérifie `isAuthenticated` dans le store Zustand. Redirige vers `/login` si faux. |
| `AdminGuard` | `src/routes/AdminGuard.jsx` | Vérifie `isAuthenticated` ET `role === 'ADMIN'`. Redirige vers `/login` ou `/dashboard`. |

L'état d'authentification est persisté dans `src/store/authStore.js` (Zustand + `localStorage`).

---

## Layouts

| Composant | Fichier | Utilisé par |
| :--- | :--- | :--- |
| `AuthLayout` | `src/layouts/AuthLayout.jsx` | Pages d'authentification |
| `PublicLayout` | `src/layouts/PublicLayout.jsx` | Pages publiques, checkout et espace client |
| `AccountLayout` | `src/layouts/AccountLayout.jsx` | Espace client |
| `DashboardLayout` | `src/layouts/DashboardLayout.jsx` | Dashboard vendeur (sidebar + header) |
| `AdminLayout` | `src/layouts/AdminLayout.jsx` | Interface d'administration |

---

## 1. Routes Publiques

Accessibles sans authentification.

| Route | Composant | Fichier |
| :--- | :--- | :--- |
| `/` | `HomePage` | `src/pages/home/HomePage.jsx` |
| `/marketplace` | `MarketplacePage` | `src/pages/marketplace/MarketplacePage.jsx` |
| `/marketplace/:slug` | `ProductDetailPage` | `src/pages/marketplace/ProductDetailPage.jsx` |
| `/search` | `SearchPage` | `src/pages/search/SearchPage.jsx` |
| `/vendors/:slug` | `VendorProfilePage` | `src/pages/vendors/VendorProfilePage.jsx` |
| `/cart` | `CartPage` | `src/pages/cart/CartPage.jsx` |

---

## 2. Routes d'Authentification

Encapsulées dans `<AuthLayout>`. Redirigent vers `/dashboard` après connexion réussie.

| Route | Composant | Fichier |
| :--- | :--- | :--- |
| `/login` | `LoginPage` | `src/pages/auth/login/LoginPage.jsx` |
| `/register` | `RegisterPage` | `src/pages/auth/register/RegisterPage.jsx` |
| `/forgot-password` | `ForgotPasswordPage` | `src/pages/auth/forgotpassword/ForgotPasswordPage.jsx` |
| `/reset-password/:uid/:token` | `ResetPasswordPage` | `src/pages/auth/resetpassword/ResetPasswordPage.jsx` |
| `/verify-email/:uid/:token` | `VerifyEmailPage` | `src/pages/auth/verifyemail/VerifyEmailPage.jsx` |

---

## 3. Espace Client

Protégé par `<PrivateRoute>` + encapsulé dans `<AccountLayout>`.

| Route | Composant | Fichier |
| :--- | :--- | :--- |
| `/checkout` | `CheckoutPage` | `src/pages/checkout/CheckoutPage.jsx` |
| `/account` | `AccountPage` | `src/pages/account/AccountPage.jsx` |
| `/account/orders` | `AccountOrdersPage` | `src/pages/account/AccountOrdersPage.jsx` |
| `/account/orders/:id` | `AccountOrderDetailPage` | `src/pages/account/AccountOrderDetailPage.jsx` |
| `/account/addresses` | `AccountAddressesPage` | `src/pages/account/AccountAddressesPage.jsx` |
| `/account/favorites` | `AccountFavoritesPage` | `src/pages/account/AccountFavoritesPage.jsx` |
| `/account/reviews` | `AccountReviewsPage` | `src/pages/account/AccountReviewsPage.jsx` |
| `/account/settings` | `AccountSettingsPage` | `src/pages/account/AccountSettingsPage.jsx` |
| `/orders` | Redirection | `/account/orders` |
| `/orders/:id` | Redirection | `/account/orders/:id` |

---

## 4. Dashboard Vendeur

Protégées par `<PrivateRoute>` + encapsulées dans `<DashboardLayout>`.
Redirigent vers `/login` si l'utilisateur n'est pas authentifié.

### Vue d'ensemble

| Route | Composant | Fichier |
| :--- | :--- | :--- |
| `/dashboard` | `DashboardPage` | `src/pages/dashboard/DashboardPage.jsx` |

### Produits

| Route | Composant | Fichier |
| :--- | :--- | :--- |
| `/dashboard/products` | `ProductsPage` | `src/pages/dashboard/products/ProductsPage.jsx` |
| `/dashboard/products/new` | `NewProductPage` | `src/pages/dashboard/products/NewProductPage.jsx` |
| `/dashboard/products/:id/edit` | `EditProductPage` | `src/pages/dashboard/products/EditProductPage.jsx` |

### Commandes

| Route | Composant | Fichier |
| :--- | :--- | :--- |
| `/dashboard/orders` | `OrdersPage` | `src/pages/dashboard/orders/OrdersPage.jsx` |
| `/dashboard/orders/:id` | `OrderDetailPage` | `src/pages/dashboard/orders/OrderDetailPage.jsx` |

### Finance & Boutique

| Route | Composant | Fichier |
| :--- | :--- | :--- |
| `/dashboard/wallet` | `WalletPage` | `src/pages/dashboard/wallet/WalletPage.jsx` |
| `/dashboard/analytics` | `AnalyticsPage` | `src/pages/dashboard/analytics/AnalyticsPage.jsx` |
| `/dashboard/shop` | `ShopSettingsPage` | `src/pages/dashboard/shop/ShopSettingsPage.jsx` |
| `/dashboard/delivery` | `DeliveryPage` | `src/pages/dashboard/delivery/DeliveryPage.jsx` |

### Services annexes

| Route | Composant | Fichier |
| :--- | :--- | :--- |
| `/dashboard/ads` | `AdsPage` | `src/pages/dashboard/ads/AdsPage.jsx` |
| `/dashboard/disputes` | `DisputesPage` | `src/pages/dashboard/disputes/DisputesPage.jsx` |
| `/dashboard/notifications` | `NotificationsPage` | `src/pages/dashboard/notifications/NotificationsPage.jsx` |
| `/dashboard/profile` | `ProfilePage` | `src/pages/dashboard/profile/ProfilePage.jsx` |

La page `/dashboard/notifications` consomme l'API `/notifications/`, marque les notifications comme lues et rafraichit la liste toutes les 30 secondes.

---

## 5. Administration

Protégées par `<AdminGuard>` + encapsulées dans `<AdminLayout>`.
Accessibles uniquement avec `role === 'ADMIN'`.

| Route | Composant | Fichier |
| :--- | :--- | :--- |
| `/admin` | `AdminDashboardPage` | `src/pages/admin/AdminDashboardPage.jsx` |
| `/admin/vendors` | `VendorsPage` | `src/pages/admin/vendors/VendorsPage.jsx` |
| `/admin/vendors/:id` | `VendorDetailPage` | `src/pages/admin/vendors/VendorDetailPage.jsx` |
| `/admin/users` | `UsersPage` | `src/pages/admin/users/UsersPage.jsx` |
| `/admin/orders` | `AdminOrdersPage` | `src/pages/admin/orders/OrdersPage.jsx` |
| `/admin/products` | `AdminProductsPage` | `src/pages/admin/products/ProductsPage.jsx` |
| `/admin/payments` | `PaymentsPage` | `src/pages/admin/payments/PaymentsPage.jsx` |
| `/admin/wallets` | `WalletsPage` | `src/pages/admin/wallets/WalletsPage.jsx` |
| `/admin/categories` | `CategoriesPage` | `src/pages/admin/categories/CategoriesPage.jsx` |
| `/admin/reviews` | `ReviewsPage` | `src/pages/admin/reviews/ReviewsPage.jsx` |
| `/admin/analytics` | `AdminAnalyticsPage` | `src/pages/admin/analytics/AnalyticsPage.jsx` |
| `/admin/platform` | `PlatformSettingsPage` | `src/pages/admin/platform/PlatformSettingsPage.jsx` |
| `/admin/disputes` | `AdminDisputesPage` | `src/pages/admin/disputes/DisputesPage.jsx` |
| `/admin/ads` | `AdminAdsPage` | `src/pages/admin/ads/AdsPage.jsx` |

Les pages `/dashboard/ads` et `/admin/ads` consomment l'API reelle des campagnes sponsorisees.
Les pages `/dashboard/disputes` et `/admin/disputes` consomment l'API reelle des litiges.
Les pages `/dashboard/analytics` et `/admin/analytics` consomment l'API reelle `/analytics`.
La page `/admin/platform` modifie les informations publiques affichees dans le footer, l'image hero et les categories populaires de l'accueil.

---

## 6. Erreurs

| Route | Composant | Fichier |
| :--- | :--- | :--- |
| `*` (toute route inconnue) | `NotFoundPage` | `src/pages/errors/NotFoundPage.jsx` |

---

## Ajouter une nouvelle route

1. Créer le composant page dans le bon dossier `src/pages/<périmètre>/`
2. L'importer dans `src/routes/index.jsx`
3. Ajouter un `<Route path="..." element={<MonComposant />} />` dans le bon bloc (public, auth, `<PrivateRoute>`, ou `<AdminGuard>`)
4. Mettre à jour ce fichier
