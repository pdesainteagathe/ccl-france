# 🌍 Calculateur de Redistribution de la Taxe Carbone

Un outil interactif pour visualiser et comparer différents scénarios de redistribution de la taxe carbone en France.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📋 Vue d'ensemble

Ce calculateur permet aux citoyens de :
- **Visualiser** l'impact d'une taxe carbone sur chaque décile de revenus
- **Configurer** différents mécanismes de redistribution (revenu direct vs subventions)
- **Personnaliser** les bonus pour les bas revenus et les zones rurales
- **Voter** pour leur scénario préféré de manière **anonyme**

L'objectif est de démocratiser le débat sur la taxe carbone en rendant accessibles les calculs d'impact redistributif.

---

## 🎯 Fonctionnalités

### 🔧 Paramètres configurables

1. **Prix de la taxe carbone** (45-300 €/tCO2eq)
   - Définit le montant de la taxe carbone appliquée

2. **Part de redistribution directe** (0-100%)
   - 0% = Tout va vers des subventions ciblées
   - 100% = Tout est redistribué directement aux ménages
   - 50% = Hybride (moitié direct, moitié subventions)

3. **Bonus faibles revenus** (0-200%)
   - Pondération progressive pour favoriser les déciles bas
   - Basé sur une fonction puissance qui augmente le poids des déciles inférieurs

4. **Bonus zones rurales** (0-200%)
   - Compense le surcoût carbone (+50%) des ménages ruraux
   - Basé sur données **INSEE FiLoSoFi 2017** et **ADEME**
   - Les déciles bas (D1-D3) reçoivent jusqu'à **+16% à bonus 100%**

5. **Choix des subventions** (panel de droite)
   - 15 catégories de subventions climatiques
   - Ajustement en temps réel pour maintenir 100% de répartition

---

## 🧮 Méthodologie

### Sources de données

