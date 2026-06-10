# Règles Métier — NaatalFi Marketplace

---

## 1. Rôles utilisateurs

| Rôle | Description | Accès |
| :--- | :--- | :--- |
| `ADMIN` | Équipe NaatalFi | Tout — gestion plateforme, approbations, arbitrages |
| `VENDOR` | Vendeur inscrit | Dashboard vendeur, ses produits, ses commandes, son wallet |
| `CUSTOMER` | Acheteur | Marketplace, panier, commandes, avis, litiges |

Un utilisateur ne peut avoir qu'un seul rôle.
Un `VENDOR` est d'abord un `CUSTOMER` — il peut aussi acheter sur la plateforme.

---

## 2. Plans d'abonnement vendeur

| Plan | Prix mensuel | Commission | Produits max | Avantages |
| :--- | :--- | :--- | :--- | :--- |
| `FREE` | 0 FCFA | 10 % | 20 | Accès de base |
| `PRO` | 9 900 FCFA | 7 % | 200 | Badge Pro, priorité catalogue |
| `PREMIUM` | 24 900 FCFA | 5 % | Illimité | Badge Premium, produits sponsorisés offerts (2/mois), support prioritaire |

- La commission est calculée sur le **montant HT hors frais de livraison**.
- Le plan est vérifié à chaque vente au moment du calcul de commission.
- Un vendeur peut changer de plan à tout moment — le nouveau taux s'applique aux ventes suivantes.
- Un plan non renouvelé repasse automatiquement en `FREE`.

---

## 3. Cycle de vie d'un vendeur (KYC)

```
Inscription (CUSTOMER)
  └── Demande création boutique → statut PENDING
        └── Admin examine le dossier
              ├── Approuvé → statut APPROVED + email de bienvenue
              └── Rejeté  → statut REJECTED + email avec motif
```

- Un vendeur en `PENDING` ne peut pas publier de produits.
- Un vendeur `APPROVED` peut être suspendu (`SUSPENDED`) si violation des CGV.
- Un vendeur `SUSPENDED` ne peut plus vendre — ses produits sont masqués.
- Documents KYC requis : pièce d'identité, preuve d'adresse, RIB ou numéro Wave/Orange Money.

---

## 4. Cycle de vie d'un produit

```
DRAFT → ACTIVE → INACTIVE (désactivé par vendeur)
             └── REJECTED  (refusé par admin)
```

- Un produit `DRAFT` n'est visible que par le vendeur.
- Un produit `ACTIVE` est visible dans le catalogue public.
- Un admin peut rejeter un produit avec un motif (contenu illicite, photos de mauvaise qualité…).
- Un produit avec `stock = 0` reste visible mais est marqué "Rupture de stock".

---

## 5. Processus de commande

```
Client remplit son panier
  └── Validation stock en temps réel
        └── Initiation paiement (PayTech)
              ├── Paiement échoué → commande annulée
              └── Paiement confirmé (webhook)
                    └── Order.status = PAID
                          └── Fragmentation en VendorOrders
                                └── Email confirmation client + vendeurs
```

### Statuts Order

| Statut | Description |
| :--- | :--- |
| `PENDING` | Commande créée, en attente de paiement |
| `PAID` | Paiement confirmé |
| `PARTIALLY_SHIPPED` | Au moins un vendeur a expédié |
| `SHIPPED` | Tous les vendeurs ont expédié |
| `DELIVERED` | Toutes les sous-commandes livrées |
| `CANCELLED` | Annulée avant paiement |
| `REFUNDED` | Remboursée après litige |

### Statuts VendorOrder

| Statut | Description |
| :--- | :--- |
| `PENDING` | En attente de traitement par le vendeur |
| `CONFIRMED` | Vendeur a confirmé la prise en charge |
| `SHIPPED` | Expédié (avec numéro de suivi) |
| `DELIVERED` | Livré au client |
| `CANCELLED` | Annulé (rupture de stock en cours de traitement) |

---

## 6. Commission et calcul du wallet

### Formule

```
Montant produit (HT) = prix_unitaire × quantité
Commission NaatalFi  = Montant × taux_commission (selon plan vendeur)
Net vendeur          = Montant - Commission + frais_livraison
```

### Exemple — Plan FREE (10 %)

```
Produit : 15 000 FCFA × 2 = 30 000 FCFA
Livraison : 1 500 FCFA
Commission (10 %) : 3 000 FCFA
Net vendeur : 30 000 - 3 000 + 1 500 = 28 500 FCFA
```

