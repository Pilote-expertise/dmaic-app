# PROJET DMAIC - TEMPS D'ARRÊT PRODUCTION
## Réduction des arrêts non planifiés - Centre d'usinage CNC

**Code Projet:** DMAIC-2025-PRD-003
**Phase actuelle:** ANALYZE (60% complété)
**Statut:** EN COURS
**Site:** Usine Métallurgie Doyen - Atelier Usinage
**Date de création:** 15/09/2025

---

# PHASE DEFINE - 100% COMPLÉTÉ ✅

## 1. CHARTE DE PROJET

### 1.1 Identification
| Champ | Valeur |
|-------|--------|
| **Nom du projet** | Réduction des arrêts non planifiés - Centre d'usinage CNC |
| **Code projet** | DMAIC-2025-PRD-003 |
| **Service** | Production - Atelier Usinage |
| **Équipement concerné** | Centre d'usinage 5 axes MAZAK Variaxis i-700 |
| **Date de début** | 15/09/2025 |
| **Date de fin prévue** | 15/03/2026 |

### 1.2 Description du problème
Le centre d'usinage 5 axes MAZAK Variaxis i-700 (équipement critique, goulot d'étranglement) présente un taux d'arrêts non planifiés excessif, impactant le TRS (Taux de Rendement Synthétique) et la capacité de production. Sur les 6 derniers mois, le TRS moyen est de 62% contre un objectif de 85%, avec une disponibilité de 78% due aux pannes et micro-arrêts.

### 1.3 Périmètre
**Inclus:**
- Centre d'usinage MAZAK Variaxis i-700 (n° série MZ-2019-847)
- Tous types d'arrêts non planifiés (pannes, micro-arrêts, réglages)
- Maintenance préventive et curative
- Conduite et réglage machine
- Outillage et approvisionnement outils

**Exclus:**
- Autres machines de l'atelier
- Arrêts planifiés (maintenance préventive programmée)
- Problèmes de supply chain matière première
- Système de programmation FAO

### 1.4 Objectifs SMART
| Indicateur | Baseline | Cible | Unité |
|------------|----------|-------|-------|
| TRS | 62% | 85% | % |
| Disponibilité | 78% | 95% | % |
| MTBF (Mean Time Between Failures) | 18h | 72h | heures |
| MTTR (Mean Time To Repair) | 2,3h | 0,8h | heures |
| Temps arrêts non planifiés /mois | 47h | < 12h | heures |

### 1.5 Équipe projet
| Rôle | Nom | Fonction |
|------|-----|----------|
| **Sponsor** | Philippe MARTIN | Directeur Production |
| **Chef de projet** | Éric FONTAINE | Responsable Maintenance |
| **Black Belt** | Thomas DUBOIS | Amélioration Continue |
| **Membre** | Jean-Marc LEGER | Technicien maintenance senior |
| **Membre** | Patrick SIMON | Régleur CNC |
| **Membre** | Représentant MAZAK | Support technique constructeur |

### 1.6 Planning DMAIC
| Phase | Date début | Date fin | Statut |
|-------|------------|----------|--------|
| Define | 15/09/2025 | 30/09/2025 | ✅ 100% |
| Measure | 01/10/2025 | 15/11/2025 | ✅ 100% |
| Analyze | 16/11/2025 | 31/01/2026 | 🔄 60% |
| Improve | 01/02/2026 | 28/02/2026 | Non démarré |
| Control | 01/03/2026 | 15/03/2026 | Non démarré |

---

## 2. ROI - RETOUR SUR INVESTISSEMENT

### 2.1 Coût des arrêts (baseline 6 mois, annualisé)
| Poste | Calcul | Coût annuel |
|-------|--------|-------------|
| Perte production | 47h/mois × 12 × 120€/h | 67 680 € |
| Main d'œuvre improductive | 47h/mois × 12 × 45€/h | 25 380 € |
| Interventions maintenance curatives | 28h/mois × 12 × 65€/h | 21 840 € |
| Pièces détachées (curatif) | Moyenne mensuelle × 12 | 18 500 € |
| Retards livraison clients (pénalités) | Estimation | 12 000 € |
| **TOTAL** | | **145 400 €/an** |

### 2.2 Investissements prévus
| Poste | Montant |
|-------|---------|
| Maintenance préventive renforcée (pièces) | 8 000 € |
| Formation maintenance prédictive | 6 500 € |
| Capteurs vibration (monitoring) | 12 000 € |
| Logiciel GMAO upgrade | 4 500 € |
| Stock pièces critiques | 5 000 € |
| **TOTAL** | **36 000 €** |

### 2.3 ROI
| Indicateur | Valeur |
|------------|--------|
| Économies attendues (75% réduction) | 109 050 €/an |
| Période de retour | 4 mois |
| ROI année 1 | 203% |

