# Bonus Zones Rurales - Documentation Technique

## 📊 Vue d'ensemble

Le **bonus zones rurales** permet de compenser le surcoût carbone des ménages vivant en zones rurales et périurbaines, qui :
- Émettent **+50% de CO2** en moyenne (transport + logement)
- Ont **moins d'alternatives** (dépendance à la voiture, logements moins performants)
- Paient donc **plus de taxe carbone** pour un même niveau de vie

---

## 🔍 Sources de données

### 1. INSEE FiLoSoFi 2017 - Figure 2
**Source** : `https://www.insee.fr/fr/statistiques/fichier/5039989/FET2021-D3.xlsx`

**Données extraites** :
- Déciles de niveau de vie (D1, Médiane, D9)
- Par taille d'aires d'attraction des villes
- 11 catégories territoriales de Paris aux communes rurales

**Fichier** : [`data/insee/deciles_par_territoire.json`](data/insee/deciles_par_territoire.json)

**Observations clés** :
```
Zone                          | D1 (10% + pauvres) | Médiane | D9 (10% + riches)
------------------------------|-------------------|----------|------------------
Paris pôle                    | 10,483€           | 22,884€  | 48,248€
Communes rurales (hors AAV)   | 11,237€           | 19,773€  | 33,057€
```

→ **Les zones rurales ont MOINS d'inégalités mais un niveau médian PLUS BAS**

### 2. ADEME - Empreinte carbone territoriale

**Sources** :
- Études ADEME/CGDD sur l'empreinte carbone des ménages
- Pottier et al. (2020) - Répartition de l'empreinte carbone des Français
- Grand Lyon - Analyse empreinte carbone urbain/rural

**Différentiels d'émissions** :
| Catégorie | Rural vs Urbain |
|-----------|-----------------|
| Chauffage | **+86%** (2.6t vs 1.4t CO2e/hab/an) |
| Transport | **+60%** (dépendance voiture) |
| **Global** | **+50%** (moyenne pondérée) |

---

## 🧮 Méthodologie de calcul

### Étape 1 : Cartographie territoriale

Chaque catégorie INSEE se voit attribuer un **coefficient de ruralité** (0 = très urbain, 1 = très rural) :

```
Territoire                               | Coef. Rural
-----------------------------------------|-------------
Paris pôle                               | 0.0
Paris couronne                           | 0.2
Grandes métropoles (>700k) pôle          | 0.0
Grandes métropoles couronne              | 0.2
Villes moyennes (200-700k) pôle          | 0.1
Villes moyennes couronne                 | 0.3
Villes moyennes (50-200k) pôle           | 0.2
Villes moyennes couronne                 | 0.4
Petites villes (<50k) pôle               | 0.4
Petites villes couronne                  | 0.6
Communes hors attraction des villes      | 0.9
```

### Étape 2 : Distribution par décile

Estimation de la répartition de chaque décile entre les types de territoires :

**Déciles bas (D1-D3)** :
- Plus présents en petites aires et zones rurales
- Coefficient de ruralité moyen : **0.329**

**Déciles moyens (D4-D6)** :
- Distribution équilibrée
- Coefficient de ruralité moyen : **0.247**

**Déciles hauts (D7-D10)** :
- Concentrés dans les grandes aires urbaines
- Coefficient de ruralité moyen : **0.148**

### Étape 3 : Calcul des compensations

**Formule** :
```
Compensation[décile] = Coefficient_Rural[décile] × Surprime_Émissions_ADEME
```

Avec :
- `Coefficient_Rural[décile]` = coefficient moyen de ruralité du décile
- `Surprime_Émissions_ADEME` = 0.50 (+50% en rural)

---

## 📈 Coefficients finaux

| Décile | Coef. Rural | Compensation | % Redistribution supplémentaire à bonus 100% |
|--------|-------------|--------------|---------------------------------------------|
| **D1** | 0.329       | **0.165**    | **+16.4%** |
| **D2** | 0.329       | **0.165**    | **+16.4%** |
| **D3** | 0.329       | **0.165**    | **+16.4%** |
| **D4** | 0.247       | **0.124**    | **+12.4%** |
| **D5** | 0.247       | **0.124**    | **+12.4%** |
| **D6** | 0.247       | **0.124**    | **+12.4%** |
| **D7** | 0.148       | **0.074**    | **+7.4%** |
| **D8** | 0.148       | **0.074**    | **+7.4%** |
| **D9** | 0.148       | **0.074**    | **+7.4%** |
| **D10** | 0.148       | **0.074**    | **+7.4%** |

