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

4. **Bonus zones rurales** (0-100%)
   - Compense la surprime carbone des ménages ruraux (+50% d'émissions moy.)
   - Mécanisme : Transfert global uniformisé depuis les revenus des centres-villes
   - Données : **Pottier et al. (2020)** (découpage Déciles x Ruralité)

5. **Vue par ruralité** (Nouveau ✨)
   - Permet d'éclater le graphique en 30 groupes (10 déciles x 3 territoires)
   - Visualise précisément les transferts entre Rural, Banlieue et Centre

6. **Choix des subventions** (panel de droite)
   - 15 catégories de subventions climatiques
   - Ajustement en temps réel pour maintenir 100% de répartition

---

## 🧮 Méthodologie

### Sources de données

#### 1. Empreinte carbone par décile
**Source** : [Pottier et al. (2020)](https://www.ofce.sciences-po.fr/pdf/revue/3-169OFCE.pdf) - CGDD/ADEME  
**Données** : `data/empreinte_carbone_pottier.csv`


#### 2. Répartition territoriale
**Source** : INSEE FiLoSoFi 2017  
**Usage** : Calcul des coefficients de compensation pour le bonus rural

Observations clés :
- Empreinte carbone détaillée par territoire (Rural, Banlieue, Centre) par décile.
- Calibration : Le bonus 100% compense exactement la surprime de +50% de taxe moyenne en milieu rural.
- Répartition population : Variable par décile (plus rurale en D1, plus urbaine en D10).

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

##### c) Application du bonus zones rurales (Transfert Global)

Le bonus rural fonctionne comme un transfert de redistribution "Zero-Sum" au niveau national.

**Méthodologie** :
1. **Cible** : Calcul de la surprime cible (+50% de la taxe moyenne nationale).
2. **Prélèvement** : Une part homogène (même %) est prélevée sur la redistribution de tous les habitants des **Centres-villes**.
3. **Distribution** : Ce montant est redistribué de manière **uniforme** (même montant en €/ménage) à tous les habitants **Ruraux**.
4. **Neutre** : Les habitants des **Banlieues** ne sont pas impactés.

Cette approche renforce mécaniquement la redistribution pro-pauvre car les ménages ruraux sont proportionnellement plus nombreux dans les premiers déciles.

##### d) Vue par ruralité (30 groupes)

L'application simule 30 populations distinctes basées sur les données de Pottier et al. (2020) :
- **Rural** : Émissions les plus élevées, dépendance voiture.
- **Banlieue** : Mixte, émissions intermédiaires.
- **Centre** : Émissions les plus faibles, densité élevée, services.

Le graphique agrégé par décile simple est la moyenne pondérée de ces 30 populations, utilisant des parts de population qui décroissent avec le revenu (35% rural à D1 → 15% à D10).

##### e) Normalisation et impact final

```javascript
Impact_net = (Redistribution / Population) - Taxe_payée
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

Compenser le **surcoût carbone structurel** des ménages ruraux, qui émettent davantage (+50% en moyenne pour le transport et le logement) en raison de la dépendance à la voiture et de l'isolation thermique moindre des logements anciens.

### Sources de données

#### 1. Pottier et al. (2020) - Étude OFCE
Cette étude fournit les émissions moyennes par décile de niveau de vie, croisées avec le type de territoire (Rural, Banlieue, Centre). Ces données sont intégrées directement dans le calculateur pour simuler 30 groupes distincts.

#### 2. Répartition de la population par décile
Comme les données croisées de population (Nb ménages x Décile x Territoire) ne sont pas publiques, nous utilisons une distribution estimée calibrée sur les travaux de l'INSEE :
- **Rural** : Plus représenté dans les bas revenus (35% en D1) que dans les hauts revenus (15% en D10).
- **Centre** : Plus représenté dans les hauts revenus (45% en D10) que dans les bas revenus (28% en D1).

### Mécanisme de Transfert Global

Contrairement aux versions précédentes, le bonus rural n'est pas un calcul local par décile, mais un **transfert de solidarité nationale** :

1. **Calcul du prélèvement** : On prélève un pourcentage homogène sur la redistribution destinée à tous les habitants des **Centres-villes**.
2. **Impact pour les citadins** : Une réduction de leur "chèque vert" pour financer la solidarité territoriale.
3. **Calcul du bonus** : Le montant total prélevé est distribué de manière **uniforme** (même montant pour tous) à chaque ménage **Rural**.
4. **Calibration** : Le curseur est réglé pour que le bonus 100% compense exactement la surprime carbone de +50% calculée sur l'émission moyenne nationale.
5. **Effet redistributif pro-pauvre** : Comme les ruraux sont plus nombreux dans les déciles bas, ces déciles voient leur redistribution moyenne augmenter globalement (effet visible sur le graphique principal).

---

## 🔬 Validations et sources

### Études de référence

1. **Pottier et al. (2020)**  
   *Répartition de l'empreinte carbone des Français*  
   OFCE / CGDD - Analyse détaillée par décile et territoire.

2. **INSEE**  
   *Les niveaux de vie par territoire*  
   Données sur la concentration de la pauvreté rurale et la richesse urbaine.

3. **ADEME**  
   *Empreinte carbone territoriale*  
   Données sur les surconsommations de carburant et de fioul en ruralité.

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