---

## 3. CTQ - CRITICAL TO QUALITY

| Besoin | CTQ | LSL | Cible | USL | Unité |
|--------|-----|-----|-------|-----|-------|
| Machine disponible | Disponibilité | 90% | 95% | - | % |
| Pannes rares | MTBF | 48h | 72h | - | heures |
| Réparations rapides | MTTR | - | 0,8h | 1,5h | heures |
| Production stable | TRS | 80% | 85% | - | % |
| Pièces conformes | Taux rebut machine | - | 0,5% | 2% | % |

---

# PHASE MEASURE - 100% COMPLÉTÉ ✅

## 4. PLAN DE COLLECTE DE DONNÉES

| Mesure | Type | Définition | Méthode | Période | Responsable |
|--------|------|-----------|---------|---------|-------------|
| Temps arrêt par cause | Y | Durée cumul. par type de panne | GMAO + relevé opérateur | 8 sem. | Maintenance |
| MTBF | Y | Temps moyen entre pannes | Calcul GMAO | 8 sem. | Maintenance |
| MTTR | Y | Temps moyen de réparation | GMAO | 8 sem. | Maintenance |
| TRS | Y | OEE = Dispo × Perf × Qualité | Système MES | Continu | Production |
| Température broche | X | Température en fonctionnement | Capteur machine | Continu | Automatique |
| Vibrations | X | Niveau vibration roulements | Capteur externe | Quotidien | Maintenance |
| Usure outils | X | Durée de vie réelle vs théorique | Relevé outil | Continu | Régleur |

---

## 5. MSA - ANALYSE SYSTÈME DE MESURE

### 5.1 Mesure temps d'arrêt (système GMAO)
| Critère | Résultat | Seuil | Statut |
|---------|----------|-------|--------|
| Exactitude pointage | 97% | > 95% | ✅ |
| Répétabilité saisie | 94% | > 90% | ✅ |
| Reproductibilité (3 équipes) | 89% | > 85% | ✅ |

### 5.2 Mesure TRS (système MES)
| Critère | Résultat | Seuil | Statut |
|---------|----------|-------|--------|
| Précision calcul automatique | 99,5% | > 99% | ✅ |
| Cohérence avec GMAO | 98% | > 95% | ✅ |

**Conclusion:** Systèmes de mesure validés

---

## 6. PARETO - CAUSES D'ARRÊTS (8 semaines de données)

| Cause d'arrêt | Durée (h) | % | Cumulé |
|---------------|-----------|---|--------|
| Changement outil non planifié | 89 | 24% | 24% |
| Panne système hydraulique | 78 | 21% | 45% |
| Défaut broche | 52 | 14% | 59% |
| Micro-arrêts (causes diverses) | 48 | 13% | 72% |
| Panne automate/électrique | 37 | 10% | 82% |
| Défaut évacuation copeaux | 28 | 7% | 89% |
| Problème refroidissement | 22 | 6% | 95% |
| Autres | 18 | 5% | 100% |
| **TOTAL** | **372** | **100%** | |

### Visualisation
```
Changement outil  ████████████████████████ 24%    ─┐
Panne hydraulique ████████████████████ 21%         │
Défaut broche     ██████████████ 14%               │ 72% (Vital Few)
Micro-arrêts      █████████████ 13%               ─┘
Panne automate    ██████████ 10%
Évacuation copeaux███████ 7%
Refroidissement   ██████ 6%
Autres            █████ 5%
                  ────────────────────────────────
                        80%: ─────────────────│
```

**"Vital Few" identifiés:** 4 causes représentent 72% des temps d'arrêt

---

## 7. BASELINE CTQ MESURÉE

| CTQ | Baseline mesurée | Cible | Gap |
|-----|------------------|-------|-----|
| Disponibilité | 77,8% | 95% | -17,2 pts |
| MTBF | 17,6h | 72h | -54,4h |
| MTTR | 2,4h | 0,8h | +1,6h |
| TRS | 61,5% | 85% | -23,5 pts |
| Taux rebut | 1,8% | 0,5% | +1,3 pts |

### Indicateurs Six Sigma
| Indicateur | Valeur |
|------------|--------|
| Nb arrêts non planifiés (8 sem.) | 127 |
| Temps total arrêts | 372 h |
| DPMO (vs objectif 95% dispo) | 222 000 |
| Niveau Sigma | 2,28 σ |

---

## 8. TESTS DE DISTRIBUTION

### Distribution des durées d'arrêt (n=127)
| Statistique | Valeur |
|-------------|--------|
| Moyenne | 2,93 h |
| Médiane | 1,8 h |
| Écart-type | 2,67 h |
| Skewness | 2,14 (asymétrie droite) |

