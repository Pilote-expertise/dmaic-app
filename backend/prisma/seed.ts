import { PrismaClient, DmaicPhase, ToolPriority, TemplateType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const toolDefinitions = [
  // ============ DEFINE ============
  {
    code: 'ROI',
    name: 'ROI',
    nameFr: 'Retour sur Investissement',
    description: 'Calculate the expected return on investment for the project',
    descriptionFr: 'Calculer le retour sur investissement attendu du projet',
    phase: 'DEFINE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'FORM' as TemplateType,
    order: 1,
    schema: {
      fields: [
        { name: 'investmentCost', label: 'Coût de l\'investissement', type: 'currency', required: true },
        { name: 'expectedSavings', label: 'Économies attendues (annuel)', type: 'currency', required: true },
        { name: 'paybackPeriod', label: 'Période de retour', type: 'calculated', formula: 'investmentCost / expectedSavings' },
        { name: 'roiPercentage', label: 'ROI (%)', type: 'calculated', formula: '((expectedSavings - investmentCost) / investmentCost) * 100' },
        { name: 'assumptions', label: 'Hypothèses', type: 'textarea' },
        { name: 'risks', label: 'Risques financiers', type: 'textarea' }
      ]
    },
    helpContent: `# ROI - Retour sur Investissement\n\nLe ROI permet de justifier financièrement le projet DMAIC.\n\n## Formules\n- Période de retour = Investissement / Économies annuelles\n- ROI = ((Économies - Investissement) / Investissement) × 100%\n\n## Conseils\n- Soyez conservateur dans vos estimations\n- Documentez vos hypothèses\n- Incluez les coûts cachés`
  },
  {
    code: 'FINANCIAL_JUSTIFICATION',
    name: 'Financial Justification',
    nameFr: 'Justification Financière',
    description: 'Document the financial case for the project',
    descriptionFr: 'Documenter le cas financier du projet',
    phase: 'DEFINE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'FORM' as TemplateType,
    order: 2,
    schema: {
      fields: [
        { name: 'currentCosts', label: 'Coûts actuels', type: 'currency', required: true },
        { name: 'targetCosts', label: 'Coûts cibles', type: 'currency', required: true },
        { name: 'savingsType', label: 'Type d\'économies', type: 'select', options: ['Réduction coûts', 'Évitement coûts', 'Augmentation revenus'] },
        { name: 'timeline', label: 'Horizon temporel', type: 'select', options: ['1 an', '2 ans', '3 ans', '5 ans'] },
        { name: 'justification', label: 'Justification détaillée', type: 'richtext', required: true }
      ]
    },
    helpContent: `# Justification Financière\n\nCe document présente l'analyse coût-bénéfice du projet.`
  },
  {
    code: 'PROJECT_CHARTER',
    name: 'Project Charter',
    nameFr: 'Charte de Projet',
    description: 'Define the project scope, objectives, and team',
    descriptionFr: 'Définir le périmètre, les objectifs et l\'équipe du projet',
    phase: 'DEFINE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'FORM' as TemplateType,
    order: 3,
    schema: {
      sections: [
        {
          name: 'identification',
          label: 'Identification du projet',
          fields: [
            { name: 'projectName', label: 'Nom du projet', type: 'text', required: true },
            { name: 'projectCode', label: 'Code projet', type: 'text' },
            { name: 'department', label: 'Service / Département', type: 'text' },
            { name: 'problemStatement', label: 'Description du problème', type: 'textarea', required: true }
          ]
        },
        {
          name: 'scope',
          label: 'Périmètre',
          fields: [
            { name: 'inScope', label: 'Inclus dans le périmètre', type: 'textarea', required: true },
            { name: 'outOfScope', label: 'Exclus du périmètre', type: 'textarea' }
          ]
        },
        {
          name: 'objectives',
          label: 'Objectifs',
          fields: [
            { name: 'mainObjective', label: 'Objectif principal', type: 'textarea', required: true },
            { name: 'currentValue', label: 'Valeur actuelle', type: 'number' },
            { name: 'targetValue', label: 'Valeur cible', type: 'number' },
            { name: 'unit', label: 'Unité de mesure', type: 'text' }
          ]
        },
        {
          name: 'timeline',
          label: 'Planning',
          fields: [
            { name: 'startDate', label: 'Date de début', type: 'date' },
            { name: 'endDate', label: 'Date de fin prévue', type: 'date' },
            { name: 'milestones', label: 'Jalons DMAIC', type: 'milestones' }
          ]
        },
        {
          name: 'team',
          label: 'Équipe',
          fields: [
            { name: 'sponsor', label: 'Sponsor', type: 'user' },
            { name: 'projectLeader', label: 'Chef de projet', type: 'user' },
            { name: 'teamMembers', label: 'Membres de l\'équipe', type: 'userList' }
          ]
        }
      ]
    },
    helpContent: `# Charte de Projet\n\nLa charte de projet est le document fondateur du projet DMAIC. Elle définit :\n- Le problème à résoudre\n- Le périmètre d'intervention\n- Les objectifs mesurables\n- L'équipe et les responsabilités\n- Le planning prévisionnel\n\n## Conseils\n- L'objectif doit être SMART (Spécifique, Mesurable, Atteignable, Réaliste, Temporel)\n- Le périmètre doit être clairement délimité\n- L'équipe doit inclure les parties prenantes clés`
  },
  {
    code: 'CTQ',
    name: 'CTQ',
    nameFr: 'Critical To Quality',
    description: 'Identify critical to quality characteristics',
    descriptionFr: 'Identifier les caractéristiques critiques pour la qualité',
    phase: 'DEFINE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'MATRIX' as TemplateType,
    order: 4,
    schema: {
      columns: [
        { name: 'customerNeed', label: 'Besoin client', type: 'text' },
        { name: 'ctqCharacteristic', label: 'Caractéristique CTQ', type: 'text' },
        { name: 'specification', label: 'Spécification', type: 'text' },
        { name: 'lowerLimit', label: 'Limite inférieure', type: 'number' },
        { name: 'target', label: 'Cible', type: 'number' },
        { name: 'upperLimit', label: 'Limite supérieure', type: 'number' },
        { name: 'unit', label: 'Unité', type: 'text' },
        { name: 'measureMethod', label: 'Méthode de mesure', type: 'text' }
      ]
    },
    helpContent: `# CTQ - Critical To Quality\n\nLes CTQ traduisent la voix du client en caractéristiques mesurables.\n\n## Processus\n1. Identifier les besoins clients (VOC)\n2. Traduire en caractéristiques techniques\n3. Définir les spécifications\n4. Établir les méthodes de mesure`
  },
  {
    code: 'SIX_SIGMA_INDICATORS',
    name: 'Six Sigma Indicators',
    nameFr: 'Indicateurs Six Sigma',
    description: 'Define and track Six Sigma metrics',
    descriptionFr: 'Définir et suivre les indicateurs Six Sigma',
    phase: 'DEFINE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'FORM' as TemplateType,
    order: 5,
    schema: {
      fields: [
        { name: 'dpmo', label: 'DPMO (Défauts Par Million d\'Opportunités)', type: 'number' },
        { name: 'sigmaLevel', label: 'Niveau Sigma', type: 'calculated' },
        { name: 'yield', label: 'Rendement (%)', type: 'number' },
        { name: 'defectRate', label: 'Taux de défauts (%)', type: 'number' },
        { name: 'opportunitiesPerUnit', label: 'Opportunités par unité', type: 'number' },
        { name: 'baseline', label: 'Baseline (état initial)', type: 'number' },
        { name: 'target', label: 'Objectif', type: 'number' }
      ]
    },
    helpContent: `# Indicateurs Six Sigma\n\nLes indicateurs Six Sigma permettent de quantifier la performance du processus.\n\n## Métriques clés\n- DPMO = (Nombre de défauts / Opportunités totales) × 1 000 000\n- Niveau Sigma : convertir DPMO en niveau sigma\n- Rendement = 1 - Taux de défauts`
  },
  {
    code: 'PROJECT_RISK_ANALYSIS',
    name: 'Project Risk Analysis',
    nameFr: 'Analyse des Risques du Projet',
    description: 'Identify and assess project risks',
    descriptionFr: 'Identifier et évaluer les risques du projet',
    phase: 'DEFINE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'MATRIX' as TemplateType,
    order: 6,
    schema: {
      columns: [
        { name: 'risk', label: 'Risque', type: 'text' },
        { name: 'category', label: 'Catégorie', type: 'select', options: ['Technique', 'Ressources', 'Planning', 'Budget', 'Organisationnel'] },
        { name: 'probability', label: 'Probabilité (1-5)', type: 'rating' },
        { name: 'impact', label: 'Impact (1-5)', type: 'rating' },
        { name: 'riskScore', label: 'Score', type: 'calculated' },
        { name: 'mitigation', label: 'Plan de mitigation', type: 'text' },
        { name: 'owner', label: 'Responsable', type: 'text' },
        { name: 'status', label: 'Statut', type: 'select', options: ['Ouvert', 'En cours', 'Résolu', 'Accepté'] }
      ]
    },
    helpContent: `# Analyse des Risques\n\nIdentifiez les risques pouvant impacter le succès du projet.\n\n## Échelle\n- Probabilité : 1 (rare) à 5 (quasi-certain)\n- Impact : 1 (mineur) à 5 (critique)\n- Score = Probabilité × Impact`
  },
  {
    code: 'PROJECT_REVIEW',
    name: 'Project Review',
    nameFr: 'Examen de Projet',
    description: 'Review and validate phase completion',
    descriptionFr: 'Revoir et valider la complétion de la phase',
    phase: 'DEFINE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CHECKLIST' as TemplateType,
    order: 7,
    schema: {
      sections: [
        {
          name: 'deliverables',
          label: 'Livrables de la phase',
          items: [
            { name: 'charterComplete', label: 'Charte de projet complète et validée' },
            { name: 'ctqDefined', label: 'CTQ définis' },
            { name: 'scopeClear', label: 'Périmètre clairement défini' },
            { name: 'teamAssigned', label: 'Équipe constituée' },
            { name: 'sponsorApproval', label: 'Approbation du sponsor' }
          ]
        },
        {
          name: 'quality',
          label: 'Qualité des livrables',
          items: [
            { name: 'dataAccurate', label: 'Données précises et vérifiées' },
            { name: 'objectivesSmart', label: 'Objectifs SMART' },
            { name: 'stakeholdersIdentified', label: 'Parties prenantes identifiées' }
          ]
        }
      ],
      fields: [
        { name: 'reviewDate', label: 'Date de revue', type: 'date' },
        { name: 'reviewer', label: 'Réviseur', type: 'text' },
        { name: 'decision', label: 'Décision', type: 'select', options: ['Approuvé', 'Approuvé avec réserves', 'Refusé'] },
        { name: 'comments', label: 'Commentaires', type: 'textarea' }
      ]
    },
    helpContent: `# Examen de Projet - Phase Define\n\nL'examen de projet valide que tous les livrables de la phase sont complets et de qualité suffisante pour passer à la phase suivante.`
  },

  // ============ MEASURE ============
  {
    code: 'PARETO',
    name: 'Pareto Chart',
    nameFr: 'Diagramme de Pareto',
    description: 'Identify the vital few causes',
    descriptionFr: 'Identifier les causes principales (règle des 80/20)',
    phase: 'MEASURE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CHART' as TemplateType,
    order: 1,
    schema: {
      dataInput: {
        columns: [
          { name: 'category', label: 'Catégorie', type: 'text' },
          { name: 'count', label: 'Fréquence', type: 'number' },
          { name: 'percentage', label: 'Pourcentage', type: 'calculated' },
          { name: 'cumulative', label: 'Cumulé', type: 'calculated' }
        ]
      },
      chartConfig: {
        type: 'pareto',
        barColor: '#2563eb',
        lineColor: '#dc2626',
        threshold: 80
      }
    },
    helpContent: `# Diagramme de Pareto\n\nLe diagramme de Pareto aide à identifier les causes les plus significatives (80% des problèmes viennent de 20% des causes).\n\n## Utilisation\n1. Lister toutes les catégories de problèmes\n2. Compter la fréquence de chaque catégorie\n3. Trier par ordre décroissant\n4. Calculer le pourcentage cumulé\n5. Identifier les catégories représentant 80% des problèmes`
  },
  {
    code: 'DATA_COLLECTION_PLAN',
    name: 'Data Collection Plan',
    nameFr: 'Plan de Collecte de Données',
    description: 'Plan how data will be collected',
    descriptionFr: 'Planifier la collecte des données',
    phase: 'MEASURE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'MATRIX' as TemplateType,
    order: 2,
    schema: {
      columns: [
        { name: 'measure', label: 'Mesure', type: 'text' },
        { name: 'measureType', label: 'Type', type: 'select', options: ['Input (X)', 'Process', 'Output (Y)'] },
        { name: 'dataType', label: 'Type de données', type: 'select', options: ['Continue', 'Discrète', 'Attribut'] },
        { name: 'operationalDefinition', label: 'Définition opérationnelle', type: 'text' },
        { name: 'measurementMethod', label: 'Méthode de mesure', type: 'text' },
        { name: 'sampleSize', label: 'Taille échantillon', type: 'number' },
        { name: 'frequency', label: 'Fréquence', type: 'text' },
        { name: 'responsible', label: 'Responsable', type: 'text' },
        { name: 'location', label: 'Où collecter', type: 'text' }
      ]
    },
    helpContent: `# Plan de Collecte de Données\n\nCe plan définit quelles données collecter, comment et par qui.\n\n## Éléments clés\n- Définition opérationnelle précise\n- Méthode de mesure standardisée\n- Taille d'échantillon suffisante\n- Responsabilités claires`
  },
  {
    code: 'DISTRIBUTION_TESTS',
    name: 'Distribution Tests',
    nameFr: 'Tests de Distribution de Probabilité',
    description: 'Test data distribution (normality, etc.)',
    descriptionFr: 'Tester la distribution des données (normalité, etc.)',
    phase: 'MEASURE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CALCULATION' as TemplateType,
    order: 3,
    schema: {
      tests: [
        { name: 'shapiroWilk', label: 'Test de Shapiro-Wilk' },
        { name: 'andersonDarling', label: 'Test d\'Anderson-Darling' },
        { name: 'kolmogorovSmirnov', label: 'Test de Kolmogorov-Smirnov' }
      ],
      fields: [
        { name: 'dataInput', label: 'Données', type: 'dataArray' },
        { name: 'alpha', label: 'Niveau de signification (α)', type: 'number', default: 0.05 },
        { name: 'testResult', label: 'Résultat du test', type: 'calculated' },
        { name: 'pValue', label: 'p-value', type: 'calculated' },
        { name: 'conclusion', label: 'Conclusion', type: 'calculated' },
        { name: 'histogram', label: 'Histogramme', type: 'chart' },
        { name: 'qqPlot', label: 'QQ-Plot', type: 'chart' }
      ]
    },
    helpContent: `# Tests de Distribution\n\nVérifiez si vos données suivent une distribution normale.\n\n## Interprétation\n- p-value > α : données normales\n- p-value < α : données non normales\n\nSi les données ne sont pas normales, utilisez des méthodes non-paramétriques.`
  },
  {
    code: 'MSA',
    name: 'MSA',
    nameFr: 'Analyse du Système de Mesure',
    description: 'Measurement System Analysis',
    descriptionFr: 'Analyse du Système de Mesure (R&R, biais, linéarité)',
    phase: 'MEASURE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CALCULATION' as TemplateType,
    order: 4,
    schema: {
      studyType: ['Gage R&R', 'Biais', 'Linéarité', 'Stabilité'],
      fields: [
        { name: 'measurementName', label: 'Nom de la mesure', type: 'text' },
        { name: 'operators', label: 'Opérateurs', type: 'number' },
        { name: 'parts', label: 'Pièces', type: 'number' },
        { name: 'trials', label: 'Répétitions', type: 'number' },
        { name: 'tolerance', label: 'Tolérance', type: 'number' },
        { name: 'data', label: 'Données de mesure', type: 'matrix' },
        { name: 'repeatability', label: 'Répétabilité', type: 'calculated' },
        { name: 'reproducibility', label: 'Reproductibilité', type: 'calculated' },
        { name: 'gageRR', label: 'Gage R&R (%)', type: 'calculated' },
        { name: 'ndc', label: 'Nombre de catégories distinctes', type: 'calculated' },
        { name: 'conclusion', label: 'Conclusion', type: 'select', options: ['Acceptable (<10%)', 'Marginal (10-30%)', 'Inacceptable (>30%)'] }
      ]
    },
    helpContent: `# MSA - Analyse du Système de Mesure\n\nL'MSA valide que votre système de mesure est fiable.\n\n## Critères d'acceptation Gage R&R\n- < 10% : Acceptable\n- 10-30% : Marginal (peut être acceptable selon contexte)\n- > 30% : Inacceptable\n\n## NDC (Nombre de catégories distinctes)\n- Doit être ≥ 5`
  },
  {
    code: 'SAMPLE_SIZE',
    name: 'Sample Size Determination',
    nameFr: 'Détermination de l\'Effectif de l\'Échantillon',
    description: 'Calculate required sample size',
    descriptionFr: 'Calculer la taille d\'échantillon nécessaire',
    phase: 'MEASURE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CALCULATION' as TemplateType,
    order: 5,
    schema: {
      calculators: [
        { name: 'mean', label: 'Pour estimation de moyenne' },
        { name: 'proportion', label: 'Pour estimation de proportion' },
        { name: 'comparison', label: 'Pour comparaison de moyennes' }
      ],
      fields: [
        { name: 'confidenceLevel', label: 'Niveau de confiance (%)', type: 'select', options: [90, 95, 99] },
        { name: 'marginOfError', label: 'Marge d\'erreur', type: 'number' },
        { name: 'populationStdDev', label: 'Écart-type estimé', type: 'number' },
        { name: 'populationSize', label: 'Taille de la population (optionnel)', type: 'number' },
        { name: 'calculatedSampleSize', label: 'Taille d\'échantillon calculée', type: 'calculated' },
        { name: 'actualSampleSize', label: 'Taille d\'échantillon retenue', type: 'number' },
        { name: 'justification', label: 'Justification', type: 'textarea' }
      ]
    },
    helpContent: `# Détermination de la Taille d'Échantillon\n\nCalculez la taille d'échantillon nécessaire pour avoir des résultats statistiquement significatifs.\n\n## Facteurs influençant la taille\n- Niveau de confiance souhaité\n- Marge d'erreur acceptable\n- Variabilité des données\n- Taille de la population`
  },
  {
    code: 'CTQ_MEASURE',
    name: 'CTQ Measurement',
    nameFr: 'Mesure des CTQ',
    description: 'Measure CTQ characteristics defined in Define phase',
    descriptionFr: 'Mesurer les caractéristiques CTQ définies en phase Define',
    phase: 'MEASURE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'MATRIX' as TemplateType,
    order: 6,
    schema: {
      inheritFrom: 'CTQ',
      additionalColumns: [
        { name: 'measuredValue', label: 'Valeur mesurée', type: 'number' },
        { name: 'sampleSize', label: 'n', type: 'number' },
        { name: 'stdDev', label: 'Écart-type', type: 'number' },
        { name: 'cp', label: 'Cp', type: 'calculated' },
        { name: 'cpk', label: 'Cpk', type: 'calculated' },
        { name: 'status', label: 'Statut', type: 'status' }
      ]
    },
    helpContent: `# Mesure des CTQ\n\nCette matrice reprend les CTQ définis en phase Define et documente les mesures réelles.\n\n## Indicateurs de capabilité\n- Cp : Capabilité potentielle\n- Cpk : Capabilité réelle (centrée)\n- Objectif : Cpk ≥ 1.33`
  },
  {
    code: 'PROJECT_REVIEW_MEASURE',
    name: 'Project Review - Measure',
    nameFr: 'Examen de Projet - Measure',
    description: 'Review and validate Measure phase completion',
    descriptionFr: 'Revoir et valider la complétion de la phase Measure',
    phase: 'MEASURE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CHECKLIST' as TemplateType,
    order: 7,
    schema: {
      sections: [
        {
          name: 'deliverables',
          label: 'Livrables de la phase',
          items: [
            { name: 'dataCollected', label: 'Données collectées selon le plan' },
            { name: 'msaCompleted', label: 'MSA réalisé et acceptable' },
            { name: 'baselineEstablished', label: 'Baseline établie' },
            { name: 'capabilityCalculated', label: 'Capabilité calculée' }
          ]
        }
      ],
      fields: [
        { name: 'reviewDate', label: 'Date de revue', type: 'date' },
        { name: 'decision', label: 'Décision', type: 'select', options: ['Approuvé', 'Approuvé avec réserves', 'Refusé'] },
        { name: 'comments', label: 'Commentaires', type: 'textarea' }
      ]
    },
    helpContent: `# Examen de Projet - Phase Measure\n\nValidez que les mesures sont fiables et que la baseline est établie.`
  },

  // ============ ANALYZE ============
  {
    code: 'SAMPLE_SIZE_ANALYZE',
    name: 'Sample Size Verification',
    nameFr: 'Vérification de l\'Effectif de l\'Échantillon',
    description: 'Verify sample size adequacy for analysis',
    descriptionFr: 'Vérifier l\'adéquation de la taille d\'échantillon pour l\'analyse',
    phase: 'ANALYZE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CALCULATION' as TemplateType,
    order: 1,
    schema: {
      inheritFrom: 'SAMPLE_SIZE',
      fields: [
        { name: 'actualSize', label: 'Taille réelle', type: 'number' },
        { name: 'requiredSize', label: 'Taille requise', type: 'number' },
        { name: 'adequate', label: 'Adéquat', type: 'calculated' },
        { name: 'power', label: 'Puissance statistique', type: 'calculated' }
      ]
    },
    helpContent: `# Vérification de la Taille d'Échantillon\n\nVérifiez que votre échantillon est suffisant pour les analyses prévues.`
  },
  {
    code: 'MSA_ANALYZE',
    name: 'MSA Verification',
    nameFr: 'Vérification MSA',
    description: 'Verify measurement system for analysis phase',
    descriptionFr: 'Vérifier le système de mesure pour la phase d\'analyse',
    phase: 'ANALYZE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CALCULATION' as TemplateType,
    order: 2,
    schema: {
      inheritFrom: 'MSA',
      fields: [
        { name: 'previousResult', label: 'Résultat précédent', type: 'text' },
        { name: 'currentStatus', label: 'Statut actuel', type: 'select', options: ['Toujours valide', 'À réévaluer', 'Réévalué'] },
        { name: 'notes', label: 'Notes', type: 'textarea' }
      ]
    },
    helpContent: `# Vérification MSA\n\nConfirmez que le système de mesure est toujours valide pour la phase d'analyse.`
  },
  {
    code: 'DISTRIBUTION_TESTS_ANALYZE',
    name: 'Distribution Tests - Analyze',
    nameFr: 'Tests de Distribution - Analyze',
    description: 'Verify data distribution for statistical analysis',
    descriptionFr: 'Vérifier la distribution des données pour l\'analyse statistique',
    phase: 'ANALYZE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CALCULATION' as TemplateType,
    order: 3,
    schema: {
      inheritFrom: 'DISTRIBUTION_TESTS'
    },
    helpContent: `# Tests de Distribution - Analyze\n\nVérifiez la distribution des données avant les analyses statistiques.`
  },
  {
    code: 'PROJECT_REVIEW_ANALYZE',
    name: 'Project Review - Analyze',
    nameFr: 'Examen de Projet - Analyze',
    description: 'Review and validate Analyze phase completion',
    descriptionFr: 'Revoir et valider la complétion de la phase Analyze',
    phase: 'ANALYZE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CHECKLIST' as TemplateType,
    order: 4,
    schema: {
      sections: [
        {
          name: 'deliverables',
          label: 'Livrables de la phase',
          items: [
            { name: 'rootCausesIdentified', label: 'Causes racines identifiées' },
            { name: 'dataAnalyzed', label: 'Données analysées statistiquement' },
            { name: 'hypothesesTested', label: 'Hypothèses testées' },
            { name: 'vitalFewIdentified', label: 'Causes vitales ("vital few") identifiées' }
          ]
        }
      ],
      fields: [
        { name: 'reviewDate', label: 'Date de revue', type: 'date' },
        { name: 'decision', label: 'Décision', type: 'select', options: ['Approuvé', 'Approuvé avec réserves', 'Refusé'] },
        { name: 'comments', label: 'Commentaires', type: 'textarea' }
      ]
    },
    helpContent: `# Examen de Projet - Phase Analyze\n\nValidez que les causes racines ont été identifiées et priorisées.`
  },

  // ============ IMPROVE ============
  {
    code: 'SIX_SIGMA_INDICATORS_IMPROVE',
    name: 'Six Sigma Indicators Update',
    nameFr: 'Mise à jour Indicateurs Six Sigma',
    description: 'Update Six Sigma metrics after improvements',
    descriptionFr: 'Mettre à jour les indicateurs Six Sigma après améliorations',
    phase: 'IMPROVE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'FORM' as TemplateType,
    order: 1,
    schema: {
      inheritFrom: 'SIX_SIGMA_INDICATORS',
      additionalFields: [
        { name: 'beforeValue', label: 'Valeur avant (baseline)', type: 'number' },
        { name: 'afterValue', label: 'Valeur après', type: 'number' },
        { name: 'improvement', label: 'Amélioration (%)', type: 'calculated' }
      ]
    },
    helpContent: `# Mise à jour Indicateurs Six Sigma\n\nDocumentez l'amélioration des indicateurs après mise en œuvre des solutions.`
  },
  {
    code: 'PROJECT_REVIEW_IMPROVE',
    name: 'Project Review - Improve',
    nameFr: 'Examen de Projet - Improve',
    description: 'Review and validate Improve phase completion',
    descriptionFr: 'Revoir et valider la complétion de la phase Improve',
    phase: 'IMPROVE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CHECKLIST' as TemplateType,
    order: 2,
    schema: {
      sections: [
        {
          name: 'deliverables',
          label: 'Livrables de la phase',
          items: [
            { name: 'solutionsIdentified', label: 'Solutions identifiées et évaluées' },
            { name: 'pilotCompleted', label: 'Pilote réalisé' },
            { name: 'resultsValidated', label: 'Résultats validés' },
            { name: 'implementationPlan', label: 'Plan de déploiement prêt' }
          ]
        }
      ],
      fields: [
        { name: 'reviewDate', label: 'Date de revue', type: 'date' },
        { name: 'decision', label: 'Décision', type: 'select', options: ['Approuvé', 'Approuvé avec réserves', 'Refusé'] },
        { name: 'comments', label: 'Commentaires', type: 'textarea' }
      ]
    },
    helpContent: `# Examen de Projet - Phase Improve\n\nValidez que les solutions ont été testées et que les résultats sont concluants.`
  },
  {
    code: 'SAMPLE_SIZE_IMPROVE',
    name: 'Sample Size Verification - Improve',
    nameFr: 'Vérification Effectif Échantillon - Improve',
    description: 'Verify sample size for improvement validation',
    descriptionFr: 'Vérifier la taille d\'échantillon pour valider les améliorations',
    phase: 'IMPROVE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CALCULATION' as TemplateType,
    order: 3,
    schema: {
      inheritFrom: 'SAMPLE_SIZE'
    },
    helpContent: `# Vérification Taille d'Échantillon - Improve\n\nAssurez-vous que la taille d'échantillon est suffisante pour valider les améliorations.`
  },
  {
    code: 'BRAINSTORMING',
    name: 'Brainstorming',
    nameFr: 'Brainstorming et Outils de Créativité',
    description: 'Generate creative solutions',
    descriptionFr: 'Générer des solutions créatives',
    phase: 'IMPROVE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'RICH_TEXT' as TemplateType,
    order: 4,
    schema: {
      sections: [
        { name: 'objective', label: 'Objectif de la session', type: 'text' },
        { name: 'participants', label: 'Participants', type: 'userList' },
        { name: 'ideas', label: 'Idées générées', type: 'ideaList' },
        { name: 'groupedIdeas', label: 'Idées regroupées', type: 'ideaGroups' },
        { name: 'selectedIdeas', label: 'Idées retenues', type: 'ideaList' },
        { name: 'actionPlan', label: 'Plan d\'action', type: 'textarea' }
      ]
    },
    helpContent: `# Brainstorming\n\nTechnique de créativité pour générer des solutions.\n\n## Règles\n1. Pas de critique pendant la génération\n2. Quantité avant qualité\n3. Idées folles bienvenues\n4. Rebondir sur les idées des autres`
  },
  {
    code: 'FMEA_IMPROVE',
    name: 'FMEA Update',
    nameFr: 'AMDE - Analyse des Modes de Défaillance',
    description: 'Analyze potential failure modes of solutions',
    descriptionFr: 'Analyser les modes de défaillance potentiels des solutions',
    phase: 'IMPROVE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'MATRIX' as TemplateType,
    order: 5,
    schema: {
      columns: [
        { name: 'processStep', label: 'Étape processus', type: 'text' },
        { name: 'failureMode', label: 'Mode de défaillance', type: 'text' },
        { name: 'effect', label: 'Effet', type: 'text' },
        { name: 'severity', label: 'Sévérité (S)', type: 'rating', max: 10 },
        { name: 'cause', label: 'Cause', type: 'text' },
        { name: 'occurrence', label: 'Occurrence (O)', type: 'rating', max: 10 },
        { name: 'currentControl', label: 'Contrôle actuel', type: 'text' },
        { name: 'detection', label: 'Détection (D)', type: 'rating', max: 10 },
        { name: 'rpn', label: 'RPN', type: 'calculated', formula: 'severity * occurrence * detection' },
        { name: 'recommendedAction', label: 'Action recommandée', type: 'text' },
        { name: 'responsible', label: 'Responsable', type: 'text' },
        { name: 'deadline', label: 'Échéance', type: 'date' },
        { name: 'status', label: 'Statut', type: 'select', options: ['Ouvert', 'En cours', 'Terminé'] }
      ]
    },
    helpContent: `# AMDE - Analyse des Modes de Défaillance et de leurs Effets\n\nL'AMDE permet d'identifier et de prioriser les risques potentiels.\n\n## Calcul du RPN\nRPN = Sévérité × Occurrence × Détection\n\n## Échelles (1-10)\n- Sévérité : Impact de la défaillance\n- Occurrence : Fréquence probable\n- Détection : Capacité à détecter avant que ça n'arrive au client`
  },
  {
    code: 'GANTT_IMPROVE',
    name: 'Gantt Chart - Implementation',
    nameFr: 'Diagramme de Gantt - Implémentation',
    description: 'Plan implementation timeline',
    descriptionFr: 'Planifier le calendrier de mise en œuvre',
    phase: 'IMPROVE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'DIAGRAM' as TemplateType,
    order: 6,
    schema: {
      tasks: [
        { name: 'taskName', label: 'Tâche', type: 'text' },
        { name: 'startDate', label: 'Début', type: 'date' },
        { name: 'endDate', label: 'Fin', type: 'date' },
        { name: 'duration', label: 'Durée (jours)', type: 'calculated' },
        { name: 'progress', label: 'Avancement (%)', type: 'number' },
        { name: 'dependencies', label: 'Dépendances', type: 'taskList' },
        { name: 'responsible', label: 'Responsable', type: 'text' },
        { name: 'status', label: 'Statut', type: 'select', options: ['Non démarré', 'En cours', 'Terminé', 'En retard'] }
      ]
    },
    helpContent: `# Diagramme de Gantt\n\nPlanifiez le déploiement des solutions avec un calendrier détaillé.`
  },
  {
    code: 'PROJECT_CALENDAR',
    name: 'Project Calendar',
    nameFr: 'Calendrier de Projet',
    description: 'Track project milestones and deadlines',
    descriptionFr: 'Suivre les jalons et échéances du projet',
    phase: 'IMPROVE' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'DIAGRAM' as TemplateType,
    order: 7,
    schema: {
      events: [
        { name: 'eventName', label: 'Événement', type: 'text' },
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'type', label: 'Type', type: 'select', options: ['Jalon', 'Réunion', 'Livrable', 'Revue'] },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'status', label: 'Statut', type: 'select', options: ['Planifié', 'Réalisé', 'Reporté', 'Annulé'] }
      ]
    },
    helpContent: `# Calendrier de Projet\n\nVue calendaire des événements importants du projet.`
  },

  // ============ CONTROL ============
  {
    code: 'FMEA_UPDATE',
    name: 'FMEA Update - Control',
    nameFr: 'Mise à jour AMDEC - Control',
    description: 'Update FMEA with final controls',
    descriptionFr: 'Mettre à jour l\'AMDEC avec les contrôles finaux',
    phase: 'CONTROL' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'MATRIX' as TemplateType,
    order: 1,
    schema: {
      inheritFrom: 'FMEA_IMPROVE',
      additionalColumns: [
        { name: 'newSeverity', label: 'Nouvelle Sévérité', type: 'rating', max: 10 },
        { name: 'newOccurrence', label: 'Nouvelle Occurrence', type: 'rating', max: 10 },
        { name: 'newDetection', label: 'Nouvelle Détection', type: 'rating', max: 10 },
        { name: 'newRpn', label: 'Nouveau RPN', type: 'calculated' },
        { name: 'rpnReduction', label: 'Réduction RPN (%)', type: 'calculated' }
      ]
    },
    helpContent: `# Mise à jour AMDEC\n\nDocumentez l'amélioration des RPN après mise en place des contrôles.`
  },
  {
    code: 'CONTROL_PLAN',
    name: 'Control Plan',
    nameFr: 'Plan de Contrôle',
    description: 'Define ongoing controls',
    descriptionFr: 'Définir les contrôles permanents',
    phase: 'CONTROL' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'MATRIX' as TemplateType,
    order: 2,
    schema: {
      columns: [
        { name: 'processStep', label: 'Étape processus', type: 'text' },
        { name: 'characteristic', label: 'Caractéristique', type: 'text' },
        { name: 'specification', label: 'Spécification', type: 'text' },
        { name: 'measurementMethod', label: 'Méthode de mesure', type: 'text' },
        { name: 'sampleSize', label: 'Taille échantillon', type: 'text' },
        { name: 'frequency', label: 'Fréquence', type: 'text' },
        { name: 'controlMethod', label: 'Méthode de contrôle', type: 'text' },
        { name: 'reactionPlan', label: 'Plan de réaction', type: 'text' },
        { name: 'responsible', label: 'Responsable', type: 'text' }
      ]
    },
    helpContent: `# Plan de Contrôle\n\nLe plan de contrôle documente comment maintenir les gains obtenus.\n\n## Éléments clés\n- Quoi mesurer\n- Comment mesurer\n- Quand mesurer\n- Que faire en cas d'anomalie`
  },
  {
    code: 'TRAINING',
    name: 'Training Plan',
    nameFr: 'Formation',
    description: 'Plan and track training',
    descriptionFr: 'Planifier et suivre les formations',
    phase: 'CONTROL' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'MATRIX' as TemplateType,
    order: 3,
    schema: {
      columns: [
        { name: 'topic', label: 'Sujet de formation', type: 'text' },
        { name: 'targetAudience', label: 'Public cible', type: 'text' },
        { name: 'trainer', label: 'Formateur', type: 'text' },
        { name: 'plannedDate', label: 'Date prévue', type: 'date' },
        { name: 'actualDate', label: 'Date réelle', type: 'date' },
        { name: 'attendees', label: 'Participants', type: 'number' },
        { name: 'materials', label: 'Supports', type: 'text' },
        { name: 'status', label: 'Statut', type: 'select', options: ['Planifié', 'Réalisé', 'Reporté'] },
        { name: 'effectiveness', label: 'Efficacité', type: 'select', options: ['À évaluer', 'Efficace', 'À refaire'] }
      ]
    },
    helpContent: `# Plan de Formation\n\nAssurez-vous que toutes les personnes concernées sont formées aux nouvelles pratiques.`
  },
  {
    code: 'GAINS_CALCULATION',
    name: 'Gains Calculation',
    nameFr: 'Calcul des Gains Obtenus',
    description: 'Calculate and document achieved gains',
    descriptionFr: 'Calculer et documenter les gains réalisés',
    phase: 'CONTROL' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'FORM' as TemplateType,
    order: 4,
    schema: {
      fields: [
        { name: 'metricName', label: 'Indicateur', type: 'text' },
        { name: 'baselineValue', label: 'Valeur initiale (baseline)', type: 'number' },
        { name: 'targetValue', label: 'Valeur cible', type: 'number' },
        { name: 'achievedValue', label: 'Valeur atteinte', type: 'number' },
        { name: 'improvement', label: 'Amélioration (%)', type: 'calculated' },
        { name: 'targetAchieved', label: 'Objectif atteint', type: 'calculated' },
        { name: 'financialGains', label: 'Gains financiers (€)', type: 'currency' },
        { name: 'gainType', label: 'Type de gain', type: 'select', options: ['Hard savings', 'Soft savings', 'Cost avoidance'] },
        { name: 'validatedBy', label: 'Validé par', type: 'text' },
        { name: 'validationDate', label: 'Date de validation', type: 'date' }
      ]
    },
    helpContent: `# Calcul des Gains\n\nDocumentez les gains réalisés grâce au projet.\n\n## Types de gains\n- Hard savings : économies réelles mesurables\n- Soft savings : économies indirectes (qualité, temps)\n- Cost avoidance : coûts évités`
  },
  {
    code: 'PROJECT_REVIEW_CONTROL',
    name: 'Project Review & Lessons Learned',
    nameFr: 'Examen du Projet et Retour d\'Expérience',
    description: 'Final project review and lessons learned',
    descriptionFr: 'Revue finale du projet et capitalisation',
    phase: 'CONTROL' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'CHECKLIST' as TemplateType,
    order: 5,
    schema: {
      sections: [
        {
          name: 'objectives',
          label: 'Atteinte des objectifs',
          items: [
            { name: 'primaryObjective', label: 'Objectif principal atteint' },
            { name: 'secondaryObjectives', label: 'Objectifs secondaires atteints' },
            { name: 'gainsValidated', label: 'Gains validés par Finance' }
          ]
        },
        {
          name: 'sustainability',
          label: 'Pérennité',
          items: [
            { name: 'controlPlanInPlace', label: 'Plan de contrôle en place' },
            { name: 'trainingCompleted', label: 'Formations réalisées' },
            { name: 'proceduresUpdated', label: 'Procédures mises à jour' },
            { name: 'ownershipTransferred', label: 'Transfert au propriétaire processus' }
          ]
        }
      ],
      fields: [
        { name: 'lessonsLearned', label: 'Leçons apprises', type: 'richtext' },
        { name: 'bestPractices', label: 'Bonnes pratiques à capitaliser', type: 'richtext' },
        { name: 'replicationOpportunities', label: 'Opportunités de réplication', type: 'textarea' },
        { name: 'acknowledgments', label: 'Remerciements', type: 'textarea' }
      ]
    },
    helpContent: `# Revue Finale et Retour d'Expérience\n\nCapitalisez sur les apprentissages du projet.`
  },
  {
    code: 'PROJECT_CLOSURE',
    name: 'Project Closure',
    nameFr: 'Clôture du Projet',
    description: 'Formally close the project',
    descriptionFr: 'Clôturer formellement le projet',
    phase: 'CONTROL' as DmaicPhase,
    priority: 'OBLIGATORY' as ToolPriority,
    templateType: 'FORM' as TemplateType,
    order: 6,
    schema: {
      fields: [
        { name: 'projectName', label: 'Nom du projet', type: 'text', readonly: true },
        { name: 'startDate', label: 'Date de début', type: 'date', readonly: true },
        { name: 'endDate', label: 'Date de fin', type: 'date' },
        { name: 'duration', label: 'Durée totale', type: 'calculated' },
        { name: 'finalStatus', label: 'Statut final', type: 'select', options: ['Objectifs atteints', 'Partiellement atteints', 'Non atteints'] },
        { name: 'totalGains', label: 'Gains totaux (€)', type: 'currency' },
        { name: 'sponsorApproval', label: 'Approbation sponsor', type: 'signature' },
        { name: 'closureDate', label: 'Date de clôture officielle', type: 'date' },
        { name: 'celebration', label: 'Célébration prévue', type: 'textarea' }
      ]
    },
    helpContent: `# Clôture du Projet\n\nFormalisez la fin du projet et célébrez les succès avec l'équipe !`
  }
];

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@dmaic.local' },
    update: {},
    create: {
      email: 'admin@dmaic.local',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'DMAIC',
      role: 'ADMIN'
    }
  });
  console.log('Admin user created:', admin.email);

  // Create demo users
  const demoUsers = [
    { email: 'chef@dmaic.local', firstName: 'Jean', lastName: 'Dupont', role: 'PROJECT_MANAGER' as const },
    { email: 'contrib@dmaic.local', firstName: 'Marie', lastName: 'Martin', role: 'CONTRIBUTOR' as const }
  ];

  for (const userData of demoUsers) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: hashedPassword
      }
    });
    console.log('User created:', userData.email);
  }

  // Create tool definitions
  for (const def of toolDefinitions) {
    const dbDef = {
      ...def,
      schema: JSON.stringify(def.schema)
    };
    await prisma.toolDefinition.upsert({
      where: { code: def.code },
      update: dbDef,
      create: dbDef
    });
    console.log('Tool definition created:', def.code);
  }

  console.log('Seed completed!');
  console.log(`Created ${toolDefinitions.length} tool definitions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
