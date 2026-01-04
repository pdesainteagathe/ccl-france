document.addEventListener('DOMContentLoaded', () => {
    // ===== DATA CONFIGURATION =====
    const deciles = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    // Emissions moyennes par décile (en tCO2e/ménage/an) - Source: Pottier et al. (2020) - OFCE, Graphique 1
    const baseEmissions = [14.6, 16.7, 17.5, 19.2, 21.0, 22.5, 23.5, 25.5, 27.5, 32.5];

    // Emissions par décile et par type de territoire - Source: Pottier et al. (2020) - OFCE, Graphique 1(b)
    // Données extraites du graphique "Moyenne par décile de niveau de vie et par localisation"
    const emissionsByTerritory = {
        rural: [17.5, 18.0, 20.0, 21.5, 24.5, 26.5, 26.5, 28.5, 30.5, 33.5],
        banlieue: [15.5, 16.5, 16.5, 18.5, 19.5, 22.0, 23.0, 25.5, 29.5, 35.0],
        centre: [11.5, 14.5, 15.5, 16.5, 17.0, 17.0, 19.5, 22.0, 22.5, 30.0]
    };

    // Coefficients de compensation pour bonus zones rurales - DONNÉES RÉELLES Pottier 2020
    // Calculés comme: (Émissions_rural - Émissions_centre) / Émissions_moyenne
    // Ces coefficients reflètent le VRAI surcoût carbone mesuré pour les ménages ruraux de chaque décile
    const ruralCompensationCoefficients = [
        0.411,  // D1: (17.5 - 11.5) / 14.6 = +41.1% surcoût rural vs centre
        0.210,  // D2: (18.0 - 14.5) / 16.7 = +21.0%
        0.257,  // D3: (20.0 - 15.5) / 17.5 = +25.7%
        0.260,  // D4: (21.5 - 16.5) / 19.2 = +26.0%
        0.357,  // D5: (24.5 - 17.0) / 21.0 = +35.7%
        0.422,  // D6: (26.5 - 17.0) / 22.5 = +42.2% ⭐ Maximum
        0.298,  // D7: (26.5 - 19.5) / 23.5 = +29.8%
        0.255,  // D8: (28.5 - 22.0) / 25.5 = +25.5%
        0.291,  // D9: (30.5 - 22.5) / 27.5 = +29.1%
        0.108   // D10: (33.5 - 30.0) / 32.5 = +10.8%
    ];

    // ===== SUBSIDIES CONFIGURATION =====
    const subsidiesNames = [
        "Pompe à chaleur",
        "Géothermie",
        "Voiture électrique",
        "Vélo électrique",
        "Trains (Intercités/TER)",
        "Rénovation thermique",
        "Énergies renouvelables",
        "Énergie nucléaire",
        "Car express régionaux",
        "Fret ferroviaire",
        "Installation de bornes de recharge",
        "Prix des recharges",
        "Agriculture durable",
        "Industrie décarbonée",
        "Fillière bois énergie",
        "Autres"
    ];

    // ===== STATE & UPDATES =====
    let state = {
        carbonPrice: 100,
        redistributionPercent: 100,
        ponderationPercent: 0,
        bonusPercent: 0,
        viewByTerritory: false,  // Nouvelle option pour vue splittée par ruralité
        subsidies: subsidiesNames.map((name, i) => ({
            id: `sub_${i}`,
            name: name,
            percent: Math.round(100 / subsidiesNames.length)
        }))
    };

    // Ensure initial sum is exactly 100
    const currentSum = state.subsidies.reduce((a, b) => a + b.percent, 0);
    if (currentSum !== 100) {
        state.subsidies[0].percent += (100 - currentSum);
    }

    // ===== DATA GENERATION =====
    const calculateData = (state) => {
        // 1. Calcul de la taxe payée par décile
        const taxPaid = baseEmissions.map(e => e * state.carbonPrice);
        const totalCollected = taxPaid.reduce((a, b) => a + b, 0);

        // 2. Montant total à redistribuer (Revenu Direct)
        // state.redistributionPercent représente ici la part "Revenu Direct"
        const totalToRedistribute = totalCollected * (state.redistributionPercent / 100);


        // 3. Calcul des poids pour la redistribution (Revenu Direct)

        // Coefficients de compensation pour bonus zones rurales
        // Source: INSEE FiLoSoFi 2017 + ADEME empreinte carbone territoriale
        // Les déciles bas (D1-D3) sont plus présents en zones rurales (+16.4% à bonus 100%)
        // Les déciles moyens (D4-D6) sont équilibrés (+12.4%)
        // Les déciles hauts (D7-D10) sont concentrés en zones urbaines (+7.4%)
        let weights = deciles.map((_, i) => {
            const decileNum = i + 1;
            // Poids de base (1) modulé par la pondération faibles revenus (puissance)
            let w = Math.pow(11 - decileNum, state.ponderationPercent / 25);

            // Modulation par le bonus rural (proportionnel aux données réelles Pottier 2020)
            const ruralBonus = ruralCompensationCoefficients[i] * (state.bonusPercent / 100);
            return w * (1 + ruralBonus);
        });

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let redistribution = weights.map(w => (w / totalWeight) * totalToRedistribute);

        // 4. Calcul du Net (Redistribution - Taxe)
        const netTransfer = redistribution.map((r, i) => r - taxPaid[i]);

        return {
            labels: deciles,
            taxCost: taxPaid.map(v => -v),
            netImpact: netTransfer
        };
    };

    // ===== CHART RENDERING =====
    const renderChart = (data) => {
        const canvas = document.getElementById('mainChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 40, right: 30, bottom: 60, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        // Finding min/max for scale
        const allValues = [...data.taxCost, ...data.netImpact];
        let maxValue = Math.max(...allValues, 100);
        let minValue = Math.min(...allValues, -100);
        const margin = (maxValue - minValue) * 0.15;
        maxValue += margin;
        minValue -= margin;
        const range = maxValue - minValue;

        const getY = (val) => padding.top + chartHeight - ((val - minValue) / range) * chartHeight;
        const zeroY = getY(0);

        // Draw Grid
        ctx.strokeStyle = '#e1e8ed';
        ctx.lineWidth = 1;
        ctx.textAlign = 'right';
        ctx.fillStyle = '#5a6c7d';
        ctx.font = '11px Inter, sans-serif';

        const step = 500;
        for (let v = Math.floor(minValue / step) * step; v <= maxValue; v += step) {
            const y = getY(v);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
            ctx.fillText(v + ' €', padding.left - 10, y + 4);
        }

        // Zero Line
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, zeroY);
        ctx.lineTo(padding.left + chartWidth, zeroY);
        ctx.stroke();

        // Draw Bars
        const barWidth = (chartWidth / 10) * 0.7;
        const groupWidth = chartWidth / 10;
        const isMobile = width < 500; // Déplacé ici pour être accessible partout

        data.labels.forEach((label, i) => {
            const x = padding.left + i * groupWidth + (groupWidth - barWidth) / 2;

            const taxY = getY(data.taxCost[i]);
            ctx.fillStyle = 'rgba(74, 144, 226, 0.25)'; // Bleu clair
            ctx.fillRect(x, Math.min(zeroY, taxY), barWidth, Math.abs(taxY - zeroY));

            // Bordure pointillée pour les barres de taxe
            ctx.strokeStyle = '#4a90e2'; // Bleu
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]); // Pointillés : 5px de trait, 3px d'espace
            ctx.strokeRect(x, Math.min(zeroY, taxY), barWidth, Math.abs(taxY - zeroY));
            ctx.setLineDash([]); // Réinitialiser pour les autres éléments

            const netY = getY(data.netImpact[i]);
            ctx.fillStyle = data.netImpact[i] >= 0 ? '#4CAF50' : '#e74c3c'; // Vert pour positif, rouge pour négatif
            ctx.fillRect(x, Math.min(zeroY, netY), barWidth, Math.abs(netY - zeroY));

            // Affichage du pourcentage à droite de la barre
            if (data.percentages) {
                const percentage = data.percentages[i];
                const percentText = (percentage >= 0 ? '+' : '') + percentage.toFixed(1) + '%';
                ctx.fillStyle = percentage >= 0 ? '#4CAF50' : '#e74c3c';
                ctx.textAlign = 'left';
                ctx.font = '10px Inter, sans-serif';
                ctx.fillText(percentText, x + barWidth + 5, netY - 2);
            }

            ctx.fillStyle = '#2c3e50';
            ctx.textAlign = 'center';
            // Utiliser isMobile déclaré avant le forEach
            ctx.font = isMobile ? '9px Inter, sans-serif' : '12px Inter, sans-serif';
            ctx.fillText('D' + label, x + barWidth / 2, height - padding.bottom + 25);
        });

        ctx.font = isMobile ? 'bold 10px Inter, sans-serif' : 'bold 12px Inter, sans-serif';
        ctx.fillText('Déciles de niveau de vie', padding.left + chartWidth / 2, height - 10);
    };

    const updateSubsidyTotal = () => {
        const totalSubsidyAmountEl = document.getElementById('totalSubsidyAmount');
        const subsidyGaugeFill = document.getElementById('subsidyGaugeFill');
        if (!totalSubsidyAmountEl) return;

        // Calculer les émissions totales (somme des émissions par décile)
        const totalEmissions = baseEmissions.reduce((a, b) => a + b, 0);

        // Calculer le montant total collecté
        const totalCollected = totalEmissions * state.carbonPrice;

        // Calculer la part de subventions (100 - redistributionPercent)
        const subsidyPercent = 100 - state.redistributionPercent;

        // Calculer le montant des subventions en milliards d'euros
        const subsidyAmount = (totalCollected * subsidyPercent / 100) / 1000; // Division par 1000 pour convertir en milliards

        // Afficher le montant
        totalSubsidyAmountEl.textContent = `(${subsidyAmount.toFixed(1)} Md€)`;

        // Mettre à jour la jauge de progression
        if (subsidyGaugeFill) {
            subsidyGaugeFill.style.width = `${subsidyPercent}%`;
        }
    };

    const updateAll = () => {
        const data = calculateData(state);
        renderChart(data);
        updateSubsidyTotal();

        // Handle subsidies panel visibility and state
        const panel = document.getElementById('subsidiesPanel');
        const grid = document.querySelector('.content-grid');
        const sliders = panel.querySelectorAll('.compact-slider');

        if (state.redistributionPercent < 100) {
            panel.style.display = 'block';
            panel.classList.remove('disabled');
            grid.classList.add('has-right-sidebar');
            // Activer tous les curseurs
            sliders.forEach(slider => slider.disabled = false);
        } else {
            // Garder visible mais griser
            panel.style.display = 'block';
            panel.classList.add('disabled');
            grid.classList.add('has-right-sidebar');
            // Désactiver tous les curseurs
            sliders.forEach(slider => slider.disabled = true);
        }
    };

    // ===== SLIDERS SETUP =====
    const setupSlider = (id, valueId, param) => {
        const slider = document.getElementById(id);
        const display = document.getElementById(valueId);

        if (!slider) return;

        const updateValue = () => {
            const val = parseInt(slider.value);
            state[param] = val;

            if (display) {
                if (param === 'redistributionPercent') {
                    display.textContent = `Revenu ${val}% / Sub. ${100 - val}%`;
                } else if (param === 'carbonPrice') {
                    display.innerHTML = `${val} <span class="unit">€/tCO2eq</span>`;
                } else {
                    display.textContent = val + '%';
                }
            }
            updateAll();
        };

        slider.addEventListener('input', updateValue);
        // Initial set logic
        if (display) {
            if (param === 'redistributionPercent') {
                display.textContent = `Revenu ${slider.value}% / Sub. ${100 - slider.value}%`;
            } else if (param === 'carbonPrice') {
                display.innerHTML = `${slider.value} <span class="unit">€/tCO2eq</span>`;
            } else {
                display.textContent = slider.value + '%';
            }
        }
    };


    // ===== SUBSIDIES MANAGEMENT =====
    const initSubsidiesUI = () => {
        console.log('[INIT] initSubsidiesUI called, state.subsidies:', state.subsidies);
        const container = document.getElementById('subsidiesList');
        if (!container) {
            console.error('[INIT] subsidiesList container not found!');
            return;
        }
        console.log('[INIT] container found, proceeding with UI generation');
        container.innerHTML = '';

        state.subsidies.forEach((sub, index) => {
            const control = document.createElement('div');
            control.className = 'compact-slider-control';
            control.innerHTML = `
                <div class="compact-slider-name" title="${sub.name}">${sub.name}</div>
                <div class="compact-slider-wrapper">
                    <input type="range" class="compact-slider" id="${sub.id}" min="0" max="100" value="${sub.percent}">
                    <span class="compact-slider-percentage" id="${sub.id}-percent">${sub.percent}%</span>
                </div>
            `;
            container.appendChild(control);

            const slider = control.querySelector('input');
            slider.addEventListener('input', (e) => {
                balanceSubsidies(index, parseInt(e.target.value));
            });
        });
    };

    const balanceSubsidies = (changedIndex, newValue) => {
        const changedSub = state.subsidies[changedIndex];
        const oldValue = changedSub.percent;

        // Clamper la nouvelle valeur entre 0 et 100
        newValue = Math.max(0, Math.min(100, newValue));

        // Si changement à 100%, mettre tous les autres à 0
        if (newValue === 100) {
            state.subsidies.forEach((sub, i) => {
                if (i === changedIndex) {
                    sub.percent = 100;
                } else {
                    sub.percent = 0;
                }
            });
            updateSubsidiesUI();
            return;
        }

        // Appliquer le nouveau pourcentage
        changedSub.percent = newValue;

        // Calculer le reste à distribuer
        const remaining = 100 - newValue;

        // Récupérer les autres sliders (excluant le slider modifié)
        const otherIndices = state.subsidies
            .map((_, i) => i)
            .filter(i => i !== changedIndex);

        // Calculer la somme actuelle des autres sliders
        const currentOthersSum = otherIndices.reduce((sum, i) => sum + state.subsidies[i].percent, 0);

        if (currentOthersSum === 0) {
            // Si tous les autres sont à 0, distribuer uniformément
            const perOther = remaining / otherIndices.length;
            otherIndices.forEach(i => {
                state.subsidies[i].percent = perOther;
            });
        } else {
            // Redistribuer proportionnellement au poids actuel
            otherIndices.forEach(i => {
                const ratio = state.subsidies[i].percent / currentOthersSum;
                state.subsidies[i].percent = remaining * ratio;
            });
        }

        // Arrondir tous les pourcentages
        state.subsidies.forEach(sub => {
            sub.percent = Math.round(sub.percent);
        });

        // Correction finale pour garantir exactement 100%
        let total = state.subsidies.reduce((a, b) => a + b.percent, 0);
        const diff = 100 - total;

        if (diff !== 0) {
            // Ajuster le slider qui a le plus de marge (pas celui qu'on vient de modifier)
            const adjustableIndex = otherIndices.reduce((maxIdx, i) => {
                return state.subsidies[i].percent > state.subsidies[maxIdx].percent ? i : maxIdx;
            }, otherIndices[0]);

            state.subsidies[adjustableIndex].percent = Math.max(0, state.subsidies[adjustableIndex].percent + diff);
        }

        updateSubsidiesUI();
    };

    const updateSubsidiesUI = () => {
        state.subsidies.forEach(sub => {
            const slider = document.getElementById(sub.id);
            const percentSpan = document.getElementById(`${sub.id}-percent`);
            if (slider) {
                slider.value = sub.percent;
            }
            if (percentSpan) {
                percentSpan.textContent = Math.round(sub.percent) + '%';
            }
        });
        updateAll();
    };


    // Initialize Carbon Price Slider with tooltip on thumb
    const carbonPriceSlider = document.getElementById('carbonPriceSlider');
    const carbonPriceTooltip = document.getElementById('carbonPriceTooltip');

    if (carbonPriceSlider && carbonPriceTooltip) {
        const updateCarbonPrice = () => {
            const val = parseInt(carbonPriceSlider.value);
            state.carbonPrice = val;

            // Update tooltip text
            carbonPriceTooltip.textContent = `${val} €/tCO2eq`;

            // Calculate position (percentage along the slider)
            const min = parseInt(carbonPriceSlider.min);
            const max = parseInt(carbonPriceSlider.max);
            const percent = ((val - min) / (max - min)) * 100;
            carbonPriceTooltip.style.left = `${percent}%`;

            updateAll();
        };

        carbonPriceSlider.addEventListener('input', updateCarbonPrice);
        // Initialize
        updateCarbonPrice();
    }

    // Slider de redistribution (met à jour les deux pourcentages)
    const redistributionSlider = document.getElementById('redistributionSlider');
    const subsidiesPercent = document.getElementById('subsidiesPercent');
    const revenuePercent = document.getElementById('revenuePercent');

    if (redistributionSlider && subsidiesPercent && revenuePercent) {
        const updateRedistribution = () => {
            const val = parseInt(redistributionSlider.value);
            state.redistributionPercent = val;
            subsidiesPercent.textContent = `Sub. ${100 - val}%`;
            revenuePercent.textContent = `Revenu ${val}%`;
            updateAll();
        };

        redistributionSlider.addEventListener('input', updateRedistribution);
        // Initialisation
        subsidiesPercent.textContent = `Sub. ${100 - redistributionSlider.value}%`;
        revenuePercent.textContent = `Revenu ${redistributionSlider.value}%`;
    }

    // Slider de pondération (sans affichage de valeur, utilise l'icône d'aide)
    const ponderationSlider = document.getElementById('ponderationSlider');
    if (ponderationSlider) {
        ponderationSlider.addEventListener('input', (e) => {
            state.ponderationPercent = parseInt(e.target.value);
            updateAll();
        });
    }

    setupSlider('bonusSlider', 'bonusValue', 'bonusPercent');

    // Initialize Subsidies UI
    console.log('[INIT] About to call initSubsidiesUI');
    initSubsidiesUI();
    console.log('[INIT] initSubsidiesUI completed');

    // Initial Render
    updateAll();

    window.addEventListener('resize', () => {
        updateAll();
    });

    // ===== VOTE FUNCTIONALITY =====
    const voteBtn = document.getElementById('voteBtn');
    if (voteBtn) {
        voteBtn.addEventListener('click', async () => {
            // Désactiver le bouton pendant l'envoi
            voteBtn.disabled = true;
            voteBtn.textContent = 'Envoi...';

            try {
                // Préparer les données de vote
                const voteData = {
                    timestamp: new Date().toISOString(),
                    carbonPrice: state.carbonPrice,
                    redistributionPercent: state.redistributionPercent,
                    ponderationPercent: state.ponderationPercent,
                    bonusPercent: state.bonusPercent,
                };

                // Ajouter chaque subvention comme paramètre séparé
                state.subsidies.forEach((sub, index) => {
                    voteData[`subsidy_${index}_name`] = sub.name;
                    voteData[`subsidy_${index}_percent`] = Math.round(sub.percent);
                });

                // Construire l'URL avec les paramètres
                const params = new URLSearchParams(voteData);
                const url = `https://script.google.com/macros/s/AKfycbxo25vWmWzY_8Upk6q11UO7ZrhxqIm2lEWGFlOkk1qB2R3ZbAkg0va2mAfTOOyA1iCf_A/exec?${params.toString()}`;

                // Envoyer au Google Sheet via GET
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'no-cors'
                });

                // Succès (no-cors ne permet pas de lire la réponse, mais si pas d'erreur = succès)
                voteBtn.innerHTML = '<span class="vote-text-main">✓ Vote enregistré !</span><span class="vote-text-sub">Merci pour votre participation</span>';
                voteBtn.style.background = '#4CAF50';

                // Réactiver après 3 secondes
                setTimeout(() => {
                    voteBtn.innerHTML = '<span class="vote-text-main">Je vote</span><span class="vote-text-sub">pour cette redistribution</span>';
                    voteBtn.style.background = '';
                    voteBtn.disabled = false;
                }, 3000);

            } catch (error) {
                console.error('Erreur lors de l\'envoi du vote:', error);
                voteBtn.innerHTML = '<span class="vote-text-main">⚠ Erreur</span><span class="vote-text-sub">Réessayez</span>';
                voteBtn.style.background = '#e74c3c';

                // Réactiver après 3 secondes
                setTimeout(() => {
                    voteBtn.innerHTML = '<span class="vote-text-main">Je vote</span><span class="vote-text-sub">pour cette redistribution</span>';
                    voteBtn.style.background = '';
                    voteBtn.disabled = false;
                }, 3000);
            }
        });
    }

    console.log('Simulation initialisée avec 12 subventions et logique de balance.');
});
