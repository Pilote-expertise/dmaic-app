# PROJET DMAIC - QUALITÉ FABRICATION INTERNE
## Réduction des rebuts usinage - Axes de transmission

**Code Projet:** DMAIC-2025-QUA-005
**Phase actuelle:** CONTROL (50% complété)
**Statut:** EN COURS
**Site:** Usine Métallurgie Doyen - Atelier Usinage
**Date de création:** 01/04/2025

---

# PHASE DEFINE - 100% COMPLÉTÉ ✅

## 1. CHARTE DE PROJET

### 1.1 Identification
| Champ | Valeur |
|-------|--------|
| **Nom du projet** | Réduction des rebuts usinage - Axes de transmission |
| **Code projet** | DMAIC-2025-QUA-005 |
| **Service** | Production - Atelier Usinage |
| **Pièces concernées** | Axes transmission AT-150, AT-200, AT-250 |
| **Date de début** | 01/04/2025 |
| **Date de fin prévue** | 30/11/2025 |

### 1.2 Description du problème
L'atelier d'usinage génère un taux de rebut de 4,2% sur les axes de transmission, bien au-dessus de l'objectif de 0,5%. Ces rebuts représentent un coût annuel de 187 000 € et impactent la capacité de production. Les défauts principaux sont : cotes hors tolérance (61%), défauts d'état de surface (24%), erreurs de géométrie (15%).

### 1.3 Objectifs SMART
| Indicateur | Baseline | Cible | Atteint |
|------------|----------|-------|---------|
| Taux de rebut | 4,2% | 0,5% | 0,6% ✅ |
| Cpk global | 0,89 | 1,67 | 1,58 ✅ |
| Coût rebut /mois | 15 580 € | < 2 000 € | 1 850 € ✅ |
| Niveau Sigma | 3,2 | 4,5 | 4,4 ✅ |

### 1.4 Équipe projet
| Rôle | Nom | Fonction |
|------|-----|----------|
| **Sponsor** | Philippe MARTIN | Directeur Production |
| **Chef de projet** | Laurent DUVAL | Responsable Atelier Usinage |
| **Black Belt** | Thomas DUBOIS | Amélioration Continue |
| **Membre** | Christophe RIVIERE | Technicien méthodes |
| **Membre** | Isabelle GAUDIN | Technicienne qualité |
| **Membre** | Mohamed KHALIL | Opérateur CNC senior |

---

## 2. ROI - RÉALISÉ

### 2.1 Coûts de rebut (baseline annualisé)
| Poste | Coût |
|-------|------|
| Matière perdue | 98 500 € |
| Temps machine perdu | 45 200 € |
| Main d'œuvre improductive | 28 600 € |
| Gestion rebuts (tri, évacuation) | 8 700 € |
| Retard livraisons (pénalités) | 6 000 € |
| **TOTAL** | **187 000 €/an** |

### 2.2 Investissements réalisés
| Poste | Montant |
|-------|---------|
| Préréglage outils (banc Zoller) | 28 000 € |
| Formation opérateurs SPC | 4 500 € |
| Outillage qualité supérieure | 12 000 € |
| Système de palpage pièce | 8 500 € |
| Climatisation atelier | 18 000 € |
| **TOTAL** | **71 000 €** |

### 2.3 ROI réalisé
| Indicateur | Prévisionnel | Réalisé |
|------------|--------------|---------|
| Économies /an | 168 000 € | 164 800 € |
| Période de retour | 5 mois | 5,2 mois |
| ROI année 1 | 137% | 132% |

---

# PHASE MEASURE - 100% COMPLÉTÉ ✅

## 3. BASELINE MESURÉE

### 3.1 Données de rebut (3 mois baseline)
| Mois | Production | Rebuts | Taux |
|------|------------|--------|------|
| Janvier 2025 | 4 520 | 198 | 4,4% |
| Février 2025 | 4 380 | 172 | 3,9% |
| Mars 2025 | 4 650 | 195 | 4,2% |
| **Total** | **13 550** | **565** | **4,2%** |