**Test Shapiro-Wilk:** W = 0,78, p < 0,001
**Conclusion:** Distribution non normale - utiliser méthodes non-paramétriques

---

# PHASE ANALYZE - 60% COMPLÉTÉ 🔄

## 9. ISHIKAWA - ANALYSE CAUSES RACINES (100% complété)

### Diagramme pour "Changement outil non planifié" (cause #1)

```
                    MAIN D'ŒUVRE                          MÉTHODE
                         │                                    │
    Régleur non formé ───┤                   Pas de standard ─┤
    détection usure      │                   de surveillance  │
                         │                                    │
    Rotation équipes ────┤                 Changement outil ──┤
    (perte info)         │                 systématique absent│
                         │                                    │
                         └────────────────┬───────────────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │  CHANGEMENT OUTIL     │
                              │  NON PLANIFIÉ         │
                              │  (89h d'arrêt)        │
                              └───────────────────────┘
                                          ▲
                         ┌────────────────┴───────────────────┐
                         │                                    │
    Qualité outil ───────┤                  Pas de capteur ───┤
    variable             │                  usure temps réel  │
                         │                                    │
    Mauvais stockage ────┤                  Logiciel FAO ne ──┤
    outils               │                  prédit pas usure  │
                         │                                    │
                    MATIÈRE                              MACHINE
```

### Ishikawa pour "Panne système hydraulique" (cause #2)

```
                    MAIN D'ŒUVRE                          MÉTHODE
                         │                                    │
    Maintenance préventive│               Fréquence contrôle ─┤
    non respectée ───────┤               huile insuffisante   │
                         │                                    │
    Méconnaissance ──────┤               Pas de procédure ────┤
    système hydraulique  │               diagnostic rapide    │
                         │                                    │
                         └────────────────┬───────────────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │  PANNE SYSTÈME        │
                              │  HYDRAULIQUE          │
                              │  (78h d'arrêt)        │
                              └───────────────────────┘
                                          ▲
                         ┌────────────────┴───────────────────┐
                         │                                    │
    Huile contaminée ────┤               Vérin 15 ans ────────┤
    (particules)         │               (obsolescence)       │
                         │                                    │
    Filtres non ─────────┤               Capteur pression ────┤
    changés              │               défaillant           │
                         │                                    │
                    MATIÈRE                              MACHINE
```

---

## 10. ANALYSE 5 POURQUOI (100% complété)

### Cause #1 : Changement outil non planifié

| Niveau | Question | Réponse |
|--------|----------|---------|
| Pourquoi 1 | Pourquoi des changements outils non planifiés ? | Parce que l'outil casse ou s'use trop vite |
| Pourquoi 2 | Pourquoi l'outil casse/s'use trop vite ? | Parce que l'usure n'est pas détectée à temps |
| Pourquoi 3 | Pourquoi l'usure n'est pas détectée ? | Parce qu'il n'y a pas de surveillance systématique |
| Pourquoi 4 | Pourquoi pas de surveillance systématique ? | Parce qu'on n'a pas de capteur ni de procédure |
| **Pourquoi 5** | **Pourquoi pas de capteur/procédure ?** | **Parce que ça n'a jamais été mis en place** |

**Cause racine identifiée:** Absence de système de monitoring usure outil et de procédure de surveillance

### Cause #2 : Panne système hydraulique

| Niveau | Question | Réponse |
|--------|----------|---------|
| Pourquoi 1 | Pourquoi des pannes hydrauliques ? | Parce que des composants lâchent |
| Pourquoi 2 | Pourquoi les composants lâchent ? | Parce que l'huile est contaminée et les filtres saturés |
| Pourquoi 3 | Pourquoi huile contaminée/filtres saturés ? | Parce que les intervalles de maintenance ne sont pas respectés |
| Pourquoi 4 | Pourquoi intervalles non respectés ? | Parce que la production prime sur la maintenance préventive |
| **Pourquoi 5** | **Pourquoi production prime ?** | **Parce qu'il n'y a pas de planification maintenance intégrée à la prod** |

**Cause racine identifiée:** Maintenance préventive non intégrée dans le planning de production

---

## 11. ANALYSE DE CORRÉLATION (70% complété)

### 11.1 Corrélation Température broche vs Défaut broche
| Variable X | Variable Y | Coefficient R | p-value | Signification |
|------------|------------|---------------|---------|---------------|
| Temp. broche (°C) | Nb défauts broche | 0,73 | 0,002 | Corrélation forte |

**Interprétation:** Quand la température broche dépasse 65°C, risque de défaut augmente significativement

