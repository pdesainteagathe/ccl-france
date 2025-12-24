document.addEventListener('DOMContentLoaded', () => {
    // ===== DATA CONFIGURATION =====
    const carbonPrice = 100; // €/tonne
    const deciles = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    // Emissions moyennes par décile (en tonnes CO2/an) - Croissantes
    const baseEmissions = [3.2, 4.5, 5.8, 6.5, 7.8, 9.2, 10.5, 12.8, 15.2, 22.5];

    // ===== DATA GENERATION =====
    const calculateData = (state) => {
        // 1. Calcul de la taxe payée par décile
        const taxPaid = baseEmissions.map(e => e * carbonPrice);
        const totalCollected = taxPaid.reduce((a, b) => a + b, 0);

        // 2. Montant total à redistribuer (Revenu Direct)
        // state.redistributionPercent représente ici la part "Revenu Direct"
        const totalToRedistribute = totalCollected * (state.redistributionPercent / 100);

        // 3. Calcul des poids pour la redistribution (Revenu Direct)
        // Pondération bas revenus (0% = égalitaire, 100% = très ciblé sur D1-D3)
        let weights = deciles.map((_, i) => {
            const decileNum = i + 1;
            // Fonction qui donne plus de poids aux petits chiffres si ponderation > 0
            return Math.pow(11 - decileNum, state.ponderationPercent / 25);
        });

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let redistribution = weights.map(w => (w / totalWeight) * totalToRedistribute);

        // 4. Bonus Rural (ajoute un montant forfaitaire lié au paramètre)
        // Note: Le bonus rural est ici financé par la part redistribuée ou les revenus globaux
        const bonusAmount = (state.bonusPercent / 100) * (totalToRedistribute / 10);
        redistribution = redistribution.map(r => r + bonusAmount);

        // 5. Calcul du Net (Redistribution - Taxe)
        // Pour correspondre à l'image "Transferts nets"
        const netTransfer = redistribution.map((r, i) => r - taxPaid[i]);

        return {
            labels: deciles,
            taxCost: taxPaid.map(v => -v), // Négatif pour le coût
            netImpact: netTransfer
        };
    };

    // ===== CHART RENDERING (Pure Canvas) =====
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

        // Trouver les min/max pour l'échelle (en €)
        const allValues = [...data.taxCost, ...data.netImpact];
        const maxValue = Math.max(...allValues, 1000);
        const minValue = Math.min(...allValues, -2500);
        const range = maxValue - minValue;

        const getY = (val) => padding.top + chartHeight - ((val - minValue) / range) * chartHeight;
        const zeroY = getY(0);

        // Draw Grid & Labels
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

        // Draw Zero Line
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

            // 1. Bar Coût de la taxe (gris clair / hachuré ou transparent)
            const taxY = getY(data.taxCost[i]);
            ctx.fillStyle = 'rgba(124, 184, 124, 0.2)'; // Vert très clair pour le coût payé
            ctx.fillRect(x, Math.min(zeroY, taxY), barWidth, Math.abs(taxY - zeroY));
            ctx.strokeStyle = '#7cb87c';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, Math.min(zeroY, taxY), barWidth, Math.abs(taxY - zeroY));

            // 2. Bar Impact Net (Bleu comme sur l'image)
            const netY = getY(data.netImpact[i]);
            ctx.fillStyle = data.netImpact[i] >= 0 ? '#9b8fb8' : '#e74c3c'; // Violet si positif, rouge si négatif
            ctx.fillRect(x, Math.min(zeroY, netY), barWidth, Math.abs(netY - zeroY));

            // Labels Déciles
            ctx.fillStyle = '#2c3e50';
            ctx.textAlign = 'center';
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText('D' + label, x + barWidth / 2, height - padding.bottom + 25);
        });

        // X-axis title
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText('Déciles de niveau de vie', padding.left + chartWidth / 2, height - 10);
    };

    // ===== STATE & UPDATES =====
    let state = {
        redistributionPercent: 70,
        ponderationPercent: 0,
        bonusPercent: 0
    };

    const updateAll = () => {
        const data = calculateData(state);
        renderChart(data);
    };

    // ===== SLIDERS SETUP =====
    const setupSlider = (id, valueId, param) => {
        const slider = document.getElementById(id);
        const display = document.getElementById(valueId);

        if (!slider || !display) {
            console.error('Missing element:', id, valueId);
            return;
        }

        const updateValue = () => {
            const val = slider.value;
            state[param] = parseInt(val);

            if (param === 'redistributionPercent') {
                display.textContent = `Revenu ${val}% / Sub. ${100 - val}%`;
            } else if (param === 'bonusPercent') {
                display.textContent = '+' + val + '%';
            } else {
                display.textContent = val + '%';
            }
            updateAll();
        };

        slider.addEventListener('input', updateValue);
        // Initial set
        if (param === 'redistributionPercent') {
            display.textContent = `Revenu ${slider.value}% / Sub. ${100 - slider.value}%`;
        } else if (param === 'bonusPercent') {
            display.textContent = '+' + slider.value + '%';
        } else {
            display.textContent = slider.value + '%';
        }
    };

    setupSlider('redistributionSlider', 'redistributionValue', 'redistributionPercent');
    setupSlider('ponderationSlider', 'ponderationValue', 'ponderationPercent');
    setupSlider('bonusSlider', 'bonusValue', 'bonusPercent');

    // Initial Render
    updateAll();

    // Resize handling
    window.addEventListener('resize', () => {
        updateAll();
    });

    // Download/Share (Simplified)
    document.getElementById('downloadBtn')?.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'taxe-carbone-impact.png';
        link.href = document.getElementById('mainChart').toDataURL();
        link.click();
    });

    console.log('Calculateur initialisé avec succès');
});
