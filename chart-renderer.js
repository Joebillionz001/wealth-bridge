/**
 * CHART & DATA VISUALIZATION
 * Canvas-based charts for portfolio, assets, prices, etc.
 */

export class ChartRenderer {
    /**
     * INITIALIZE CANVAS CHARTS
     */
    static initCharts() {
        this.initPortfolioChart();
        this.initAssetAllocationChart();
        this.initPriceHistoryChart();
        this.initPerformanceChart();
    }

    /**
     * PORTFOLIO PERFORMANCE CHART (Line Chart)
     */
    static initPortfolioChart() {
        const canvas = document.querySelector('[data-chart="portfolio"]');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Sample data - replace with real data
        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Portfolio Value',
                data: [15000, 15500, 16200, 15800, 17500, 18200],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.3,
                fill: true,
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#4CAF50'
            }]
        };

        this.drawLineChart(ctx, data, canvas.width, canvas.height);
    }

    /**
     * ASSET ALLOCATION CHART (Pie Chart)
     */
    static initAssetAllocationChart() {
        const canvas = document.querySelector('[data-chart="assets"]');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const data = {
            labels: ['Bitcoin', 'Ethereum', 'Stocks', 'Bonds', 'Cash'],
            datasets: [{
                data: [35, 25, 20, 15, 5],
                backgroundColor: [
                    '#FF6B6B',
                    '#4ECDC4',
                    '#45B7D1',
                    '#FFA07A',
                    '#98D8C8'
                ]
            }]
        };

        this.drawPieChart(ctx, data, canvas.width, canvas.height);
    }

    /**
     * PRICE HISTORY CHART (Candlestick/Bar)
     */
    static initPriceHistoryChart() {
        const canvas = document.querySelector('[data-chart="price-history"]');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const data = {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
            datasets: [{
                label: 'BTC Price',
                data: [42000, 43500, 42800, 44200, 43900, 45100, 46000],
                borderColor: '#FF6B6B',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 2
            }]
        };

        this.drawLineChart(ctx, data, canvas.width, canvas.height);
    }

    /**
     * PERFORMANCE COMPARISON CHART (Bar Chart)
     */
    static initPerformanceChart() {
        const canvas = document.querySelector('[data-chart="performance"]');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const data = {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                label: 'Your Returns (%)',
                data: [8.5, 12.3, 9.7, 15.2],
                backgroundColor: '#4CAF50'
            }, {
                label: 'Market Avg (%)',
                data: [5.2, 7.8, 6.3, 9.1],
                backgroundColor: '#BDBDBD'
            }]
        };

        this.drawBarChart(ctx, data, canvas.width, canvas.height);
    }

    /**
     * SIMPLE LINE CHART
     */
    static drawLineChart(ctx, data, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Draw grid
        this.drawGrid(ctx, width, height, padding);

        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.lineTo(width - padding, padding);
        ctx.stroke();

        // Find min and max values
        const allValues = data.datasets[0].data;
        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues);
        const range = maxVal - minVal;

        // Draw lines and points
        data.datasets.forEach((dataset, idx) => {
            ctx.strokeStyle = dataset.borderColor;
            ctx.fillStyle = dataset.backgroundColor;
            ctx.lineWidth = dataset.borderWidth || 2;

            // Draw background fill
            if (dataset.fill) {
                ctx.fillStyle = dataset.backgroundColor;
                ctx.beginPath();
                ctx.moveTo(padding, height - padding);
                
                dataset.data.forEach((value, i) => {
                    const x = padding + (i / (dataset.data.length - 1)) * chartWidth;
                    const y = height - padding - ((value - minVal) / range) * chartHeight;
                    ctx.lineTo(x, y);
                });
                
                ctx.lineTo(width - padding, height - padding);
                ctx.closePath();
                ctx.fill();
            }

            // Draw line
            ctx.strokeStyle = dataset.borderColor;
            ctx.beginPath();
            dataset.data.forEach((value, i) => {
                const x = padding + (i / (dataset.data.length - 1)) * chartWidth;
                const y = height - padding - ((value - minVal) / range) * chartHeight;
                ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Draw points
            ctx.fillStyle = dataset.pointBackgroundColor || dataset.borderColor;
            dataset.data.forEach((value, i) => {
                const x = padding + (i / (dataset.data.length - 1)) * chartWidth;
                const y = height - padding - ((value - minVal) / range) * chartHeight;
                ctx.beginPath();
                ctx.arc(x, y, dataset.pointRadius || 3, 0, Math.PI * 2);
                ctx.fill();
            });
        });

        // Draw labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        data.labels.forEach((label, i) => {
            const x = padding + (i / (data.labels.length - 1)) * chartWidth;
            ctx.fillText(label, x, height - padding + 20);
        });
    }

    /**
     * SIMPLE PIE CHART
     */
    static drawPieChart(ctx, data, width, height) {
        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;

        const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
        let currentAngle = -Math.PI / 2;

        data.datasets[0].data.forEach((value, i) => {
            const sliceAngle = (value / total) * Math.PI * 2;

            // Draw slice
            ctx.fillStyle = data.datasets[0].backgroundColor[i];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            // Draw label
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            const percentage = ((value / total) * 100).toFixed(0);
            ctx.fillText(`${percentage}%`, labelX, labelY);

            currentAngle += sliceAngle;
        });

        // Draw legend
        const legendX = width - 150;
        const legendY = 30;
        let currentY = legendY;

        data.labels.forEach((label, i) => {
            ctx.fillStyle = data.datasets[0].backgroundColor[i];
            ctx.fillRect(legendX, currentY - 8, 12, 12);

            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(label, legendX + 20, currentY);

            currentY += 25;
        });
    }

    /**
     * SIMPLE BAR CHART
     */
    static drawBarChart(ctx, data, width, height) {
        ctx.clearRect(0, 0, width, height);

        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Find max value
        const allValues = data.datasets.flatMap(d => d.data);
        const maxVal = Math.max(...allValues);

        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.lineTo(width - padding, padding);
        ctx.stroke();

        // Draw bars
        const barWidth = chartWidth / (data.labels.length * (data.datasets.length + 1));
        const barGap = barWidth / 2;

        data.datasets.forEach((dataset, dsIdx) => {
            ctx.fillStyle = dataset.backgroundColor;

            dataset.data.forEach((value, i) => {
                const x = padding + barGap + (i * (data.datasets.length * barWidth + barGap * 2)) + (dsIdx * barWidth);
                const barHeight = (value / maxVal) * chartHeight;
                const y = height - padding - barHeight;

                ctx.fillRect(x, y, barWidth - 2, barHeight);

                // Draw value label on bar
                ctx.fillStyle = '#333';
                ctx.font = '11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(value.toFixed(1), x + barWidth / 2, y - 5);
            });
        });

        // Draw x-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        data.labels.forEach((label, i) => {
            const x = padding + barGap + (i * (data.datasets.length * barWidth + barGap * 2)) + (data.datasets.length * barWidth / 2);
            ctx.fillText(label, x, height - padding + 20);
        });

        // Draw legend
        let legendX = padding;
        const legendY = padding - 20;
        data.datasets.forEach((dataset, i) => {
            ctx.fillStyle = dataset.backgroundColor;
            ctx.fillRect(legendX, legendY - 8, 12, 12);

            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(dataset.label, legendX + 20, legendY);

            legendX += 150;
        });
    }

    /**
     * GRID HELPER
     */
    static drawGrid(ctx, width, height, padding) {
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;

        // Vertical grid
        for (let i = 0; i < 5; i++) {
            const x = padding + (i / 4) * (width - padding * 2);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }

        // Horizontal grid
        for (let i = 0; i < 5; i++) {
            const y = padding + (i / 4) * (height - padding * 2);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
    }

    /**
     * RESPONSIVE CANVAS RESIZE
     */
    static makeResponsive() {
        document.querySelectorAll('[data-chart]').forEach(canvas => {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height || 300;
        });

        window.addEventListener('resize', () => {
            this.initCharts();
        });
    }

    /**
     * INITIALIZE ALL
     */
    static initAll() {
        this.makeResponsive();
        this.initCharts();
    }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChartRenderer.initAll());
} else {
    ChartRenderer.initAll();
}