### 11.2 Corrélation Vibrations vs Temps entre pannes
| Variable X | Variable Y | Coefficient R | p-value | Signification |
|------------|------------|---------------|---------|---------------|
| Niveau vibration | MTBF | -0,68 | 0,008 | Corrélation négative |

**Interprétation:** Augmentation des vibrations = réduction du MTBF (pannes plus fréquentes)

### 11.3 Analyse régression multiple (EN COURS)
- Variables en cours d'analyse : température, vibration, âge outil, pression hydraulique
- Objectif : modèle prédictif de panne

---

## 12. TESTS D'HYPOTHÈSES (50% complété)

### 12.1 Test comparaison MTBF entre équipes
**H0:** Pas de différence de MTBF entre les 3 équipes
**H1:** Au moins une équipe a un MTBF différent

| Équipe | MTBF moyen | n |
|--------|------------|---|
| Matin | 21,3 h | 42 |
| Après-midi | 16,8 h | 45 |
| Nuit | 14,2 h | 40 |

**Test Kruskal-Wallis:** H = 8,72, p = 0,013
**Conclusion:** Différence significative entre équipes - équipe nuit avec MTBF plus faible

### 12.2 Test influence jour de semaine (À FAIRE)
Hypothèse : plus de pannes le lundi (redémarrage après WE)

### 12.3 Test avant/après maintenance préventive (À FAIRE)
Hypothèse : MTBF meilleur après MP

---

## 13. MATRICE CAUSES-EFFETS (60% complété)

### Priorisation des causes racines

| Cause racine | Impact sur dispo | Fréquence | Facilité correction | Score |
|--------------|------------------|-----------|---------------------|-------|
| Absence monitoring usure outil | 9 | 8 | 7 | 504 |
| MP non intégrée au planning | 8 | 9 | 6 | 432 |
| Formation équipe nuit insuffisante | 6 | 7 | 8 | 336 |
| Vétusté vérin hydraulique | 7 | 5 | 4 | 140 |
| Capteur pression défaillant | 5 | 4 | 9 | 180 |

**Top 3 des causes à traiter:**
1. Absence monitoring usure outil (Score: 504)
2. Maintenance préventive non intégrée (Score: 432)
3. Formation équipe nuit (Score: 336)

---

## 14. VALIDATION STATISTIQUE (EN COURS - 40%)

### Points à valider avant passage Improve
| Élément | Statut | Commentaire |
|---------|--------|-------------|
| Causes racines confirmées par données | ⏳ 70% | 2 sur 3 confirmées |
| Corrélations validées statistiquement | ⏳ 60% | Régression en cours |
| Différence équipes validée | ✅ 100% | Test Kruskal-Wallis fait |
| Toutes hypothèses testées | ⏳ 30% | 2 tests restants |

---

## 15. REVUE DE PHASE ANALYZE (EN COURS - 60%)

### Checklist des livrables
| Livrable | Statut | Date |
|----------|--------|------|
| Ishikawa causes principales | ✅ Complété | 25/11/2025 |
| Analyse 5 Pourquoi | ✅ Complété | 02/12/2025 |
| Analyse corrélation | ⏳ 70% | En cours |
| Tests d'hypothèses | ⏳ 50% | En cours |
| Matrice causes-effets | ⏳ 60% | En cours |
| Causes racines validées | ⏳ 70% | En cours |
| Revue phase Analyze | 📅 Planifié | 31/01/2026 |

### Points ouverts
1. Compléter l'analyse de régression multiple
2. Réaliser les 2 tests d'hypothèses restants
3. Valider la 3ème cause racine (formation équipe nuit)
4. Préparer présentation revue Analyze

---

## INDICATEURS DE SUIVI PROJET

### Dashboard projet
```
Avancement global: ████████████████░░░░ 52%

Phase DEFINE:     ████████████████████ 100%
Phase MEASURE:    ████████████████████ 100%
Phase ANALYZE:    ████████████░░░░░░░░ 60%
Phase IMPROVE:    ░░░░░░░░░░░░░░░░░░░░ 0%
Phase CONTROL:    ░░░░░░░░░░░░░░░░░░░░ 0%
```

### Évolution TRS depuis lancement projet
| Mois | TRS | Disponibilité | MTBF |
|------|-----|---------------|------|
| Sept 2025 | 61% | 77% | 17h |
| Oct 2025 | 62% | 78% | 18h |
| Nov 2025 | 63% | 79% | 19h |
| Déc 2025 | 65% | 81% | 21h |
| Jan 2026 | 64% | 80% | 20h |

**Note:** Légère amélioration due aux actions rapides (quick wins) identifiées

---

*Document généré le 20/03/2026*
*Prochaine mise à jour: Post revue Analyze (31/01/2026)*
