# 🏛️ Architecture Technique Globale — NaatalFi SaaS

Ce document détaille l'organisation, les responsabilités et la cinématique d'interaction des dossiers et fichiers de l'écosystème **NaatalFi**. L'architecture logicielle est pensée pour garantir une isolation stricte des contextes métier, une scalabilité horizontale et un cloisonnement étanche des données pour un modèle multi-tenant.

---

## 🌍 1. Racine du Projet (Root Directory)

| Dossier / Fichier | Niveau | Rôle & Responsabilité Technique |
| :--- | :--- | :--- |
| `backend/` | Racine | Contient l'intégralité de l'API REST, des modèles de données et de la logique métier (Django). |
| `frontend/` | Racine | Contient l'interface utilisateur web interactive, le design system et la gestion d'état (React + Vite). |
| `docs/` | Racine | Centralise la documentation de référence (Architecture, API, Base de données, Modélisation). |
| `docker-compose.yml` | Fichier | Automatise l'orchestration locale des conteneurs (App Django, Celery Worker, Redis Cache, PostgreSQL). |
| `.gitignore` | Fichier | Empêche le tracking des données sensibles (`.env`), des fichiers temporaires, des médias et des dépendances. |

---

## ⚙️ 2. Segment Backend (Django REST Framework)

Le backend applique les principes du **Domain-Driven Design (DDD)** : chaque domaine fonctionnel est isolé au sein d'une application autonome dans le dossier `apps/`.

### 2.1 Core & Configuration Générale
* **`backend/config/`** : Cerveau de configuration de Django.
    * `settings.py` : Centralise la sécurité, la connexion à la base de données PostgreSQL (Supabase), le cache (Upstash Redis), l'intégration de Celery et les durées de vie des tokens JWT.
    * `urls.py` : Point d'entrée de routage HTTP global. Il distribue les requêtes vers les sous-applications via le préfixe `/api/v1/`.
    * `celery.py` : Initialise le gestionnaire de tâches asynchrones pour déporter les traitements lourds.
* **`backend/core/`** : Socle technique partagé et réutilisable.
    * `middleware/` : Intercepte les requêtes/réponses (ex : injecter ou filtrer l'identifiant du tenant / vendeur).
    * `permissions/` : Classes de restriction d'accès personnalisées (ex : `IsVendorOwner`, `IsOrderCustomer`).
    * `constants/` : Centralise les enums immuables du système (`roles.py`, `order_status.py`).

### 2.2 Structure Interne d'une Application Métier (`backend/apps/`)
Chaque sous-dossier de `apps/` respecte une architecture interne standardisée :
* `models/` : Contient la définition des tables SQL découpée par entité (ex : `product.py`, `product_variant.py`).
* `api/` : Regroupe les `serializers.py` (validation de schémas) et les `views.py` (logique d'exposition DRF).
* `services/` : Encapsule la logique métier pure (calculs, interactions complexes), isolée des vues pour faciliter les tests unitaires.
* `signals.py` : Écouteurs d'événements du cycle de vie de la base de données (ex : créer automatiquement un portefeuille à la validation d'une boutique).

### 2.3 Rôle Précis des Domaines Applicatifs Backend
* **`users/`** : Authentification personnalisée (Custom User Model), gestion des privilèges RBAC (Admin, Vendor, Customer) et cycle JWT.
* **`vendors/`** : Gestion des profils de boutiques, de leur statut d'approbation (KYC), de leur identité visuelle et de leurs configurations de livraison.
* **`categories/` & `products/`** : Gestion fine du catalogue produit, de la galerie d'images (`product_image.py`), des déclinaisons de stocks/tailles (`product_variant.py`) et du calcul algorithmique des prix (`pricing_service.py`).
* **`orders/` & `shipping/`** : Moteur de commande complexe prenant en charge le **Split-Order multi-vendeur** (un panier unique payé par le client se fragmente en plusieurs sous-commandes affectées aux vendeurs respectifs).
* **`payments/` & `wallet/`** : Intégration de la passerelle de paiement **PayTech**, réception sécurisée des webhooks de validation et gestion des comptes d'attente, disponibles et gelés des vendeurs.
* **`reviews/`**, **`ads/`**, **`disputes/`** : Couche de services annexes (avis clients, mise en avant publicitaire payante pour les vendeurs, et gestion des litiges).
* **`analytics/`** : Agrégation des métriques de vente, calcul des revenus et des taux de conversion.
* **`notifications/`** : Gestion centralisée des files d'attente d'alertes internes et temps réel.
* **`tasks/`** : Scripts asynchrones exécutés en tâche de fond par Celery (`emails.py`, `payments.py`) pour ne jamais bloquer le thread HTTP principal.