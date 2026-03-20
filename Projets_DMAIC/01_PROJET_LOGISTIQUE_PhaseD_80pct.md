# PROJET DMAIC - LOGISTIQUE
## Optimisation des flux de livraison interne inter-ateliers

**Code Projet:** DMAIC-2026-LOG-001
**Phase actuelle:** DEFINE (80% complété)
**Statut:** EN COURS
**Site:** Usine Métallurgie Doyen - Secteur Production
**Date de création:** 15/01/2026

---

# PHASE DEFINE - 80% COMPLÉTÉ

## 1. CHARTE DE PROJET (100% complété)

### 1.1 Identification du projet
| Champ | Valeur |
|-------|--------|
| **Nom du projet** | Optimisation des flux de livraison interne inter-ateliers |
| **Code projet** | DMAIC-2026-LOG-001 |
| **Service** | Logistique Interne / Production |
| **Date de début** | 15/01/2026 |
| **Date de fin prévue** | 30/06/2026 |

### 1.2 Description du problème
Les livraisons de pièces entre l'atelier d'usinage et l'atelier d'assemblage présentent des retards récurrents, impactant la ligne d'assemblage et générant des temps d'attente non productifs. Sur les 3 derniers mois, 34% des livraisons internes ont été livrées avec plus de 30 minutes de retard par rapport au planning, causant des arrêts de ligne estimés à 47 heures cumulées.

### 1.3 Périmètre
**Inclus dans le périmètre:**
- Flux de pièces entre atelier usinage (bâtiment A) et atelier assemblage (bâtiment B)
- Processus de demande de livraison
- Transport par chariots élévateurs et transpalettes
- Zone de stockage tampon
- Système de planification des livraisons

**Exclus du périmètre:**
- Livraisons fournisseurs externes
- Expéditions clients
- Flux entre autres ateliers (traitement thermique, peinture)
- Système ERP global (hors module logistique interne)

### 1.4 Objectifs SMART
| Indicateur | Valeur actuelle | Valeur cible | Unité |
|------------|-----------------|--------------|-------|
| Taux de livraison à l'heure | 66% | 95% | % |
| Temps moyen de livraison | 45 min | 25 min | minutes |
| Arrêts ligne dus aux retards | 15,7 h/mois | < 2 h/mois | heures |

### 1.5 Équipe projet
| Rôle | Nom | Service |
|------|-----|---------|
| **Sponsor** | Philippe MARTIN | Directeur Production |
| **Chef de projet** | Sophie BERNARD | Responsable Logistique |
| **Green Belt** | Thomas DUBOIS | Amélioration Continue |
| **Membre** | Marc LEROY | Chef d'équipe Usinage |
| **Membre** | Claire MOREAU | Chef d'équipe Assemblage |
| **Membre** | Kevin PETIT | Cariste senior |

### 1.6 Planning DMAIC
| Phase | Date début | Date fin | Statut |
|-------|------------|----------|--------|
| Define | 15/01/2026 | 15/02/2026 | 80% |
| Measure | 16/02/2026 | 15/03/2026 | Non démarré |
| Analyze | 16/03/2026 | 15/04/2026 | Non démarré |
| Improve | 16/04/2026 | 31/05/2026 | Non démarré |
| Control | 01/06/2026 | 30/06/2026 | Non démarré |

---

## 2. ROI - RETOUR SUR INVESTISSEMENT (100% complété)

### 2.1 Analyse financière
| Élément | Montant |
|---------|---------|
| **Coût des arrêts de ligne (actuel)** | 78 500 €/an |
| **Coût main d'œuvre improductive** | 23 400 €/an |
| **Coût total du problème** | **101 900 €/an** |
| **Investissement estimé** | 35 000 € |
| **Économies attendues (an 1)** | 85 000 € |

### 2.2 Calcul ROI
| Indicateur | Valeur |
|------------|--------|
| Période de retour | 0,41 an (5 mois) |
| ROI 1ère année | 143% |
| ROI sur 3 ans | 629% |

### 2.3 Hypothèses
- Taux horaire moyen ligne assemblage : 85 €/h (coûts complets)
- Atteinte de 90% de l'objectif la première année
- Investissements principaux : système de traçabilité, réorganisation zones stockage
- Pas de recrutement supplémentaire prévu

