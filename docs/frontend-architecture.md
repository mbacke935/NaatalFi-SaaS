# Architecture Frontend — NaatalFi SaaS

Ce document décrit l'organisation du dossier `frontend/`, les responsabilités de chaque fichier et la stack technique utilisée.

---

## 1. Arbre de Dossiers

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── node_modules/          (dépendances installées — ignoré dans ce document)
└── src/
    ├── main.jsx
    ├── App.jsx
    └── services/
        ├── api.js
        ├── auth.js
        ├── products.js
        └── orders.js
```

---

## 2. Rôle de Chaque Fichier

### Racine `frontend/`

| Fichier | Rôle |
| :--- | :--- |
| `index.html` | Point d'entrée HTML. Contient le `<div id="root">` dans lequel React monte l'application, et charge `/src/main.jsx` comme module ES. |
| `package.json` | Déclare les dépendances, les scripts npm (`dev`, `build`, `preview`) et les métadonnées du projet. |
| `vite.config.js` | Configuration du bundler Vite : active le plugin React (HMR / JSX), force le serveur de développement sur `127.0.0.1:3000` et ouvre automatiquement le navigateur au démarrage. |

### `src/`

| Fichier | Rôle |
| :--- | :--- |
| `main.jsx` | Point de montage React. Appelle `ReactDOM.createRoot` sur `#root` et rend `<App />` encapsulé dans `<React.StrictMode>`. |
| `App.jsx` | Composant racine de l'application. Actuellement squelette minimaliste — c'est ici que sera configuré le routeur (React Router) et la structure globale des pages. |

### `src/services/`

Couche d'abstraction pour tous les appels HTTP vers le backend. Chaque fichier est dédié à un domaine métier.

| Fichier | Domaine | État |
| :--- | :--- | :--- |
| `api.js` | Configuration Axios (base URL, intercepteurs, headers d'authentification) | À implémenter |
| `auth.js` | Appels d'authentification : login, register, refresh token, logout | À implémenter |
| `products.js` | Récupération et gestion du catalogue produits | À implémenter |
| `orders.js` | Création et suivi des commandes | À implémenter |

---

## 3. Stack Technique

### Dépendances de production

| Package | Version | Rôle |
| :--- | :--- | :--- |
| `axios` | ^1.17.0 | Client HTTP pour les appels vers l'API REST backend |
| `react-router-dom` | ^7.17.0 | Gestion du routage côté client (SPA) |
| `zustand` | ^5.0.14 | Gestion d'état global léger (panier, session utilisateur, etc.) |
| `react-hot-toast` | ^2.6.0 | Notifications toast (succès, erreur, chargement) |
| `react-icons` | ^5.6.0 | Bibliothèque d'icônes SVG (plusieurs familles : Feather, Material, etc.) |

### Dépendances de développement

| Package | Version | Rôle |
| :--- | :--- | :--- |
| `react` | ^19.2.7 | Moteur de rendu React 19 |
| `react-dom` | ^19.2.7 | Liaison React avec le DOM du navigateur |
| `vite` | ^8.0.16 | Bundler et serveur de développement rapide (HMR natif) |
| `@vitejs/plugin-react` | ^6.0.2 | Plugin Vite pour le support JSX et le Fast Refresh |

---

## 4. Configuration du Serveur de Développement

Définie dans `vite.config.js` :

```js
server: {
    host: '127.0.0.1',  // Force IPv4 pour éviter les conflits EACCES sur Windows (::1)
    port: 3000,          // Port fixe, plus accessible sous Windows que le 5173 par défaut
    open: true           // Ouvre automatiquement le navigateur au démarrage
}
```

Commandes disponibles :

| Script | Commande | Action |
| :--- | :--- | :--- |
| Développement | `npm run dev` | Lance le serveur HMR sur `http://127.0.0.1:3000` |
| Production | `npm run build` | Génère le bundle optimisé dans `dist/` |
| Prévisualisation | `npm run preview` | Sert le bundle de production localement |