### 3.2 Pareto des défauts (baseline)
| Type de défaut | Quantité | % | Cumulé |
|----------------|----------|---|--------|
| Diamètre hors cote | 198 | 35% | 35% |
| Longueur hors cote | 147 | 26% | 61% |
| État de surface Ra | 136 | 24% | 85% |
| Concentricité | 56 | 10% | 95% |
| Autres | 28 | 5% | 100% |

### 3.3 Capabilité baseline
| Cote | LSL | Cible | USL | Moyenne | σ | Cp | Cpk |
|------|-----|-------|-----|---------|---|----|----|
| Ø45 h7 | 44,975 | 45,000 | 45,025 | 44,998 | 0,012 | 0,69 | 0,65 |
| L 180 ±0,05 | 179,95 | 180,00 | 180,05 | 180,02 | 0,022 | 0,76 | 0,62 |
| Ra | - | 0,8 | 1,6 | 1,2 | 0,35 | - | 0,38 |

---

# PHASE ANALYZE - 100% COMPLÉTÉ ✅

## 4. CAUSES RACINES IDENTIFIÉES

### 4.1 Ishikawa synthèse
| Catégorie | Causes racines identifiées |
|-----------|---------------------------|
| **Machine** | Dérive thermique (température atelier variable ±8°C) |
| **Méthode** | Pas de préréglage outil systématique |
| **Main d'œuvre** | Formation SPC insuffisante |
| **Matière** | Variation dureté matière première (±5 HRC) |
| **Milieu** | Température atelier non contrôlée |
| **Mesure** | Fréquence contrôle SPC trop faible |

### 4.2 Analyse de régression
| Variable X | Impact sur rebut | R² | Significatif |
|------------|-----------------|----|----|
| Température atelier | Fort | 0,72 | Oui |
| Usure outil | Fort | 0,68 | Oui |
| Dureté matière | Modéré | 0,45 | Oui |
| Opérateur | Faible | 0,18 | Non |

---

# PHASE IMPROVE - 100% COMPLÉTÉ ✅

## 5. SOLUTIONS IMPLÉMENTÉES

| # | Solution | Date | Coût | Impact mesuré |
|---|----------|------|------|---------------|
| 1 | Climatisation atelier (20±1°C) | 15/06/2025 | 18 000 € | -45% rebuts |
| 2 | Banc préréglage Zoller | 01/07/2025 | 28 000 € | -30% rebuts |
| 3 | Outillage premium Sandvik | 15/07/2025 | 12 000 € | -15% rebuts |
| 4 | Formation SPC opérateurs | 30/07/2025 | 4 500 € | -5% rebuts |
| 5 | Palpage pièce automatique | 15/08/2025 | 8 500 € | -10% rebuts |

## 6. RÉSULTATS POST-IMPROVE

### 6.1 Évolution taux de rebut
| Mois | Production | Rebuts | Taux | Actions |
|------|------------|--------|------|---------|
| Avril | 4 480 | 179 | 4,0% | Baseline |
| Mai | 4 520 | 167 | 3,7% | Formation |
| Juin | 4 380 | 98 | 2,2% | Climatisation |
| Juillet | 4 650 | 65 | 1,4% | Préréglage + outils |
| Août | 4 420 | 35 | 0,8% | Palpage |
| Sept | 4 580 | 28 | 0,6% | Stabilisation |
| Oct | 4 510 | 27 | 0,6% | Contrôle |
| Nov | 4 620 | 26 | 0,6% | Contrôle |

### 6.2 Graphique évolution
```
Taux rebut (%)
5% ┤ ●──●
4% ┤      ╲
3% ┤       ╲
2% ┤        ●
1% ┤          ╲●
   │              ╲●──●──●──●  Objectif 0,5%
0% ┼────────────────────────────────────────────
   Avr  Mai  Jun  Jul  Aoû  Sep  Oct  Nov
```

