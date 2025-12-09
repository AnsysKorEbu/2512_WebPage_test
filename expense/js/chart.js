/**
 * Chart Module
 * Renders category expense chart using Canvas
 */

export class ChartRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.colors = [
            '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
            '#f59e0b', '#10b981', '#06b6d4', '#84cc16'
        ];
    }

    drawPieChart(data) {
        if (!this.ctx || !data || data.length === 0) {
            this.drawEmptyState();
            return;
        }

        const canvas = this.canvas;
        const ctx = this.ctx;

        // Set canvas size
        const size = Math.min(canvas.parentElement.clientWidth, 300);
        canvas.width = size;
        canvas.height = size;

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 20;

        // Calculate total
        const total = data.reduce((sum, item) => sum + item.value, 0);

        if (total === 0) {
            this.drawEmptyState();
            return;
        }

        // Draw pie slices
        let currentAngle = -Math.PI / 2; // Start from top

        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = this.colors[index % this.colors.length];
            ctx.fill();

            // Draw border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            currentAngle += sliceAngle;
        });

        // Draw center circle (donut effect)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }

    drawEmptyState() {
        if (!this.ctx) return;

        const canvas = this.canvas;
        const ctx = this.ctx;

        const size = Math.min(canvas.parentElement.clientWidth, 300);
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '16px Nunito';
        ctx.textAlign = 'center';
        ctx.fillText('데이터 없음', size / 2, size / 2);
    }

    getColorForIndex(index) {
        return this.colors[index % this.colors.length];
    }
}