### 2.4 Risques financiers
- Sous-estimation des coûts d'implémentation : +20% max
- Résistance au changement ralentissant le déploiement
- Nécessité de formation additionnelle

---

## 3. JUSTIFICATION FINANCIÈRE (100% complété)

### 3.1 Analyse coût-bénéfice détaillée

**Coûts actuels annuels:**
| Poste de coût | Calcul | Montant |
|---------------|--------|---------|
| Arrêts ligne assemblage | 15,7h × 12 mois × 85€/h × 0,8 coef | 12 802 € |
| Main d'œuvre improductive (attente) | 4 opérateurs × 15,7h × 12 × 32€/h | 24 115 € |
| Heures sup pour rattrapage | 8h/mois × 12 × 48€/h × 3 personnes | 13 824 € |
| Pénalités internes retard | Forfait mensuel moyen | 2 500 € |
| Gestion urgences et replanification | 5h/mois × 12 × 45€/h | 2 700 € |
| **TOTAL** | | **55 941 €** |

**Coûts cibles après amélioration:**
| Poste de coût | Estimation | Montant |
|---------------|-----------|---------|
| Arrêts ligne résiduels | 2h/mois max | 2 040 € |
| Main d'œuvre improductive | -85% | 3 617 € |
| Heures supplémentaires | -90% | 1 382 € |
| Pénalités | Supprimées | 0 € |
| Gestion urgences | -80% | 540 € |
| **TOTAL** | | **7 579 €** |

**Économies nettes annuelles: 48 362 €**

---

## 4. CTQ - CRITICAL TO QUALITY (100% complété)

| Besoin client (interne) | Caractéristique CTQ | LSL | Cible | USL | Unité | Méthode de mesure |
|------------------------|---------------------|-----|-------|-----|-------|-------------------|
| Pièces disponibles à temps | Délai de livraison | - | 25 | 35 | min | Horodatage système |
| Livraisons fiables | Taux OTD (On Time Delivery) | 90% | 95% | - | % | Nb livraisons à l'heure / Total |
| Pièces en bon état | Taux de pièces endommagées | - | 0 | 0,5% | % | Contrôle réception |
| Bonnes références | Taux d'erreur de référence | - | 0 | 0,1% | % | Contrôle réception |
| Quantités correctes | Écart quantité | -2% | 0 | +2% | % | Comptage réception |

---

## 5. INDICATEURS SIX SIGMA - BASELINE (100% complété)

### 5.1 Indicateurs actuels (Baseline)
| Indicateur | Valeur actuelle |
|------------|-----------------|
| Opportunités de défaut par livraison | 5 (délai, état, référence, quantité, documentation) |
| Nombre de livraisons/mois | 420 |
| Défauts constatés/mois | 187 |
| DPMO | 89 048 |
| Niveau Sigma | 2,84 σ |
| Rendement (Yield) | 91,1% |
| Taux de défauts | 8,9% |

### 5.2 Objectifs
| Indicateur | Baseline | Objectif |
|------------|----------|----------|
| DPMO | 89 048 | < 6 210 |
| Niveau Sigma | 2,84 σ | 4,0 σ |
| Rendement | 91,1% | 99,38% |

---

## 6. ANALYSE DES RISQUES PROJET (80% complété - EN COURS)

| # | Risque | Catégorie | P | I | Score | Plan de mitigation | Responsable | Statut |
|---|--------|-----------|---|---|-------|-------------------|-------------|--------|
| 1 | Résistance au changement des caristes | Organisationnel | 4 | 4 | 16 | Implication précoce, communication, formation | S. BERNARD | Ouvert |
| 2 | Budget insuffisant pour système traçabilité | Budget | 3 | 5 | 15 | Étude alternatives low-cost, présentation ROI direction | T. DUBOIS | En cours |
| 3 | Indisponibilité membres équipe (production) | Ressources | 3 | 3 | 9 | Planning réunions optimisé, réunions courtes | S. BERNARD | Ouvert |
| 4 | Complexité technique système informatique | Technique | 2 | 4 | 8 | POC avant déploiement, support IT dédié | IT | Ouvert |
| 5 | Dépendance météo (trajets extérieurs) | Technique | 2 | 2 | 4 | Solution de couverture des trajets | À définir | Ouvert |

