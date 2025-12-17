// ===== DATA GENERATION =====
const generateChartData = (redistributionPercent, compensationMeasure) => {
    const incomeGroups = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    
    // Base costs without compensation (decreasing as income increases - regressive tax)
    const baseCosts = [3.5, 3.3, 3.1, 2.9, 2.7, 2.5, 2.3, 2.1, 1.9, 1.7];
    
    // Calculate compensation based on measure type
    const getCompensation = (index, measure) => {
        const redistributionFactor = redistributionPercent / 100;
        
        switch(measure) {
            case 'equal-capita':
                // Equal per capita - same for everyone
                return 1.8 * redistributionFactor;
            
            case 'equal-household':
                // Equal per household - slightly varies
                return (1.6 + Math.random() * 0.4) * redistributionFactor;
            
            case 'electricity':
                // Electricity subsidy - benefits lower income more
                return (2.2 - index * 0.15) * redistributionFactor;
            
            case 'exempting':
                // Exempting electricity - proportional to usage
                return (1.5 + index * 0.1) * redistributionFactor;
            
            case 'consumption':
                // Reducing VAT - benefits higher spenders more
                return (1.2 + index * 0.12) * redistributionFactor;
            
            default:
                return 1.8 * redistributionFactor;
        }
    };
    
    const compensatedCosts = baseCosts.map((cost, index) => {
        const compensation = getCompensation(index, compensationMeasure);
        return Math.max(0, cost - compensation);
    });
    
    return {
        labels: incomeGroups,
        noCompensation: baseCosts,
        withCompensation: compensatedCosts
    };
};

// ===== CHART RENDERING =====
let chartInstance = null;

const renderChart = (data) => {
    const canvas = document.getElementById('mainChart');
    const ctx = canvas.getContext('2d');
    
    // Clear previous chart
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    
    // Chart dimensions
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Find max value for scaling
    const maxValue = Math.max(...data.noCompensation, ...data.withCompensation);
    const yScale = chartHeight / (maxValue * 1.1);
    
    // Bar dimensions
    const barGroupWidth = chartWidth / data.labels.length;
    const barWidth = barGroupWidth * 0.35;
    const barGap = barGroupWidth * 0.1;
    
    // Colors
    const greenColor = '#7cb87c';
    const purpleColor = '#9b8fb8';
    const gridColor = '#e1e8ed';
    const textColor = '#5a6c7d';
    
    // Draw grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
        
        // Y-axis labels
        const value = (maxValue * 1.1 * (5 - i) / 5).toFixed(1);
        ctx.fillStyle = textColor;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(value + '%', padding.left - 10, y + 4);
    }
    
    // Draw bars with animation
    data.labels.forEach((label, index) => {
        const x = padding.left + index * barGroupWidth;
        
        // No compensation bar (green)
        const noCompHeight = data.noCompensation[index] * yScale;
        const noCompY = padding.top + chartHeight - noCompHeight;
        
        ctx.fillStyle = greenColor;
        ctx.fillRect(x + barGap, noCompY, barWidth, noCompHeight);
        
        // With compensation bar (purple)
        const compHeight = data.withCompensation[index] * yScale;
        const compY = padding.top + chartHeight - compHeight;
        
        ctx.fillStyle = purpleColor;
        ctx.fillRect(x + barGap + barWidth, compY, barWidth, compHeight);
        
        // X-axis labels
        ctx.fillStyle = textColor;
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barGroupWidth / 2, height - padding.bottom + 20);
    });
    
    // Add hover effects
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        let hovering = false;
        
        data.labels.forEach((label, index) => {
            const x = padding.left + index * barGroupWidth;
            
            // Check no compensation bar
            const noCompHeight = data.noCompensation[index] * yScale;
            const noCompY = padding.top + chartHeight - noCompHeight;
            
            if (mouseX >= x + barGap && mouseX <= x + barGap + barWidth &&
                mouseY >= noCompY && mouseY <= noCompY + noCompHeight) {
                hovering = true;
            }
            
            // Check compensation bar
            const compHeight = data.withCompensation[index] * yScale;
            const compY = padding.top + chartHeight - compHeight;
            
            if (mouseX >= x + barGap + barWidth && mouseX <= x + barGap + barWidth * 2 &&
                mouseY >= compY && mouseY <= compY + compHeight) {
                hovering = true;
            }
        });
        
        canvas.style.cursor = hovering ? 'pointer' : 'default';
    };
};

