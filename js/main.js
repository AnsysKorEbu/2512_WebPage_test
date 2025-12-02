/**
 * Main Application Module
 * 
 * Purpose: 애플리케이션 메인 로직 및 UI 컨트롤러
 */

import CONFIG from './config.js';
import * as api from './api.js';
import * as chartModule from './chart.js';
import * as utils from './utils.js';

/**
 * 애플리케이션 상태
 */
const appState = {
    currentPrice: null,
    previousPrice: null,
    updateInterval: null,
    countdownInterval: null,
    nextUpdateTime: null,
};

/**
 * DOM 요소 참조
 */
const elements = {
    currentPrice: null,
    priceChange: null,
    lastUpdate: null,
    highPrice: null,
    lowPrice: null,
    volume: null,
    connectionStatus: null,
    nextUpdate: null,
    refreshBtn: null,
    timeBtns: null,
};

/**
 * 애플리케이션 초기화
 * 
 * Input: N/A
 * Output: Promise<void>
 */
async function init() {
    console.log('🚀 Gold Price Tracker 초기화 시작...');

    // DOM 요소 가져오기
    initElements();

    // 이벤트 리스너 설정
    setupEventListeners();

    // 초기 데이터 로드
    await loadInitialData();

    // 정기 업데이트 시작
    startAutoUpdate();

    // 카운트다운 시작
    startCountdown();

    console.log('✅ Gold Price Tracker 초기화 완료!');
}

/**
 * DOM 요소 초기화
 * 
 * Input: N/A
 * Output: void
 */
function initElements() {
    elements.currentPrice = document.getElementById('currentPrice');
    elements.priceChange = document.getElementById('priceChange');
    elements.lastUpdate = document.getElementById('lastUpdate');
    elements.highPrice = document.getElementById('highPrice');
    elements.lowPrice = document.getElementById('lowPrice');
    elements.volume = document.getElementById('volume');
    elements.connectionStatus = document.getElementById('connectionStatus');
    elements.nextUpdate = document.getElementById('nextUpdate');
    elements.refreshBtn = document.getElementById('refreshBtn');
    elements.timeBtns = document.querySelectorAll('.time-btn');
}

/**
 * 이벤트 리스너 설정
 * 
 * Input: N/A
 * Output: void
 */
function setupEventListeners() {
    // 새로고침 버튼
    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', handleRefresh);
    }

    // 시간 범위 버튼
    if (elements.timeBtns) {
        elements.timeBtns.forEach(btn => {
            btn.addEventListener('click', handlePeriodChange);
        });
    }

    // 윈도우 리사이즈
    window.addEventListener('resize', utils.debounce(() => {
        chartModule.resizeChart();
    }, 250));
}

/**
 * 초기 데이터 로드
 * 
 * Input: N/A
 * Output: Promise<void>
 */
async function loadInitialData() {
    try {
        updateConnectionStatus('연결 중...', 'connecting');

        // 현재 가격 가져오기
        const priceData = await api.fetchGoldPrice();
        appState.currentPrice = priceData.price;
        appState.previousPrice = priceData.price;

        // UI 업데이트
        updatePriceDisplay(priceData);

        // 과거 데이터 가져오기 및 차트 초기화
        const period = chartModule.getCurrentPeriod();
        const points = CONFIG.CHART.MAX_DATA_POINTS[period] || 60;
        const historicalData = await api.fetchHistoricalData(period, points);

        chartModule.initChart('goldChart', historicalData);

        updateConnectionStatus('연결됨', 'connected');

    } catch (error) {
        console.error('초기 데이터 로드 실패:', error);
        updateConnectionStatus('연결 실패', 'disconnected');

        // 에러 상태에서도 모의 데이터로 차트 표시
        const mockData = generateMockHistoricalData();
        chartModule.initChart('goldChart', mockData);
    }
}

/**
 * 가격 표시 업데이트
 * 
 * Input: priceData (가격 데이터 객체)
 * Output: void
 * 
 * @param {object} priceData - 가격 데이터
 */
function updatePriceDisplay(priceData) {
    // 현재 가격
    if (elements.currentPrice) {
        elements.currentPrice.textContent = utils.formatCurrency(priceData.price);
    }

    // 가격 변화
    if (elements.priceChange && appState.previousPrice) {
        const change = utils.calculatePercentChange(appState.previousPrice, priceData.price);
        elements.priceChange.textContent = change.formatted;
        elements.priceChange.className = `price-badge ${change.isPositive ? '' : 'negative'}`;
    }

    // 최종 업데이트 시간
    if (elements.lastUpdate) {
        elements.lastUpdate.textContent = `업데이트: ${utils.formatDateTime(priceData.timestamp, 'time')}`;
    }

    // 24시간 고가
    if (elements.highPrice) {
        elements.highPrice.textContent = utils.formatCurrency(priceData.high24h);
    }

    // 24시간 저가
    if (elements.lowPrice) {
        elements.lowPrice.textContent = utils.formatCurrency(priceData.low24h);
    }

    // 거래량
    if (elements.volume) {
        elements.volume.textContent = utils.formatCompactNumber(priceData.volume);
    }

    // 이전 가격 업데이트
    appState.previousPrice = priceData.price;
}