**Légende:** P = Probabilité (1-5), I = Impact (1-5), Score = P × I

---

## 7. SIPOC (Ajout - 80% complété)

| Suppliers | Inputs | Process | Outputs | Customers |
|-----------|--------|---------|---------|-----------|
| Atelier Usinage | Pièces usinées | 1. Réception demande | Pièces livrées | Atelier Assemblage |
| Planning Production | Ordres de fabrication | 2. Préparation commande | Bon de livraison | Logistique |
| Magasin | Emballages | 3. Chargement chariot | Confirmation livraison | Production |
| Service Maintenance | Chariots disponibles | 4. Transport | Traçabilité | Qualité |
| | | 5. Déchargement | | |
| | | 6. Validation réception | | |

---

## 8. VOC - VOICE OF CUSTOMER (Ajout - 70% complété)

### 8.1 Entretiens réalisés
| Client interne | Date | Principales attentes |
|----------------|------|---------------------|
| Chef d'équipe Assemblage | 22/01/2026 | "Je veux savoir où sont mes pièces en temps réel" |
| Opérateurs ligne 1 | 23/01/2026 | "On perd du temps à chercher qui a nos pièces" |
| Opérateurs ligne 2 | 23/01/2026 | "Les pièces arrivent souvent abîmées" |
| Responsable Production | 24/01/2026 | "Visibilité sur les retards pour anticiper" |

### 8.2 Matrice VOC → CTQ
| Verbatim client | Besoin traduit | CTQ |
|-----------------|----------------|-----|
| "Savoir où sont mes pièces" | Traçabilité temps réel | Système de tracking |
| "Pièces arrivent abîmées" | Protection transport | Taux dommages < 0,5% |
| "On attend trop longtemps" | Rapidité | Délai < 35 min |
| "Anticiper les retards" | Prédictibilité | Alerte proactive |

---

## 9. REVUE DE PHASE DEFINE (EN COURS - 80%)

### 9.1 Checklist des livrables
| Livrable | Statut | Commentaire |
|----------|--------|-------------|
| Charte de projet | ✅ Complété | Validée par sponsor |
| CTQ définis | ✅ Complété | 5 CTQ identifiés |
| Périmètre clair | ✅ Complété | In/Out scope défini |
| Équipe constituée | ✅ Complété | 6 membres actifs |
| SIPOC | ✅ Complété | Process cartographié |
| VOC | ⏳ En cours | 80% entretiens réalisés |
| Analyse risques | ⏳ En cours | Plans mitigation à finaliser |
| Approbation sponsor | ⏳ En attente | Revue planifiée 12/02/2026 |

### 9.2 Points ouverts avant passage en phase Measure
1. Finaliser les 2 derniers entretiens VOC (maintenance, qualité)
2. Compléter les plans de mitigation risques #1 et #2
3. Obtenir validation formelle du sponsor
4. Confirmer disponibilité budget système traçabilité

### 9.3 Prochaines étapes
- Réunion de revue Define : 12/02/2026
- Gate review avec sponsor : 14/02/2026
- Lancement Phase Measure : 16/02/2026

---

## INDICATEURS DE SUIVI PROJET

### Dashboard projet
```
Avancement global: ████████░░░░░░░░░░░░ 16%

Phase DEFINE:     ████████████████░░░░ 80%
Phase MEASURE:    ░░░░░░░░░░░░░░░░░░░░ 0%
Phase ANALYZE:    ░░░░░░░░░░░░░░░░░░░░ 0%
Phase IMPROVE:    ░░░░░░░░░░░░░░░░░░░░ 0%
Phase CONTROL:    ░░░░░░░░░░░░░░░░░░░░ 0%
```

### KPIs Baseline vs Objectif
| KPI | Baseline | Actuel | Objectif | Tendance |
|-----|----------|--------|----------|----------|
| OTD | 66% | 66% | 95% | → |
| Délai moyen | 45 min | 45 min | 25 min | → |
| Niveau Sigma | 2,84 | 2,84 | 4,0 | → |

---

*Document généré le 20/03/2026*
*Prochaine mise à jour: Post revue Define (14/02/2026)*