// ===== STATE MANAGEMENT =====
let appState = {
    redistributionPercent: 70,
    compensationMeasure: 'equal-capita',
    displayMode: 'relative'
};

const updateChart = () => {
    const data = generateChartData(appState.redistributionPercent, appState.compensationMeasure);
    renderChart(data);
};

// ===== EVENT LISTENERS =====

// Slider
const slider = document.getElementById('redistributionSlider');
const sliderValue = document.getElementById('sliderValue');

slider.addEventListener('input', (e) => {
    const value = e.target.value;
    appState.redistributionPercent = parseInt(value);
    sliderValue.textContent = value + '%';
    updateChart();
});

// Compensation cards
const compensationCards = document.querySelectorAll('.compensation-card');

compensationCards.forEach(card => {
    card.addEventListener('click', () => {
        // Remove active class from all cards
        compensationCards.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked card
        card.classList.add('active');
        
        // Update state
        appState.compensationMeasure = card.dataset.measure;
        updateChart();
    });
});

// Tab buttons
const tabButtons = document.querySelectorAll('.tab-button');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        
        // In a real app, this would switch between different configuration panels
        console.log('Switched to tab:', button.dataset.tab);
    });
});

// Detail buttons
const detailButtons = document.querySelectorAll('.detail-button');

detailButtons.forEach(button => {
    button.addEventListener('click', () => {
        detailButtons.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        
        // In a real app, this would change the chart visualization type
        console.log('Switched to detail level:', button.textContent.trim());
    });
});

// Display toggle
const displayToggle = document.getElementById('displayToggle');

displayToggle.addEventListener('change', (e) => {
    appState.displayMode = e.target.checked ? 'absolute' : 'relative';
    
    // In a real app, this would convert the chart values
    console.log('Display mode:', appState.displayMode);
});

// Download button
const downloadBtn = document.getElementById('downloadBtn');

downloadBtn.addEventListener('click', () => {
    const canvas = document.getElementById('mainChart');
    const link = document.createElement('a');
    link.download = 'carbon-pricing-chart.png';
    link.href = canvas.toDataURL();
    link.click();
    
    // Also generate CSV data
    const data = generateChartData(appState.redistributionPercent, appState.compensationMeasure);
    let csv = 'Income Group,No Compensation (%),With Compensation (%)\n';
    data.labels.forEach((label, index) => {
        csv += `${label},${data.noCompensation[index]},${data.withCompensation[index]}\n`;
    });
    
    const csvBlob = new Blob([csv], { type: 'text/csv' });
    const csvLink = document.createElement('a');
    csvLink.download = 'carbon-pricing-data.csv';
    csvLink.href = URL.createObjectURL(csvBlob);
    csvLink.click();
    
    console.log('Downloaded chart and data');
});

// Share button
const shareBtn = document.getElementById('shareBtn');

shareBtn.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('redistribution', appState.redistributionPercent);
    url.searchParams.set('measure', appState.compensationMeasure);
    
    navigator.clipboard.writeText(url.toString()).then(() => {
        // Visual feedback
        const originalText = shareBtn.innerHTML;
        shareBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 4L6 11L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Copied to clipboard!
        `;
        shareBtn.style.color = '#7cb87c';
        
        setTimeout(() => {
            shareBtn.innerHTML = originalText;
            shareBtn.style.color = '';
        }, 2000);
    });
});

// Country selector
const countrySelector = document.getElementById('countrySelector');

countrySelector.addEventListener('click', () => {
    // In a real app, this would open a modal with country options
    alert('Country selection would open here. Available countries: France, Germany, UK, USA, etc.');
});

// Info icons
document.querySelectorAll('.info-icon, .info-icon-small').forEach(icon => {
    icon.addEventListener('click', (e) => {
        e.stopPropagation();
        // In a real app, this would show a tooltip or modal with more information
        alert('More information about this option would appear here.');
    });
});

// ===== INITIALIZATION =====

// Load state from URL parameters
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('redistribution')) {
    appState.redistributionPercent = parseInt(urlParams.get('redistribution'));
    slider.value = appState.redistributionPercent;
    sliderValue.textContent = appState.redistributionPercent + '%';
}
if (urlParams.has('measure')) {
    appState.compensationMeasure = urlParams.get('measure');
    compensationCards.forEach(card => {
        if (card.dataset.measure === appState.compensationMeasure) {
            compensationCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        }
    });
}

// Initial chart render
updateChart();

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateChart, 250);
});

// Add smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

console.log('Carbon Pricing Incidence Calculator initialized');
console.log('Current state:', appState);