### 6.3 Capabilité après amélioration
| Cote | Cp avant | Cpk avant | Cp après | Cpk après |
|------|----------|-----------|----------|-----------|
| Ø45 h7 | 0,69 | 0,65 | 1,82 | 1,75 |
| L 180 | 0,76 | 0,62 | 1,68 | 1,62 |
| Ra | - | 0,38 | - | 1,45 |
| **Moyenne** | **0,72** | **0,55** | **1,75** | **1,61** |

### 6.4 Indicateurs Six Sigma comparatifs
| Indicateur | Baseline | Post-Improve | Amélioration |
|------------|----------|--------------|--------------|
| Taux rebut | 4,2% | 0,6% | -86% |
| DPMO | 42 000 | 6 000 | -86% |
| Niveau Sigma | 3,2 σ | 4,4 σ | +1,2 σ |
| Cpk moyen | 0,55 | 1,61 | +193% |

---

# PHASE CONTROL - 50% COMPLÉTÉ 🔄

## 7. PLAN DE CONTRÔLE (100% complété)

| Étape process | Caractéristique | Spécification | Méthode mesure | Échantillon | Fréquence | Méthode contrôle | Plan réaction |
|--------------|-----------------|---------------|----------------|-------------|-----------|------------------|---------------|
| Réception matière | Dureté | 28-32 HRC | Duromètre | 3/lot | Chaque lot | Certificat + contrôle | Refus si hors spec |
| Préréglage outil | Longueur/Ø | ±0,002 mm | Banc Zoller | 100% outils | Chaque changement | Mesure automatique | Correction immédiate |
| Usinage T1 | Ø45 h7 | 44,975-45,025 | Palpage | 1ère pièce | Chaque série | Palpage auto + SPC | Arrêt + ajustement |
| Usinage T2 | L 180 | ±0,05 | Palpage | 1ère pièce | Chaque série | Palpage auto + SPC | Arrêt + ajustement |
| Finition | Ra | < 1,6 µm | Rugosimètre | 5 pièces | 2x/équipe | Carte X-barre | Changement outil |
| Contrôle final | Toutes cotes | Plan | MMT | 5/100 pièces | AQL 0,65 | Carte p | Tri 100% si NC |

## 8. CARTES DE CONTRÔLE SPC (100% complété)

### 8.1 Carte X-barre pour Ø45 h7
**Paramètres:**
- LCS = 45,015 mm
- Ligne centrale = 44,998 mm
- LCI = 44,981 mm
- Sous-groupe = 5 pièces

```
     45,020 ┤                                        UCL = 45,015
            │─────────────────────────────────────────────────────
     45,010 ┤
            │     ●       ●   ●       ●   ●
     45,000 ┼─●─────●───────●───●─────────────●───●───●── CL = 44,998
            │   ●     ●         ●   ●     ●     ●
     44,990 ┤
            │─────────────────────────────────────────────────────
     44,980 ┤                                        LCL = 44,981
            └─────────────────────────────────────────────────────
              1   2   3   4   5   6   7   8   9  10  11  12
                              Semaine
```
**Statut:** Processus sous contrôle ✅

### 8.2 Carte R pour Ø45 h7
**Paramètres:**
- LCS = 0,022 mm
- R-barre = 0,010 mm
- LCI = 0

```
     0,025 ┤                                        UCL = 0,022
           │──────────────────────────────────────────────────
     0,020 ┤
           │       ●
     0,015 ┤   ●       ●           ●       ●
     0,010 ┼─────●───────●───●───────●───────●───●──── R-bar = 0,010
           │                   ●               ●
     0,005 ┤ ●             ●           ●
           │
     0,000 ┤                                        LCL = 0
           └──────────────────────────────────────────────────
             1   2   3   4   5   6   7   8   9  10  11  12
```
**Statut:** Processus sous contrôle ✅

