document.addEventListener('DOMContentLoaded', () => {
    // ===== DATA CONFIGURATION =====
    const deciles = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    // Emissions moyennes par décile (en tCO2e/ménage/an) - Source: Pottier et al. (2020) - OFCE, Graphique 1
    const baseEmissions = [14.6, 16.7, 17.5, 19.2, 21.0, 22.5, 23.5, 25.5, 27.5, 32.5];

    // Parts de population par territoire (France entière)
    const popShares = {
        rural: 0.23,
        banlieue: 0.44,
        centre: 0.33
    };

    // Emissions par territoire - Source: Pottier et al. (2020) - OFCE, Graphique 1(b)
    const emissionsByTerritory = {
        rural: [17.5, 18.0, 20.0, 21.5, 24.5, 26.5, 26.5, 28.5, 30.5, 33.5],
        banlieue: [15.5, 16.5, 16.5, 18.5, 19.5, 22.0, 23.0, 25.5, 29.5, 35.0],
        centre: [11.5, 14.5, 15.5, 16.5, 17.0, 17.0, 19.5, 22.0, 22.5, 30.0]
    };

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
        viewByTerritory: false,
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
        const territories = ['rural', 'banlieue', 'centre'];

        // 1. Calcul des métriques globales pour le bonus rural
        const avgOverallEmissions = baseEmissions.reduce((a, b) => a + b, 0) / 10;
        const avgOverallTax = avgOverallEmissions * state.carbonPrice;
        const targetRuralBonusPerHH = 0.5 * avgOverallTax; // +50% surprime cible

        // 2. Passage initial : Calcul des bases pour les 30 groupes avec populations variables par décile
        let groupResults = [];
        let totalCollected = 0;

        for (let d = 0; d < 10; d++) {
            const decileNum = d + 1;
            const baseW = Math.pow(11 - decileNum, state.ponderationPercent / 25);

            // Définir des parts de population variables par décile (plus rural en bas, plus centre en haut)
            // Estimation calibrée pour coller aux BaseEmissions (Rural: ~35%->15%, Centre: ~28%->45%)
            let p_r = 0.35 - (d * 0.022); // 35% à D1, ~15% à D10
            let p_c = 0.28 + (d * 0.017); // 28% à D1, ~45% à D10
            let p_b = 1 - p_r - p_c;

            const dPop = { rural: p_r, banlieue: p_b, centre: p_c };

            territories.forEach(t => {
                const pop = dPop[t];
                const emission = emissionsByTerritory[t][d];
                const tax = emission * state.carbonPrice;

                groupResults.push({
                    decile: decileNum,
                    territory: t,
                    pop: pop,
                    tax: tax,
                    baseWeight: baseW * pop
                });

                totalCollected += tax * pop;
            });
        }

        const totalToRedistribute = totalCollected * (state.redistributionPercent / 100);
        const totalBaseWeight = groupResults.reduce((sum, g) => sum + g.baseWeight, 0);

        // Redistribution de base (sans bonus rural)
        groupResults.forEach(g => {
            g.baseRedistribution = (g.baseWeight / totalBaseWeight) * totalToRedistribute;
        });

        // 3. Application du transfert Global (Centre -> Rural)
        const totalRuralPop = groupResults.filter(g => g.territory === 'rural').reduce((sum, g) => sum + g.pop, 0);
        const targetTotalTransfer = targetRuralBonusPerHH * totalRuralPop;
        const actualTotalTransfer = (state.bonusPercent / 100) * targetTotalTransfer;

        const totalCentreRedistribution = groupResults
            .filter(g => g.territory === 'centre')
            .reduce((sum, g) => sum + g.baseRedistribution, 0);

        // Calcul du pourcentage de perte homogène pour le Centre
        const centerLossFactor = totalCentreRedistribution > 0 ? Math.min(1, actualTotalTransfer / totalCentreRedistribution) : 0;
        const effectiveTransfer = centerLossFactor * totalCentreRedistribution;
        const ruralGainPerHH = totalRuralPop > 0 ? effectiveTransfer / totalRuralPop : 0;

        // 4. Calcul final des redistributions et impacts
        groupResults.forEach(g => {
            if (g.territory === 'centre') {
                g.redistribution = g.baseRedistribution * (1 - centerLossFactor);
            } else if (g.territory === 'rural') {
                g.redistribution = g.baseRedistribution + (ruralGainPerHH * g.pop);
            } else {
                g.redistribution = g.baseRedistribution;
            }

            g.netImpact = (g.redistribution / g.pop) - g.tax;
            g.taxCost = -g.tax;
        });

        // 3. Agrégation selon le mode de vue
        if (state.viewByTerritory) {
            return {
                labels: groupResults.map(g => `D${g.decile} ${g.territory[0].toUpperCase()}`),
                taxCost: groupResults.map(g => g.taxCost),
                netImpact: groupResults.map(g => g.netImpact),
                isTerritoryView: true
            };
        } else {
            // Vue par décile (moyenne pondérée)
            const decileData = deciles.map(d => {
                const groups = groupResults.filter(g => g.decile == d);
                const avgTax = groups.reduce((sum, g) => sum + g.tax * g.pop, 0); // popShares sum to 1 per decile
                const avgNet = groups.reduce((sum, g) => sum + g.netImpact * g.pop, 0);
                return { tax: -avgTax, net: avgNet };
            });

            return {
                labels: deciles,
                taxCost: decileData.map(d => d.tax),
                netImpact: decileData.map(d => d.net),
                isTerritoryView: false
            };
        }
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
        const isMobile = width < 500;

        // Mise à jour de la légende
        const legendItem = document.getElementById('redistributionLegend');
        if (legendItem) {
            if (data.isTerritoryView) {
                legendItem.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
                        <span style="font-weight: 600; font-size: 0.85em;">Coût après redistribution :</span>
                        <div class="legend-territories">
                            <span class="legend-sub-item"><span class="legend-color" style="background: #10b981;"></span> Rural</span>
                            <span class="legend-sub-item"><span class="legend-color" style="background: #f59e0b;"></span> Banlieue</span>
                            <span class="legend-sub-item"><span class="legend-color" style="background: #3b82f6;"></span> Centre</span>
                        </div>
                    </div>
                `;
            } else {
                legendItem.innerHTML = `
                    <span class="legend-color-split">
                        <span style="background: #34d399;"></span>
                        <span style="background: #f87171;"></span>
                    </span>
                    <span>Coût après redistribution</span>
                `;
            }
        }

        ctx.clearRect(0, 0, width, height);

        // 1. Calcul de l'échelle dynamique
        const allValues = [...data.taxCost, ...data.netImpact];
        const maxValue = Math.max(...allValues, 1000);
        const minValue = Math.min(...allValues, -4000);
        const range = maxValue - minValue;

        const getY = (val) => padding.top + chartHeight - ((val - minValue) / range) * chartHeight;
        const zeroY = getY(0);

        // 2. Dessiner les axes et la grille
        ctx.beginPath();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = -4000; i <= maxValue; i += 500) {
            const y = getY(i);
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
        }
        ctx.stroke();

        // Axe Zero
        ctx.beginPath();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.moveTo(padding.left, zeroY);
        ctx.lineTo(padding.left + chartWidth, zeroY);
        ctx.stroke();

        // 3. Dessiner les barres
        const nBars = data.labels.length;
        const barWidth = (chartWidth / nBars) * 0.75;
        const gap = (chartWidth / nBars) * 0.25;

        data.labels.forEach((label, i) => {
            const x = padding.left + i * (barWidth + gap) + gap / 2;

            // Couleurs basées sur le territoire
            let barColor = '#34d399'; // default green
            if (data.isTerritoryView) {
                const territory = label.split(' ')[1];
                if (territory === 'R') barColor = '#10b981'; // Rural green
                if (territory === 'B') barColor = '#f59e0b'; // Banlieue orange
                if (territory === 'C') barColor = '#3b82f6'; // Centre blue
            } else {
                barColor = data.netImpact[i] >= 0 ? '#34d399' : '#f87171';
            }

            // A. Barre Coût Taxe (Pointillés/Hachuré)
            const taxY = getY(data.taxCost[i]);
            const taxH = Math.abs(taxY - zeroY);
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = data.isTerritoryView ? 'rgba(100, 116, 139, 0.4)' : 'rgba(59, 130, 246, 0.5)';
            ctx.strokeRect(x, zeroY, barWidth, taxH);
            ctx.fillStyle = data.isTerritoryView ? 'rgba(0,0,0,0.03)' : 'rgba(59, 130, 246, 0.05)';
            ctx.fillRect(x, zeroY, barWidth, taxH);
            ctx.setLineDash([]);

            // B. Barre Impact Net (Pleine)
            const netY = getY(data.netImpact[i]);
            const netH = Math.abs(netY - zeroY);
            ctx.fillStyle = barColor;
            ctx.fillRect(x, Math.min(zeroY, netY), barWidth, netH);

            // C. Labels X
            if (!data.isTerritoryView || (i % 3 === 1)) {
                ctx.fillStyle = '#64748b';
                ctx.font = '12px Inter';
                ctx.textAlign = 'center';
                const labelX = x + barWidth / 2;
                const displayText = data.isTerritoryView ? `D${Math.floor(i / 3) + 1}` : label;
                ctx.fillText(displayText, labelX, height - padding.bottom + 25);
            }
        });

        // 4. Légende Y
        ctx.fillStyle = '#64748b';
        ctx.font = '11px Inter';
        ctx.textAlign = 'right';
        for (let i = -4000; i <= maxValue; i += 1000) {
            ctx.fillText(i + ' €', padding.left - 10, getY(i) + 4);
        }

        ctx.font = isMobile ? 'bold 10px Inter, sans-serif' : 'bold 12px Inter, sans-serif';
        ctx.fillText('Déciles de niveau de vie', padding.left + chartWidth / 2, height - 10);
    };

    const updateSubsidyTotal = () => {
        const totalSubsidyAmountEl = document.getElementById('totalSubsidyAmount');
        const gaugeFill = document.getElementById('subsidyGaugeFill');
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

        // Mettre à jour la jauge
        if (gaugeFill) {
            gaugeFill.style.width = `${subsidyPercent}%`;
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
            revenuePercent.textContent = `Revenu ${redistributionSlider.value}%`;
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

    // Add event listeners for bonus slider and territory view checkbox
    document.getElementById('bonusSlider').addEventListener('input', (e) => {
        state.bonusPercent = parseInt(e.target.value);
        updateAll();
    });

    document.getElementById('territoryViewCheckbox').addEventListener('change', (e) => {
        state.viewByTerritory = e.target.checked;
        updateAll();
    });

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
                const url = `https://script.google.com/macros/s/AKfycbyNBdPzROMkhnNCCCWfkaOJVFwgBKsRwXe3dYIwOD36tVl77hDgSoT32mCYxJIkkpo_Iw/exec?${params.toString()}`;

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
