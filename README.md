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
```javascript
Part_directe = Total_collecté × (Redistribution% / 100)

// Poids de base avec bonus bas revenus
Poids[décile] = (11 - décile)^(Pondération/25)

// Application bonus rural
if (Bonus_rural > 0) {
    Poids[décile] *= (1 + Coef_rural[décile] × Bonus_rural/100)
}

// Normalisation
Redistribution[décile] = (Poids[décile] / Σ Poids) × Part_directe
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