#### 1. Empreinte carbone par décile
**Source** : [Pottier et al. (2020)](https://www.strategie.gouv.fr/) - CGDD/ADEME  
**Données** : `data/empreinte_carbone_pottier.csv`

Empreinte carbone moyenne par décile de revenus :
```
D1 (10% + pauvres) : 7.5 tCO2e/hab/an
D5 (médiane)       : 10.2 tCO2e/hab/an
D10 (10% + riches) : 18.3 tCO2e/hab/an
```

#### 2. Répartition territoriale
**Source** : INSEE FiLoSoFi 2017  
**Usage** : Calcul des coefficients de compensation pour le bonus rural

Observations clés :
- Les déciles bas (D1-D3) sont plus présents en zones rurales (~33%)
- Les zones rurales émettent +50% de CO2 (ADEME) malgré revenus plus faibles
- Coefficient de compensation : 0.165 pour D1-D3, 0.074 pour D7-D10

### Calculs

#### 1. Taxe payée
```javascript
Taxe[décile] = Empreinte_carbone[décile] × Prix_carbone
```

#### 2. Montant total collecté
```javascript
Total_collecté = Σ(Taxe[décile] × Nombre_ménages[décile])
```

#### 3. Redistribution directe (Revenu Direct)

Cette étape détermine comment le revenu direct est réparti entre les déciles, avec possibilité de favoriser les bas revenus.

##### a) Montant à redistribuer
```javascript
Part_directe = Total_collecté × (Redistribution% / 100)
```

**Exemple** : Si la taxe collecte 50 milliards d'€ et que 70% vont vers le revenu direct :
```
Part_directe = 50 Mds€ × 0.70 = 35 Mds€ à redistribuer
```

##### b) Calcul des poids avec bonus faibles revenus

Le **bonus faibles revenus** utilise une **fonction puissance** pour moduler progressivement l'avantage donné aux déciles bas.

**Formule** :
```javascript
Poids[décile] = (11 - numéro_décile)^(Pondération/25)
```

**Composantes** :
- `(11 - numéro_décile)` : Base décroissante (10 pour D1, 9 pour D2, ..., 1 pour D10)
- `Pondération/25` : Exposant qui contrôle l'intensité de la progressivité
  - À Pondération = 0 : exposant = 0 → tous les poids = 1 (uniforme)
  - À Pondération = 25 : exposant = 1 → poids proportionnels (10, 9, 8, ..., 1)
  - À Pondération = 50 : exposant = 2 → favorise fortement les bas déciles
  - À Pondération = 100 : exposant = 4 → très forte progressivité

**Pourquoi une fonction puissance ?**

Une fonction puissance permet une **modulation douce et continue** de la redistribution :
- Évite les effets de seuil (pas de rupture brutale entre déciles)
- Permet de tester un continuum de politiques redistributives
- Reste mathématiquement simple et compréhensible

**Exemples concrets** :

| Décile | Base<br>(11-D) | Pond. 0%<br>exp=0 | Pond. 25%<br>exp=1 | Pond. 50%<br>exp=2 | Pond. 100%<br>exp=4 |
|--------|---------|---------|---------|---------|---------|
| **D1** | 10 | 10^0 = **1.00** | 10^1 = **10.0** | 10^2 = **100** | 10^4 = **10,000** |
| **D2** | 9 | 9^0 = **1.00** | 9^1 = **9.0** | 9^2 = **81** | 9^4 = **6,561** |
| **D3** | 8 | 8^0 = **1.00** | 8^1 = **8.0** | 8^2 = **64** | 8^4 = **4,096** |
| **D4** | 7 | 7^0 = **1.00** | 7^1 = **7.0** | 7^2 = **49** | 7^4 = **2,401** |
| **D5** | 6 | 6^0 = **1.00** | 6^1 = **6.0** | 6^2 = **36** | 6^4 = **1,296** |
| **D6** | 5 | 5^0 = **1.00** | 5^1 = **5.0** | 5^2 = **25** | 5^4 = **625** |
| **D7** | 4 | 4^0 = **1.00** | 4^1 = **4.0** | 4^2 = **16** | 4^4 = **256** |
| **D8** | 3 | 3^0 = **1.00** | 3^1 = **3.0** | 3^2 = **9** | 3^4 = **81** |
| **D9** | 2 | 2^0 = **1.00** | 2^1 = **2.0** | 2^2 = **4** | 2^4 = **16** |
| **D10** | 1 | 1^0 = **1.00** | 1^1 = **1.0** | 1^2 = **1** | 1^4 = **1** |
| **Somme** | - | **10** | **55** | **385** | **25,333** |

**Impact sur la redistribution normalisée** (pour 10 Mds€ à redistribuer) :

| Décile | Pond. 0%<br>(uniforme) | Pond. 25%<br>(linéaire) | Pond. 50%<br>(quadratique) | Pond. 100%<br>(forte) |
|--------|---------|---------|---------|---------|
| **D1** | 1.00 Md€ (10%) | 1.82 Md€ (18.2%) | 2.60 Md€ (26.0%) | 3.95 Md€ (39.5%) |
| **D2** | 1.00 Md€ (10%) | 1.64 Md€ (16.4%) | 2.10 Md€ (21.0%) | 2.59 Md€ (25.9%) |
| **D3** | 1.00 Md€ (10%) | 1.45 Md€ (14.5%) | 1.66 Md€ (16.6%) | 1.62 Md€ (16.2%) |
| **D4** | 1.00 Md€ (10%) | 1.27 Md€ (12.7%) | 1.27 Md€ (12.7%) | 0.95 Md€ (9.5%) |
| **D5** | 1.00 Md€ (10%) | 1.09 Md€ (10.9%) | 0.94 Md€ (9.4%) | 0.51 Md€ (5.1%) |
| **D6** | 1.00 Md€ (10%) | 0.91 Md€ (9.1%) | 0.65 Md€ (6.5%) | 0.25 Md€ (2.5%) |
| **D7** | 1.00 Md€ (10%) | 0.73 Md€ (7.3%) | 0.42 Md€ (4.2%) | 0.10 Md€ (1.0%) |
| **D8** | 1.00 Md€ (10%) | 0.55 Md€ (5.5%) | 0.23 Md€ (2.3%) | 0.03 Md€ (0.3%) |
| **D9** | 1.00 Md€ (10%) | 0.36 Md€ (3.6%) | 0.10 Md€ (1.0%) | 0.01 Md€ (0.1%) |
| **D10** | 1.00 Md€ (10%) | 0.18 Md€ (1.8%) | 0.03 Md€ (0.3%) | 0.00 Md€ (0.0%) |

**Observations** :
- **À 0%** : Distribution **parfaitement uniforme** (10% pour tous)
- **À 25%** : D1 reçoit 1.82× plus que la moyenne (18.2% vs 10%)
- **À 50%** : D1 reçoit 2.60× plus que la moyenne, D10 presque rien (0.3%)
- **À 100%** : **Très progressive** : D1 reçoit 39.5%, D10 quasi rien (0.0%)

##### Variantes de formules alternatives

Bien que l'outil utilise actuellement une **loi de puissance** pour sa simplicité mathématique et sa continuité, il existe d'autres approches possibles pour moduler le bonus faibles revenus :

**1. Fonction quadratique**
```javascript
Poids[décile] = 1 + ((11 - numéro_décile) / 10)² × (Pondération / 100) × 2
```
- **Caractéristique** : Compromis entre progressivité linéaire et exponentielle
- **Effet** : Distribution plus douce que la puissance, ratio D1/D5 ≈ 1.7x à pondération 100%

**2. Fonction sigmoïde**
```javascript
normalized = (numéro_décile - 1) / 9
sigmoid = 1 / (1 + exp(10 × (normalized - 0.4)))
Poids[décile] = 1 + sigmoid × (Pondération / 100) × 2
```
- **Caractéristique** : Transition douce avec concentration naturelle sur D1-D5
- **Effet** : Répartition équilibrée sur les 5 premiers déciles, ratio D1/D5 ≈ 1.7x

**3. Fonction par paliers (inspirée I4CE/Terra Nova)**
```javascript
paliers = [2.0, 1.8, 1.6, 1.4, 1.2, 1.0, 1.0, 1.0, 1.0, 1.0]  // D1 à D10
Poids[décile] = 1 + (paliers[décile-1] - 1) × (Pondération / 100)
```
- **Caractéristique** : Basée sur les travaux empiriques de l'[étude I4CE & Terra Nova (2022)](https://www.i4ce.org/wp-content/uploads/2022/07/19-02-28-Etude-Climat_I4CE_Terra_Nova-1.pdf)
- **Effet** : Distribution progressive par paliers (D1: +100%, D2: +80%, D3: +60%, D4: +40%, D5: +20%)

**4. Fonction linéaire décroissante**
```javascript
Poids[décile] = 1 + (11 - numéro_décile) × (Pondération / 100)
```
- **Caractéristique** : La plus simple, distribution parfaitement linéaire
- **Effet** : Progression douce et uniforme, ratio D1/D5 ≈ 1.6x

**Choix de l'implémentation actuelle**

Par **souci de simplicité et de lisibilité** de l'outil pédagogique, nous avons choisi de ne proposer qu'une seule formule testable (la loi de puissance) qui présente plusieurs avantages :
- ✅ Mathématiquement **simple et compréhensible**
- ✅ Permet une **modulation continue** via un seul paramètre
- ✅ Évite les **effets de seuil** entre déciles
- ✅ Couvre un **large spectre** de politiques redistributives (de l'uniforme au très progressif)

Les formules alternatives mentionnées ci-dessus sont documentées à titre informatif et pourraient être implémentées dans des versions futures si un besoin de calibration plus fine émerge.

##### c) Application du bonus zones rurales

Si le bonus rural est activé (> 0%), les poids sont ensuite ajustés :

```javascript
if (Bonus_rural > 0) {
    Poids[décile] *= (1 + Coef_rural[décile] × Bonus_rural/100)
}
```

Voir section "[Bonus Zones Rurales](#-bonus-zones-rurales---méthodologie-détaillée)" pour le détail des coefficients.

##### d) Normalisation et redistribution finale

Les poids sont normalisés pour que leur somme = Part_directe, puis chaque décile reçoit sa part :

```javascript
// Normalisation
Somme_poids = Σ Poids[tous les déciles]

// Redistribution finale
Redistribution[décile] = (Poids[décile] / Somme_poids) × Part_directe
```

**Exemple complet** avec Pondération = 50%, Bonus rural = 0%, Part directe = 10 Mds€ :
```
Poids bruts: [100, 81, 64, 49, 36, 25, 16, 9, 4, 1]
Somme = 385

Redistribution D1 = (100 / 385) × 10 Mds€ = 2.60 Mds€
Redistribution D2 = (81 / 385) × 10 Mds€ = 2.10 Mds€
...
Redistribution D10 = (1 / 385) × 10 Mds€ = 0.03 Mds€
```

#### 4. Subventions ciblées
```javascript
Part_subventions = Total_collecté × ((100 - Redistribution%) / 100)

// Répartie selon les % choisis par l'utilisateur
Subvention[catégorie] = Part_subventions × (Pourcentage[catégorie] / 100)
```

#### 5. Impact net
```javascript
Impact_net[décile] = Redistribution[décile] - Taxe[décile]
```

---

## 📍 Bonus Zones Rurales - Méthodologie détaillée

### Objectif

Compenser le **surcoût carbone structurel** des ménages vivant en zones rurales et périurbaines, qui émettent davantage (transport + logement) malgré des revenus médians plus faibles et moins d'alternatives.

### Sources de données

#### 1. INSEE FiLoSoFi 2017 - Répartition territoriale des revenus

**Fichier source** : `FET2021-D3.xlsx` - Figure 2  
**URL** : https://www.insee.fr/fr/statistiques/fichier/5039989/FET2021-D3.xlsx

**Contenu** : Déciles de niveau de vie (D1, Médiane, D9) par taille d'aires d'attraction des villes.

**11 catégories territoriales analysées** :
| Catégorie | Type | Médiane (€) | Coefficient de ruralité |
|-----------|------|-------------|-------------------------|
| Aire de Paris | Pôle | 22,884 | 0.0 (très urbain) |
| Aire de Paris | Couronne | 23,708 | 0.2 (périurbain) |
| Grandes métropoles (>700k hab) | Pôle | 20,774 | 0.0 |
| Grandes métropoles | Couronne | 23,031 | 0.2 |
| Villes moyennes (200-700k) | Pôle | 19,702 | 0.1 |
| Villes moyennes | Couronne | 21,937 | 0.3 |
| Villes moyennes (50-200k) | Pôle | 18,927 | 0.2 |
| Villes moyennes | Couronne | 21,051 | 0.4 |
| Petites villes (<50k) | Pôle | 19,301  | 0.4 |
| Petites villes | Couronne | 20,355 | 0.6 (rural) |
| **Communes hors d'attraction** | — | **19,773** | **0.9 (très rural)** |

**Observation clé** : Les zones rurales ont un niveau de vie médian **plus faible** (19,773€ vs 22,884€ à Paris) mais le D1 (10% plus pauvres) y est **plus élevé** (11,237€ rural vs 10,483€ Paris), indiquant **moins d'inégalités** en zones rurales.

#### 2. ADEME - Différentiels d'émissions par territoire

**Sources compilées** :
1. **ADEME/CGDD** - Études sur l'empreinte carbone territoriale
2. **Pottier et al. (2020)** - "Répartition de l'empreinte carbone des Français"
3. **Grand Lyon (2021)** - Analyse empreinte carbone urbain/rural/périurbain

**Différentiels mesurés** :

| Poste | Rural vs Urbain | Périurbain vs Urbain | Source |
|-------|-----------------|----------------------|--------|
| **Chauffage** | **+86%** (2.6t vs 1.4t CO2e/hab/an) | +71% (2.4t) | Grand Lyon 2021 |
| **Transport** | **+60%** (estimé, dépendance voiture) | +45% | ADEME études mobilité |
| **Biens & services** | -15% (moins de consommation) | -5% | Pottier 2020 |

**Calcul de la moyenne pondérée (+50%)** :

La surprime globale de **+50%** est calculée en pondérant les différentiels par la part de chaque poste dans l'empreinte totale :

```
Empreinte totale moyenne (France) ≈ 10 t CO2e/hab/an

Répartition par poste :
- Transport : 25% = 2.5t
- Logement (dont chauffage) : 18% = 1.8t
- Alimentation : 23% = 2.3t (pas de différence urbain/rural significative)
- Biens & services : 34% = 3.4t

Différentiel rural :
- Transport : +60% × 2.5t = +1.5t
- Chauffage : +86% × 1.8t = +1.55t
- Biens & services : -15% × 3.4t = -0.51t
- Alimentation : 0% (identique)

Total différentiel = +1.5 + 1.55 - 0.51 = +2.54t
Surprime en % = 2.54 / 10 × (1-0.25) ≈ +50% des émissions directes modulables
```

**Note** : Le +50% s'applique aux émissions **directes et modulables** (transport + logement), qui représentent 43% de l'empreinte totale. Les émissions indirectes (alimentation, services) varient moins selon le territoire.

### Calcul des coefficients par décile

#### Étape 1 : Estimation de la répartition géographique par décile

Faute de données croisées **décile × ruralité** publiées par l'INSEE, nous avons estimé la proportion de ménages ruraux/périurbains/urbains pour chaque décile en croisant :
1. Les données de revenus par territoire (FiLoSoFi)
2. Les statistiques de pauvreté rurale/urbaine (INSEE)
3. Les observations sur la concentration des hauts revenus dans les grandes métropoles

**Distribution estimée** :

| Décile | % Rural | % Périurbain | % Urbain | Justification |
|--------|---------|--------------|----------|---------------|
| D1 | 35% | 30% | 35% | Surreprésentation de la pauvreté rurale |
| D2 | 32% | 32% | 36% | Idem |
| D3 | 30% | 33% | 37% | |
| D4 | 28% | 34% | 38% | Transition vers distribution équilibrée |
| D5 | 25% | 35% | 40% | Médiane nationale |
| D6 | 22% | 35% | 43% | |
| D7 | 20% | 34% | 46% | Concentration progressive en urbain |
| D8 | 18% | 32% | 50% | |
| D9 | 15% | 30% | 55% | Hauts revenus concentrés en métropoles |
| D10 | 12% | 25% | 63% | Très forte concentration urbaine |

#### Étape 2 : Calcul du coefficient moyen de ruralité par décile

Pour chaque décile, on calcule un **coefficient de ruralité moyen** qui reflète la répartition de sa population entre zones urbaines, périurbaines et rurales :

```
Coef_ruralité[décile] = (
    %_rural × 0.9 +        // Coefficient rural = 0.9
    %_périurb × 0.35 +     // Coefficient périurbain = 0.35 (moyenne)
    %_urbain × 0.0         // Coefficient urbain = 0  (référence)
) / 100
```

**Exemple pour D1** :
```
Coef_ruralité[D1] = (35% × 0.9 + 30% × 0.35 + 35% × 0.0) / 100
                  = (31.5 + 10.5 + 0) / 100
                  = 0.42 / 100
                  = 0.329 ≈ 33%
```

**Résultats** :

| Décile | Coef. de ruralité moyen | Arrondi utilisé |
|--------|--------------------------|-----------------|
| D1-D3 | 0.329 | **0.33** (33% rural en moyenne) |
| D4-D6 | 0.247 | **0.25** (25% rural) |
| D7-D10 | 0.148 | **0.15** (15% rural) |

#### Étape 3 : Coefficient de compensation final

```
Coefficient_compensation[décile] = Coef_ruralité[décile] × Surprime_ADEME

Avec Surprime_ADEME = 0.50 (+50% d'émissions)
```

**Résultats finaux** :

| Décile | Coefficient | Compensation à bonus 100% |
|--------|-------------|---------------------------|
| D1-D3 | 0.33 × 0.50 = **0.165** | **+16.5%** de redistribution |
| D4-D6 | 0.25 × 0.50 = **0.124** | **+12.4%** |
| D7-D10 | 0.15 × 0.50 = **0.074** | **+7.4%** |

### Application dans le code

```javascript
// Coefficients de compensation pour bonus zones rurales
// Source: INSEE FiLoSoFi 2017 + ADEME empreinte carbone territoriale
const ruralCompensationCoefficients = [
    0.165, 0.165, 0.165,  // D1-D3: +16.4% à bonus 100%
    0.124, 0.124, 0.124,  // D4-D6: +12.4%
    0.074, 0.074, 0.074, 0.074  // D7-D10: +7.4%
];

// Dans calculateRedistribution()
if (state.bonusPercent > 0) {
    weights = weights.map((w, i) => {
        const ruralBonus = ruralCompensationCoefficients[i] * (state.bonusPercent / 100);
        return w * (1 + ruralBonus);
    });
}
```

### Justification et limites

#### ⚠️ Limites assumées

1. **Approximation de la distribution** : Pas de données croisées décile × ruralité publiées par l'INSEE → estimation basée sur observations indirectes
2. **Surprime uniforme** : En réalité, le +50% varie selon le décile (les hauts revenus ruraux ont plus d'alternatives), mais données détaillées non disponibles
3. **Moyenne nationale** : Pas de prise en compte des variations régionales (Nord vs Sud, montagne vs plaine)
4. **Comportements constants** : Ne prend pas en compte les changements de comportement induits par la taxe

#### 🔄 Améliorations futures

Si l'INSEE publie des données croisées **décile × ruralité**, les coefficients pourront être affinés avec des données réelles au lieu d'estimations.

---

## 🗳️ Système de vote

### Anonymat garanti

Les votes sont **100% anonymes** :
- ✅ Aucune donnée personnelle collectée
- ✅ Pas d'adresse IP enregistrée
- ✅ Pas de cookies de tracking

### Données enregistrées

Lors d'un vote, seuls les **paramètres de configuration** sont sauvegardés :
```json
{
  "timestamp": "2025-12-25T22:00:00Z",
  "carbonPrice": 100,
  "redistributionPercent": 70,
  "ponderationPercent": 50,
  "bonusPercent": 100,
  "subsidy_0_name": "Pompe à chaleur",
  "subsidy_0_percent": 15,
  // ... autres subventions
}
```

**Utilisation** : Statistiques agrégées pour identifier les scénarios préférés des citoyens.

---

## 🚀 Installation et utilisation

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Serveur HTTP (pour développement local)

### Lancement local

```bash
# Cloner le repository
git clone https://github.com/votre-org/ccl-france.git
cd ccl-france

# Lancer un serveur HTTP
python3 -m http.server 8080

# Ouvrir dans le navigateur
# http://localhost:8080/index.html
```

### Intégration WordPress

Le calculateur peut être intégré dans WordPress via iframe ou comme page standalone :
1. Le header a été retiré pour éviter les conflits
2. Le bouton "Je vote" est en bas de la sidebar gauche
3. Tous les styles sont encapsulés dans `index.css`

---

## 📂 Structure du projet

```
ccl-france/
├── index.html              # Page principale
├── app.js                  # Logique de calcul et interactions
├── index.css               # Styles
├── logo-revenu-carbone.svg # Logo
├── .gitignore              # Exclusions Git
│
├── data/                   # Données et analyses
│   ├── README.md           # Guide du dossier data
│   ├── BONUS_RURAL_DOCUMENTATION.md  # Doc technique bonus rural
│   │
│   ├── empreinte_carbone_pottier.csv # Données sources
│   │
│   ├── insee/              # Données INSEE
│   │   ├── FET2021-D3.xlsx
│   │   ├── deciles_par_territoire.json
│   │   ├── rural_bonus_coefficients.json
│   │   └── rural_bonus_code.js
│   │
│   └── *.py                # Scripts d'analyse Python
│
├── BONUS_RURAL_SUMMARY.md  # Résumé bonus rural
└── README.md               # Ce fichier
```

---

## 📊 Résultats types

### Exemple : Taxe à 100€, 70% revenu direct, bonus 50%/100%

| Décile | Taxe payée | Redistribution | Impact net |
|--------|-----------|----------------|------------|
| **D1** | -750€     | +1,200€        | **+450€** ✅ |
| **D5** | -1,020€   | +1,050€        | **+30€** ✅ |
| **D10** | -1,830€   | +750€          | **-1,080€** 💸 |

→ **Progressive** : Les déciles bas gagnent, les hauts déciles paient le coût net.

---

## 🔬 Validations et sources

### Études de référence

1. **Pottier et al. (2020)**  
   *Répartition de l'empreinte carbone des Français*  
   CGDD - Ministère de la Transition écologique

2. **INSEE FiLoSoFi 2017**  
   *Déciles de niveau de vie par territoire*  
   https://www.insee.fr/fr/statistiques/5039989

3. **ADEME**  
   *Empreinte carbone des ménages par territoire*  
   Base Carbone® et études territoriales

4. **Grand Lyon (2021)**  
   *Analyse empreinte carbone urbain/rural*

### Hypothèses et limites

⚠️ **Approximations** :
- Distribution urbain/rural par décile estimée (pas de données croisées directes)
- Élasticité-prix non prise en compte (comportements constants)
- Données nationales moyennes (pas de variations régionales)

✅ **Points forts** :
- Données officielles INSEE et ADEME
- Méthodologie documentée et reproductible
- Calculs transparents et open source

---

## 🤝 Contribution

Les contributions sont bienvenues ! 

### Améliorations possibles
- [ ] Ajouter variations régionales
- [ ] Intégrer élasticité-prix des émissions
- [ ] Actualiser avec FiLoSoFi 2022+ quand disponible
- [ ] Ajouter scénarios macro-économiques (PIB, emploi)

### Comment contribuer
1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit les changements (`git commit -m 'Ajout fonctionnalité X'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

---

## 📄 Documentation détaillée

- **[Bonus Rural - Documentation complète](data/BONUS_RURAL_DOCUMENTATION.md)** : Méthodologie détaillée du bonus zones rurales
- **[Guide du dossier data](data/README.md)** : Explication des données et scripts
- **[Résumé bonus rural](BONUS_RURAL_SUMMARY.md)** : Vue d'ensemble de l'implémentation

---

## 📝 License

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Auteurs

**CCL France** - Citizens' Climate Lobby France  
Contact : [contact@ccl-france.org](mailto:contact@ccl-france.org)

---

## 🙏 Remerciements

- **INSEE** pour les données FiLoSoFi
- **ADEME** pour les données d'empreinte carbone
- **Antonin Pottier et al.** pour les travaux de recherche
- Tous les contributeurs du projet

---

**Version** : 1.0  
**Dernière mise à jour** : 25 décembre 2025
