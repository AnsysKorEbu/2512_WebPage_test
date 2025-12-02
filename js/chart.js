/**
 * Chart Module
 * 
 * Purpose: Chart.js를 사용한 차트 렌더링 및 관리
 */

import CONFIG from './config.js';
import { formatCurrency, formatDateTime } from './utils.js';

/**
 * 차트 인스턴스 및 상태
 */
let chartInstance = null;
let currentPeriod = '1h';

/**
 * 차트 초기화
 * 
 * Input: canvasId (캔버스 요소 ID), initialData (초기 데이터)
 * Output: Chart (Chart.js 인스턴스)
 * 
 * @param {string} canvasId - 캔버스 요소 ID
 * @param {Array} initialData - 초기 데이터 [{timestamp, price}]
 * @returns {Chart} Chart.js 인스턴스
 */
export function initChart(canvasId, initialData = []) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas element not found: ${canvasId}`);
        return null;
    }

    const ctx = canvas.getContext('2d');

    // 기존 차트가 있으면 제거
    if (chartInstance) {
        chartInstance.destroy();
    }

    // 데이터 준비
    const labels = initialData.map(d => new Date(d.timestamp));
    const prices = initialData.map(d => d.price);

    // 차트 생성
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '금 가격 (USD)',
                data: prices,
                borderColor: CONFIG.CHART.COLORS.line,
                backgroundColor: createGradient(ctx),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: CONFIG.CHART.COLORS.line,
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2,
            }],
        },
        options: getChartOptions(),
    });

    return chartInstance;
}

/**
 * 차트에 사용할 그라디언트 생성
 * 
 * Input: ctx (Canvas 2D Context)
 * Output: CanvasGradient
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @returns {CanvasGradient} 그라디언트
 */
function createGradient(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, CONFIG.CHART.COLORS.gradient.start);
    gradient.addColorStop(1, CONFIG.CHART.COLORS.gradient.end);
    return gradient;
}

/**
 * 차트 옵션 가져오기
 * 
 * Input: N/A
 * Output: object (Chart.js 옵션)
 * 
 * @returns {object} 차트 옵션
 */
function getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index',
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(18, 24, 46, 0.95)',
                titleColor: CONFIG.CHART.COLORS.line,
                bodyColor: '#ffffff',
                borderColor: CONFIG.CHART.COLORS.line,
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    title: function (context) {
                        const date = context[0].parsed.x;
                        return formatDateTime(date, 'datetime');
                    },
                    label: function (context) {
                        return formatCurrency(context.parsed.y);
                    },
                },
            },
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute',
                    displayFormats: {
                        minute: 'HH:mm',
                        hour: 'HH:mm',
                        day: 'MM/dd',
                    },
                    tooltipFormat: 'yyyy-MM-dd HH:mm:ss',
                },
                ticks: {
                    color: CONFIG.CHART.COLORS.text,
                    maxTicksLimit: 8,
                    source: 'auto',
                },
                grid: {
                    color: CONFIG.CHART.COLORS.grid,
                    drawBorder: false,
                },
            },
            y: {
                position: 'right',
                ticks: {
                    color: CONFIG.CHART.COLORS.text,
                    callback: function (value) {
                        return formatCurrency(value, 'USD', 0);
                    },
                },
                grid: {
                    color: CONFIG.CHART.COLORS.grid,
                    drawBorder: false,
                },
            },
        },
        animation: {
            duration: 750,
            easing: 'easeInOutQuart',
        },
    };
}

/**
 * 차트 데이터 업데이트
 * 
 * Input: newData (새 데이터 배열 [{timestamp, price}])
 * Output: void
 * 
 * @param {Array} newData - 새 데이터
 */
export function updateChart(newData) {
    if (!chartInstance || !newData || newData.length === 0) {
        return;
    }

    const labels = newData.map(d => new Date(d.timestamp));
    const prices = newData.map(d => d.price);

    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = prices;

    // 그라디언트 재생성 (캔버스 크기가 변경될 수 있으므로)
    const ctx = chartInstance.ctx;
    chartInstance.data.datasets[0].backgroundColor = createGradient(ctx);

    chartInstance.update('none'); // 애니메이션 없이 업데이트
}

/**
 * 차트에 새 데이터 포인트 추가
 * 
 * Input: timestamp (타임스탬프), price (가격)
 * Output: void
 * 
 * @param {number} timestamp - 타임스탬프
 * @param {number} price - 가격
 */
export function addDataPoint(timestamp, price) {
    if (!chartInstance) {
        return;
    }

    const maxPoints = CONFIG.CHART.MAX_DATA_POINTS[currentPeriod] || 60;

    // 새 데이터 추가
    chartInstance.data.labels.push(new Date(timestamp));
    chartInstance.data.datasets[0].data.push(price);

    // 최대 포인트 수 초과 시 오래된 데이터 제거
    if (chartInstance.data.labels.length > maxPoints) {
        chartInstance.data.labels.shift();
        chartInstance.data.datasets[0].data.shift();
    }

    chartInstance.update();
}

/**
 * 현재 기간 설정
 * 
 * Input: period (기간: '1h', '4h', '1d', '1w')
 * Output: void
 * 
 * @param {string} period - 기간
 */
export function setCurrentPeriod(period) {
    currentPeriod = period;
}

/**
 * 현재 기간 가져오기
 * 
 * Input: N/A
 * Output: string (현재 기간)
 * 
 * @returns {string} 현재 기간
 */
export function getCurrentPeriod() {
    return currentPeriod;
}

/**
 * 차트 인스턴스 가져오기
 * 
 * Input: N/A
 * Output: Chart|null
 * 
 * @returns {Chart|null} 차트 인스턴스
 */
export function getChartInstance() {
    return chartInstance;
}

/**
 * 차트 제거
 * 
 * Input: N/A
 * Output: void
 */
export function destroyChart() {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}

/**
 * 차트 리사이즈 (반응형 대응)
 * 
 * Input: N/A
 * Output: void
 */
export function resizeChart() {
    if (chartInstance) {
        chartInstance.resize();
    }
}

export default {
    initChart,
    updateChart,
    addDataPoint,
    setCurrentPeriod,
    getCurrentPeriod,
    getChartInstance,
    destroyChart,
    resizeChart,
};