/**
 * 자동 업데이트 시작
 * 
 * Input: N/A
 * Output: void
 */
function startAutoUpdate() {
    // 기존 인터벌 제거
    if (appState.updateInterval) {
        clearInterval(appState.updateInterval);
    }

    // 새 인터벌 설정
    appState.updateInterval = setInterval(async () => {
        await updateData();
    }, CONFIG.API.UPDATE_INTERVAL);

    // 다음 업데이트 시간 설정
    appState.nextUpdateTime = Date.now() + CONFIG.API.UPDATE_INTERVAL;
}

/**
 * 카운트다운 시작
 * 
 * Input: N/A
 * Output: void
 */
function startCountdown() {
    if (appState.countdownInterval) {
        clearInterval(appState.countdownInterval);
    }

    appState.countdownInterval = setInterval(() => {
        if (!appState.nextUpdateTime) return;

        const remaining = Math.max(0, Math.floor((appState.nextUpdateTime - Date.now()) / 1000));

        if (elements.nextUpdate) {
            elements.nextUpdate.textContent = utils.formatCountdown(remaining);
        }
    }, CONFIG.UI.COUNTDOWN_INTERVAL);
}

/**
 * 데이터 업데이트
 * 
 * Input: N/A
 * Output: Promise<void>
 */
async function updateData() {
    try {
        const priceData = await api.fetchGoldPrice();

        // UI 업데이트
        updatePriceDisplay(priceData);

        // 차트에 새 데이터 포인트 추가
        chartModule.addDataPoint(priceData.timestamp, priceData.price);

        updateConnectionStatus('연결됨', 'connected');

        // 다음 업데이트 시간 갱신
        appState.nextUpdateTime = Date.now() + CONFIG.API.UPDATE_INTERVAL;

    } catch (error) {
        console.error('데이터 업데이트 실패:', error);
        updateConnectionStatus('연결 오류', 'disconnected');
    }
}

/**
 * 새로고침 핸들러
 * 
 * Input: Event
 * Output: Promise<void>
 * 
 * @param {Event} event - 클릭 이벤트
 */
async function handleRefresh(event) {
    event.preventDefault();

    // 버튼 애니메이션
    const btn = event.currentTarget;
    btn.disabled = true;

    try {
        await updateData();
    } finally {
        setTimeout(() => {
            btn.disabled = false;
        }, 1000);
    }
}

/**
 * 기간 변경 핸들러
 * 
 * Input: Event
 * Output: Promise<void>
 * 
 * @param {Event} event - 클릭 이벤트
 */
async function handlePeriodChange(event) {
    const btn = event.currentTarget;
    const period = btn.dataset.period;

    if (!period) return;

    // 버튼 활성 상태 변경
    elements.timeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 기간 업데이트
    chartModule.setCurrentPeriod(period);

    try {
        // 해당 기간의 과거 데이터 가져오기
        const points = CONFIG.CHART.MAX_DATA_POINTS[period] || 60;
        const historicalData = await api.fetchHistoricalData(period, points);

        // 차트 업데이트
        chartModule.updateChart(historicalData);

    } catch (error) {
        console.error('기간 변경 실패:', error);
    }
}

/**
 * 연결 상태 업데이트
 * 
 * Input: message (메시지), status (상태: 'connected', 'connecting', 'disconnected')
 * Output: void
 * 
 * @param {string} message - 상태 메시지
 * @param {string} status - 상태
 */
function updateConnectionStatus(message, status) {
    if (!elements.connectionStatus) return;

    const dot = elements.connectionStatus.querySelector('.status-dot');
    const text = elements.connectionStatus.querySelector('.status-text');

    if (text) {
        text.textContent = message;
    }

    if (dot) {
        dot.className = 'status-dot';
        if (status === 'disconnected') {
            dot.classList.add('disconnected');
        }
    }
}

/**
 * 모의 과거 데이터 생성 (에러 시 백업용)
 * 
 * Input: N/A
 * Output: Array<{timestamp, price}>
 * 
 * @returns {Array} 모의 과거 데이터
 */
function generateMockHistoricalData() {
    const data = [];
    const now = Date.now();
    const basePrice = 2050;

    for (let i = 59; i >= 0; i--) {
        const timestamp = now - (i * 60 * 1000);
        const price = basePrice + (Math.random() - 0.5) * 50;
        data.push({ timestamp, price });
    }

    return data;
}

/**
 * 애플리케이션 종료 (클린업)
 * 
 * Input: N/A
 * Output: void
 */
function cleanup() {
    if (appState.updateInterval) {
        clearInterval(appState.updateInterval);
    }

    if (appState.countdownInterval) {
        clearInterval(appState.countdownInterval);
    }

    chartModule.destroyChart();
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 페이지 언로드 시 클린업
window.addEventListener('beforeunload', cleanup);

// 개발용: 전역 접근
if (CONFIG.DEBUG) {
    window.goldApp = {
        appState,
        api,
        chartModule,
        utils,
        updateData,
        cleanup,
    };
}

export default {
    init,
    cleanup,
    updateData,
};