### États du solde wallet

| État | Description | Transition |
| :--- | :--- | :--- |
| `PENDING` | Montant reçu, non encore disponible | → `AVAILABLE` après délai de 7 jours post-livraison |
| `AVAILABLE` | Disponible pour retrait | → `FROZEN` si litige ouvert |
| `FROZEN` | Bloqué pendant un litige | → `AVAILABLE` si litige résolu en faveur vendeur |
| | | → Débité si litige résolu en faveur client |

---

## 7. Retraits (Payouts)

- Montant minimum de retrait : **5 000 FCFA**
- Délai de traitement : **2 à 5 jours ouvrés**
- Méthodes : virement bancaire, Wave, Orange Money
- Fréquence : maximum **2 demandes par semaine**
- Validation manuelle par un admin avant exécution
- Un retrait en cours de traitement gèle le montant concerné

---

## 8. Trust Score vendeur

Score de 0 à 5 recalculé automatiquement après chaque événement significatif.

### Facteurs positifs
| Facteur | Impact |
| :--- | :--- |
| Avis clients (moyenne des notes) | +++ |
| Taux de commandes livrées dans les délais | ++ |
| Ancienneté sur la plateforme | + |
| Plan d'abonnement actif (PRO / PREMIUM) | + |

### Facteurs négatifs
| Facteur | Impact |
| :--- | :--- |
| Litiges ouverts et perdus | --- |
| Commandes annulées par rupture de stock | -- |
| Retards de livraison fréquents | -- |
| Avis négatifs (1-2 étoiles) | - |

### Affichage

| Score | Badge |
| :--- | :--- |
| 4.5 – 5.0 | ⭐ Vendeur de confiance |
| 3.5 – 4.4 | ✓ Vendeur fiable |
| 2.5 – 3.4 | Aucun badge |
| < 2.5 | ⚠️ À surveiller (alerte admin) |

---

## 9. Système d'avis

- Un avis ne peut être laissé que par un client ayant une commande **livrée** (`DELIVERED`) pour ce produit ou ce vendeur.
- Un seul avis par commande par produit.
- L'avis est publié immédiatement mais peut être modéré (masqué) par un admin.
- Note de 1 à 5 étoiles obligatoire + commentaire optionnel.
- Le vendeur ne peut pas répondre aux avis (fonctionnalité prévue post-lancement).

---

## 10. Publicités

- Disponible uniquement pour les vendeurs `APPROVED`.
- Facturation au **CPC** (coût par clic) — débit sur le wallet disponible.
- Budget minimum par campagne : **2 000 FCFA**.
- CPC minimum : **25 FCFA**.
- Si le budget est épuisé, la campagne se met en pause automatiquement.
- Les produits sponsorisés sont affichés en tête de catalogue avec badge "Sponsorisé".
- Maximum **3 produits sponsorisés** par page de catalogue.
- Les vendeurs `FREE` ont accès aux publicités mais sans réduction.

---

## 11. Litiges

- Un litige peut être ouvert par le client dans les **14 jours** suivant la livraison présumée.
- Motifs acceptés : article non reçu, article non conforme, problème de paiement.
- Dès l'ouverture d'un litige :
  - Le montant du VendorOrder concerné passe en `FROZEN`
  - Le vendeur est notifié
  - L'admin a **5 jours ouvrés** pour trancher
- Résolution en faveur du client → remboursement sur le moyen de paiement d'origine
- Résolution en faveur du vendeur → montant libéré (`AVAILABLE`)
- Un vendeur avec plus de **3 litiges perdus en 30 jours** est automatiquement suspendu et alerté.

---

## 12. Modération du contenu

### Produits
- Images : pas de nudité, pas de contenu violent, résolution minimum 400×400 px.
- Description : pas de coordonnées directes (email, téléphone) pour contourner la plateforme.
- Prix : pas de prix à 0 FCFA sauf produits gratuits explicitement approuvés.

### Avis
- Pas de propos diffamatoires, racistes ou hors sujet.
- Un avis signalé 3 fois est automatiquement masqué en attente de modération.

---

## 13. Gestion des stocks

- Le stock est décrémenté **au moment de la confirmation du paiement** (webhook).
- Si entre la mise au panier et le paiement le stock tombe à 0, la commande est bloquée avec message d'erreur.
- Un vendeur peut définir une alerte stock (ex: notification quand stock < 5).
- Les variantes ont chacune leur propre stock indépendant.