**Fichier** : [`data/insee/rural_bonus_coefficients.json`](data/insee/rural_bonus_coefficients.json)

---

## 💻 Intégration dans le code

### Code JavaScript généré

**Fichier** : [`data/insee/rural_bonus_code.js`](data/insee/rural_bonus_code.js)

```javascript
// Coefficients de compensation pour bonus zones rurales
// Source: INSEE FiLoSoFi 2017 + ADEME empreinte carbone territoriale
const ruralCompensationCoefficients = [
    0.165, 0.165, 0.165,  // D1-D3: +16.4% à bonus 100%
    0.124, 0.124, 0.124,  // D4-D6: +12.4%
    0.074, 0.074, 0.074, 0.074  // D7-D10: +7.4%
];

// Dans calculateRedistribution(), après calcul des poids de base:
if (state.bonusPercent > 0) {
    weights = weights.map((w, i) => {
        const ruralBonus = ruralCompensationCoefficients[i] * (state.bonusPercent / 100);
        return w * (1 + ruralBonus);
    });
}
```

### Emplacement dans `app.js`

Chercher la fonction `calculateRedistribution()` et ajouter le code après le calcul initial des `weights` mais avant la normalisation finale.

---

## 📊 Exemples d'application

### Scénario 1 : Bonus rural à 0%
- **Aucune compensation** appliquée
- Distribution uniforme ou selon bonus bas revenus uniquement

### Scénario 2 : Bonus rural à 50%
- D1 reçoit **+8.2%** de redistribution supplémentaire
- D5 reçoit **+6.2%**
- D10 reçoit **+3.7%**

### Scénario 3 : Bonus rural à 100%
- D1 reçoit **+16.4%** de redistribution
- D5 reçoit **+12.4%**
- D10 reçoit **+7.4%**

---

## ✅ Validation et limites

### Points forts
✅ Basé sur **données officielles INSEE** (FiLoSoFi 2017)  
✅ Surprime d'émissions validée par **études ADEME**  
✅ Méthodologie documentée et reproductible  
✅ Coefficients progressifs cohérents avec la réalité territoriale

### Limites et hypothèses
⚠️ **Approximation** de la distribution urbain/rural par décile (pas de données croisées directes)  
⚠️ **Moyenne nationale** : ne capture pas les variations régionales  
⚠️ **Données 2017** : à actualiser si FiLoSoFi 2022+ devient disponible  
⚠️ **Surprime fixe** : en réalité varie selon le décile (données non disponibles)

### Recommandations pour amélioration future
1. Obtenir données croisées **décile × ruralité** auprès de l'INSEE
2. Utiliser surprimes différenciées par décile (études ADEME détaillées)
3. Intégrer variations régionales (Nord vs Sud, montagne, etc.)

---

## 📁 Fichiers générés

| Fichier | Description |
|---------|-------------|
| `data/insee/FET2021-D3.xlsx` | Données brutes INSEE téléchargées |
| `data/insee/deciles_par_territoire.json` | Déciles par taille d'aire d'attraction |
| `data/insee/rural_bonus_coefficients.json` | Coefficients finaux calculés |
| `data/insee/rural_bonus_code.js` | Code JavaScript à intégrer |
| `data/insee/sheets_analysis.json` | Analyse comparative des onglets Excel |

---

## 🔗 Références

1. **INSEE** - France, portrait social 2021  
   https://www.insee.fr/fr/statistiques/5039989

2. **ADEME** - Empreinte carbone des ménages  
   Base Carbone® et études territoriales

3. **Pottier et al. (2020)** - Répartition de l'empreinte carbone des Français  
   [Études CIRED]

4. **Grand Lyon** - Analyse empreinte carbone urbain/rural  
   Émissions directes et indirectes par territoire

---

**Date de création** : 2025-12-25  
**Version** : 1.0  
**Auteur** : Analyse CCL France