### 8.3 Carte p pour taux de rebut
**Paramètres:**
- LCS = 1,2%
- p-barre = 0,6%
- LCI = 0%

```
     1,5% ┤
          │                                         UCL = 1,2%
     1,0% ┤─────────────────────────────────────────────────
          │
     0,5% ┼───●───●───●───●───●───●───●───●───●──── p-bar = 0,6%
          │ ●   ●       ●           ●       ●   ●
     0,0% ┤                                         LCL = 0%
          └─────────────────────────────────────────────────
            S36 S37 S38 S39 S40 S41 S42 S43 S44 S45
```
**Statut:** Processus sous contrôle ✅

---

## 9. AMDEC MISE À JOUR - CONTROL (100% complété)

| Étape | Mode défaillance | S | O | D | RPN avant | Actions control | S | O | D | RPN après |
|-------|-----------------|---|---|---|-----------|-----------------|---|---|---|-----------|
| Usinage | Cote hors tol. | 7 | 5 | 4 | 140 | Palpage 100% + SPC | 7 | 2 | 2 | 28 |
| Usinage | Dérive thermique | 6 | 6 | 5 | 180 | Climatisation + monitoring | 6 | 1 | 2 | 12 |
| Outil | Usure prématurée | 5 | 4 | 5 | 100 | Préréglage + suivi durée vie | 5 | 2 | 2 | 20 |
| Finition | Ra non conforme | 6 | 4 | 4 | 96 | SPC + changement outil préventif | 6 | 2 | 2 | 24 |

**RPN moyen:** 129 → 21 (-84%)

---

## 10. FORMATION (80% complété)

### 10.1 Plan de formation
| Formation | Public | Formateur | Date prévue | Date réelle | Participants | Statut |
|-----------|--------|-----------|-------------|-------------|--------------|--------|
| SPC niveau 1 | Opérateurs CNC | T. DUBOIS | 15/07/2025 | 15/07/2025 | 12/12 | ✅ |
| SPC niveau 2 | Régleurs | T. DUBOIS | 30/07/2025 | 30/07/2025 | 4/4 | ✅ |
| Banc Zoller | Régleurs | Zoller | 05/07/2025 | 05/07/2025 | 4/4 | ✅ |
| Palpage pièce | Opérateurs | Renishaw | 20/08/2025 | 20/08/2025 | 12/12 | ✅ |
| Interprétation cartes | Chefs équipe | T. DUBOIS | 15/09/2025 | 15/09/2025 | 3/3 | ✅ |
| Refresh SPC | Nouveaux | L. DUVAL | 15/01/2026 | - | 2 prévus | 📅 |

### 10.2 Évaluation efficacité
| Formation | Méthode évaluation | Résultat | Statut |
|-----------|-------------------|----------|--------|
| SPC niveau 1 | Test + observation terrain | 92% réussite | ✅ Efficace |
| SPC niveau 2 | Audit cartes contrôle | 100% conformes | ✅ Efficace |
| Banc Zoller | Taux erreur préréglage | < 0,5% | ✅ Efficace |
| Palpage | Nb incidents | 0 | ✅ Efficace |

---

## 11. CALCUL DES GAINS (100% complété)

### 11.1 Gains financiers validés
| Indicateur | Baseline | Réalisé | Économie | Validation |
|------------|----------|---------|----------|------------|
| Rebuts /mois | 188 pièces | 27 pièces | 161 pièces | ✅ Finance |
| Coût rebut /mois | 15 580 € | 1 850 € | **13 730 €** | ✅ Finance |
| **Économie annuelle** | | | **164 760 €** | ✅ Validé |

### 11.2 Validation gains par Finance
| Élément | Signataire | Date |
|---------|-----------|------|
| Économies matière | C. ROBERT (Contrôle gestion) | 15/10/2025 |
| Économies main d'œuvre | C. ROBERT | 15/10/2025 |
| Économies machine | C. ROBERT | 15/10/2025 |
| **Validation finale** | **M. RENARD (Dir. Financier)** | **20/10/2025** |

