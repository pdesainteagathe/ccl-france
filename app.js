document.addEventListener('DOMContentLoaded', () => {
    // ===== DATA CONFIGURATION =====
    const deciles = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    // Emissions moyennes par décile (en tonnes CO2/an) - Source: Pottier et al. (2020)
    const baseEmissions = [14.6, 16.8, 17.7, 19.5, 21.2, 22.8, 23.5, 24.8, 25.9, 28.4];

    // ===== SUBSIDIES CONFIGURATION =====
    const subsidiesNames = [
        "Pompe à chaleur",
        "Géothermie",
        "Voiture électrique",
        "Vélo électrique",
        "Trains (Intercités/TER)",
        "Rénovation thermique",
        "Énergies renouvelables",
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
        // Coeff de ruralité : décroissant par décile (hyp: plus rural en bas de l'échelle)
        const ruralityScores = [1.3, 1.2, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.8, 0.75];

        let weights = deciles.map((_, i) => {
            const decileNum = i + 1;
            // Poids de base (1) modulé par la pondération bas revenus (puissance)
            let w = Math.pow(11 - decileNum, state.ponderationPercent / 25);

            // Modulation par le bonus rural (linéaire et moins prononcé que la pondération)
            const rFactor = 1 + (ruralityScores[i] - 1) * (state.bonusPercent / 100);
            return w * rFactor;
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
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText('D' + label, x + barWidth / 2, height - padding.bottom + 25);
        });

        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText('Déciles de niveau de vie', padding.left + chartWidth / 2, height - 10);
    };

    const updateAll = () => {
        const data = calculateData(state);
        renderChart(data);

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

        if (!slider || !display) return;

        const updateValue = () => {
            const val = parseInt(slider.value);
            state[param] = val;

            if (param === 'redistributionPercent') {
                display.textContent = `Revenu ${val}% / Sub. ${100 - val}%`;
            } else if (param === 'carbonPrice') {
                display.textContent = val + ' €/tCO2eq';
            } else {
                display.textContent = val + '%';
            }
            updateAll();
        };

        slider.addEventListener('input', updateValue);
        // Initial set logic
        if (param === 'redistributionPercent') {
            display.textContent = `Revenu ${slider.value}% / Sub. ${100 - slider.value}%`;
        } else if (param === 'carbonPrice') {
            display.textContent = slider.value + ' €/tCO2eq';
        } else {
            display.textContent = slider.value + '%';
        }
    };

    // ===== SUBSIDIES MANAGEMENT =====
    const initSubsidiesUI = () => {
        const container = document.getElementById('subsidiesList');
        if (!container) return;
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
        const delta = newValue - oldValue; // Changement appliqué

        changedSub.percent = newValue;

        // Répartition uniforme : -delta/N pour chacun des N autres curseurs
        const others = state.subsidies.filter((_, i) => i !== changedIndex);
        const N = others.length;
        const uniformChange = -delta / N;

        others.forEach(sub => {
            sub.percent = Math.max(0, sub.percent + uniformChange);
        });

        // Correction pour les arrondis et s'assurer que la somme = 100
        let total = state.subsidies.reduce((a, b) => a + b.percent, 0);
        let diff = 100 - total;

        if (Math.abs(diff) > 0.01) {
            // Distribuer la différence sur tous les curseurs sauf celui modifié
            const adjustPerOther = diff / N;
            others.forEach(sub => {
                sub.percent = Math.max(0, sub.percent + adjustPerOther);
            });

            // Vérification finale
            total = state.subsidies.reduce((a, b) => a + b.percent, 0);
            diff = 100 - total;

            // Si encore un écart dû aux arrondis, ajuster le premier autre curseur
            if (Math.abs(diff) > 0.01) {
                const target = (changedIndex === 0) ? 1 : 0;
                state.subsidies[target].percent = Math.max(0, state.subsidies[target].percent + diff);
            }
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

    // Initialize Main Sliders
    setupSlider('carbonPriceSlider', 'carbonPriceValue', 'carbonPrice');

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
    initSubsidiesUI();

    // Initial Render
    updateAll();

    window.addEventListener('resize', () => {
        updateAll();
    });

    console.log('Simulation initialisée avec 12 subventions et logique de balance.');
});
