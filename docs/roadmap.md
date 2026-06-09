# 🎨 3. Segment Frontend (React + Vite)

Le frontend est structuré de façon modulaire et prévisible pour découper proprement la vue (UI), l'état de l'application (Store) et la communication réseau (Services).

| Dossier | Rôle au sein du Cycle de Vie Frontend |
| :--- | :--- |
| `src/pages/` | Conteneurs principaux rattachés aux routes de l'application (séparés par périmètres : public, tableau de bord vendeur, administration). |
| `src/components/` | Éléments d'interface utilisateur (UI) autonomes, sans logique métier forte, réutilisables à travers l'application (boutons, inputs, graphiques, cartes). |
| `src/layouts/` | Modèles de mise en page (ex : `DashboardLayout` incluant la barre latérale de navigation et le header, ou `AuthLayout` centré). |
| `src/routes/` & `guards/` | Système de routage de l'application (React Router). Les **guards** protègent les accès en vérifiant dynamiquement les rôles de l'utilisateur stockés dans la session avant l'affichage de la page. |
| `src/store/` | Centralisation de l'état global avec **Zustand** (ex : contenu du panier d'achat persistant, données de session de l'utilisateur connecté). |
| `src/services/` | Couche d'abstraction réseau. Intercepte les requêtes via Axios (`api.js`) pour y injecter automatiquement le token JWT et intercepter les erreurs globales (ex : redirection si code 401). |
| `src/hooks/` | Regroupe les Custom Hooks React pour isoler les logiques répétitives (ex : `useForm`, `useFetch`). |
| `src/contexts/` | Fournit des données transversales spécifiques (ex : thème sombre/clair, contextes de traduction). |