### 11.3 Type de gains
| Type | Montant | % |
|------|---------|---|
| Hard savings (réduction coût direct) | 142 600 € | 87% |
| Soft savings (productivité, qualité) | 22 160 € | 13% |
| **Total** | **164 760 €** | 100% |

---

## 12. DOCUMENTATION MISE À JOUR (60% complété)

### 12.1 Documents créés/mis à jour
| Document | Code | Version | Date | Statut |
|----------|------|---------|------|--------|
| Gamme usinage axes AT | GAM-USI-AT-001 | 3.0 | 01/09/2025 | ✅ Publié |
| Procédure préréglage | PRO-PRE-001 | 1.0 | 10/07/2025 | ✅ Publié |
| Instruction SPC usinage | INS-SPC-USI-001 | 1.0 | 20/07/2025 | ✅ Publié |
| Fiche réaction NC | FIC-REA-USI-001 | 1.0 | 01/08/2025 | ✅ Publié |
| Mode opératoire palpage | MOP-PAL-001 | 1.0 | 25/08/2025 | ✅ Publié |
| Plan de contrôle | PDC-AT-001 | 2.0 | 15/09/2025 | ✅ Publié |
| Leçon ponctuelle (OPL) | OPL-SPC-001 à 005 | 1.0 | Divers | ✅ Affichés |
| Manuel opérateur | MAN-USI-AT | 3.0 | - | 🔄 En cours |

### 12.2 Points en cours
- Manuel opérateur : mise à jour avec nouvelles procédures (prévu 15/02/2026)
- Formation nouveaux arrivants : module e-learning en création

---

## 13. TRANSFERT AU PROPRIÉTAIRE PROCESSUS (40% complété)

### 13.1 Checklist transfert
| Élément | Responsable transféré | Date | Statut |
|---------|----------------------|------|--------|
| Responsabilité SPC quotidien | Chefs d'équipe | 01/10/2025 | ✅ |
| Mise à jour cartes contrôle | Technicien qualité | 01/10/2025 | ✅ |
| Réponse aux dérives | Régleurs | 15/10/2025 | ✅ |
| Suivi indicateurs | L. DUVAL (Resp. atelier) | 01/11/2025 | ✅ |
| Revue mensuelle | L. DUVAL | 01/11/2025 | ✅ |
| Audit plan contrôle | I. GAUDIN (Qualité) | 01/12/2025 | 🔄 1er audit fait |
| Formation nouveaux | L. DUVAL | - | 📅 À planifier |
| Clôture projet formelle | Sponsor | - | 📅 Prévu 28/02/2026 |

### 13.2 Réunions de transfert
| Réunion | Date | Participants | Décisions |
|---------|------|--------------|-----------|
| Transfert SPC | 01/10/2025 | Équipe projet + Chefs équipe | Process validé |
| Revue M+1 | 05/11/2025 | L. DUVAL + T. DUBOIS | OK, maintien gains |
| Revue M+2 | 03/12/2025 | L. DUVAL + T. DUBOIS | OK, processus stable |
| Audit plan contrôle | 15/12/2025 | I. GAUDIN | 1 écart mineur (corrigé) |
| Revue M+3 | - | Planifiée 08/01/2026 | - |

---

## 14. REVUE DE PHASE CONTROL ET CLÔTURE (EN COURS - 50%)

### 14.1 Checklist phase Control
| Livrable | Statut | Commentaire |
|----------|--------|-------------|
| Plan de contrôle défini | ✅ 100% | En application |
| Cartes SPC en place | ✅ 100% | 3 cartes actives |
| Processus sous contrôle | ✅ 100% | 12 semaines stables |
| AMDEC mise à jour | ✅ 100% | RPN réduit 84% |
| Formation réalisée | ✅ 80% | Refresh prévu |
| Gains calculés et validés | ✅ 100% | 164 760 €/an |
| Documentation à jour | 🔄 60% | Manuel en cours |
| Transfert propriétaire | 🔄 40% | En cours |
| Audit plan contrôle | 🔄 50% | 1/2 audits faits |
| Clôture formelle | 📅 0% | Prévu 28/02/2026 |

### 14.2 Leçons apprises (draft)
| Domaine | Leçon | Application future |
|---------|-------|-------------------|
| Technique | Température atelier = facteur critique | Étendre climatisation autres zones |
| Méthode | Préréglage systématique = ROI rapide | Déployer autres machines |
| Organisation | SPC par opérateurs = appropriation | Former tous les ateliers |
| Projet | Implication opérateurs dès Measure = succès | Systématiser |

### 14.3 Opportunités de réplication
| Secteur | Potentiel | Priorité |
|---------|-----------|----------|
| Centre usinage MAZAK | Fort (même problématique) | 1 |
| Tour CNC Mori Seiki | Modéré | 2 |
| Rectifieuse | Faible | 3 |

---

## 15. PROCHAINES ÉTAPES AVANT CLÔTURE

| Action | Responsable | Échéance | Statut |
|--------|-------------|----------|--------|
| Finaliser manuel opérateur | C. RIVIERE | 15/02/2026 | 🔄 50% |
| 2ème audit plan contrôle | I. GAUDIN | 31/01/2026 | 📅 |
| Revue gains M+4 | T. DUBOIS + Finance | 31/01/2026 | 📅 |
| Formation refresh nouveaux | L. DUVAL | 15/02/2026 | 📅 |
| Clôture formelle projet | Sponsor | 28/02/2026 | 📅 |
| Célébration équipe | L. DUVAL | 28/02/2026 | 📅 |

---

## INDICATEURS DE SUIVI PROJET

### Dashboard projet
```
Avancement global: ██████████████████░░ 90%

Phase DEFINE:     ████████████████████ 100%
Phase MEASURE:    ████████████████████ 100%
Phase ANALYZE:    ████████████████████ 100%
Phase IMPROVE:    ████████████████████ 100%
Phase CONTROL:    ██████████░░░░░░░░░░ 50%
```

### Suivi mensuel des KPIs
| Mois | Taux rebut | Cpk | Coût rebut | Cartes OK |
|------|------------|-----|------------|-----------|
| Sept 2025 | 0,6% | 1,58 | 1 920 € | 3/3 |
| Oct 2025 | 0,6% | 1,61 | 1 850 € | 3/3 |
| Nov 2025 | 0,6% | 1,62 | 1 780 € | 3/3 |
| Déc 2025 | 0,5% | 1,65 | 1 650 € | 3/3 |
| Jan 2026 | 0,6% | 1,63 | 1 820 € | 3/3 |

### Stabilité du processus
```
Taux rebut mensuel (%)
2% ┤
   │
1% ┤─────────────────────────────────────── Objectif: 0,5%
   │ ●───●───●───●───●───●
0% ┼──────────────────────────────────────────────────────
   Sep  Oct  Nov  Déc  Jan  Fév
```

**Processus STABLE depuis 5 mois** ✅

---

## CONCLUSION PROVISOIRE

Le projet DMAIC-2025-QUA-005 a atteint ses objectifs principaux :
- **Taux de rebut :** 4,2% → 0,6% (-86%)
- **Économies validées :** 164 760 €/an
- **Niveau Sigma :** 3,2 → 4,4 (+1,2 σ)
- **Capabilité :** Cpk 0,55 → 1,61 (+193%)

Les actions de pérennisation sont en cours. La clôture formelle est planifiée pour le 28/02/2026.

---

*Document généré le 20/03/2026*
*Prochaine mise à jour: Clôture projet (28/02/2026)*
