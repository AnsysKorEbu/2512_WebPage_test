/**
 * API Module
 * 
 * Purpose: API 호출 및 데이터 관리
 */

import CONFIG from './config.js';
import { getUserFriendlyError } from './utils.js';

/**
 * API 호출 상태
 */
const apiState = {
    isConnected: false,
    lastError: null,
    consecutiveErrors: 0,
};

/**
 * 타임아웃을 지원하는 fetch 래퍼
 * 
 * Input: url (API URL), options (fetch 옵션), timeout (타임아웃 시간)
 * Output: Promise<Response>
 * 
 * @param {string} url - API URL
 * @param {object} options - fetch 옵션
 * @param {number} timeout - 타임아웃 (밀리초)
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = CONFIG.API.TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

/**
 * 실시간 금값 데이터 가져오기
 * 
 * Input: N/A
 * Output: Promise<object> { price, timestamp, change24h, high24h, low24h, volume }
 * 
 * @returns {Promise<object>} 금값 데이터
 */
export async function fetchGoldPrice() {
    try {
        // API 호출
        const response = await fetchWithTimeout(CONFIG.API.GOLD_API_URL);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // 데이터 유효성 검사
        if (!data.price) {
            throw new Error('Invalid data format');
        }

        apiState.isConnected = true;
        apiState.consecutiveErrors = 0;
        apiState.lastError = null;

        // 1g당 가격으로 변환
        const GRAMS_PER_OUNCE = 31.1034768;
        const pricePerGram = data.price / GRAMS_PER_OUNCE;

        return {
            price: pricePerGram,
            timestamp: new Date(data.updatedAt).getTime() || Date.now(),
            change24h: data.chp || 0, // API가 제공하는 경우 사용, 없으면 0
            high24h: (data.price_gram_24k || pricePerGram) * 1.01, // 추정치
            low24h: (data.price_gram_24k || pricePerGram) * 0.99, // 추정치
            volume: 0, // API에서 제공하지 않음
        };

    } catch (error) {
        console.error('Error in fetchGoldPrice:', error);
        apiState.consecutiveErrors++;
        apiState.lastError = getUserFriendlyError(error);

        if (apiState.consecutiveErrors >= 5) {
            apiState.isConnected = false;
        }

        return getMockGoldData();
    }
}

/**
 * 백업 API로 금값 가져오기
 * 
 * Input: N/A
 * Output: Promise<object>
 * 
 * @returns {Promise<object>} 금값 데이터
 */
async function fetchGoldPriceBackup() {
    const response = await fetchWithTimeout(CONFIG.API.BACKUP_API_URL);

    if (!response.ok) {
        throw new Error(`Backup API error: ${response.status}`);
    }

    const data = await response.json();
    const paxGold = data['pax-gold'];

    apiState.isConnected = true;
    apiState.consecutiveErrors = 0;
    apiState.lastError = null;

    return {
        price: paxGold.usd,
        timestamp: Date.now(),
        change24h: paxGold.usd_24h_change || 0,
        high24h: paxGold.usd * 1.02,
        low24h: paxGold.usd * 0.98,
        volume: paxGold.usd_24h_vol || 0,
    };
}

/**
 * 모의 금값 데이터 생성 (개발/테스트용)
 * 
 * Input: N/A
 * Output: object
 * 
 * @returns {object} 모의 금값 데이터
 */
function getMockGoldData() {
    const GRAMS_PER_OUNCE = 31.1034768;
    const basePriceOz = 4217; // 2025년 12월 기준 예상 금값 (oz)
    const basePrice = basePriceOz / GRAMS_PER_OUNCE;

    const price = generateMockPrice(basePrice);

    return {
        price: price,
        timestamp: Date.now(),
        change24h: (Math.random() - 0.5) * 2, // -1% ~ +1%
        high24h: price * (1 + Math.random() * 0.01),
        low24h: price * (1 - Math.random() * 0.01),
        volume: Math.random() * 1000000,
    };
}

/**
 * 실시간 느낌의 모의 가격 생성
 * 
 * Input: basePrice (기준 가격)
 * Output: number (생성된 가격)
 * 
 * @param {number} basePrice - 기준 가격
 * @returns {number} 생성된 가격
 */
function generateMockPrice(basePrice) {
    // 시간에 따라 변하는 가격 생성
    const time = Date.now() / 1000;
    const wave1 = Math.sin(time / 100) * 10;
    const wave2 = Math.sin(time / 50) * 5;
    const noise = (Math.random() - 0.5) * 2;

    return basePrice + wave1 + wave2 + noise;
}

/**
 * API 연결 상태 가져오기
 * 
 * Input: N/A
 * Output: object { isConnected, lastError, consecutiveErrors }
 * 
 * @returns {object} API 상태
 */
export function getApiStatus() {
    return { ...apiState };
}

/**
 * API 상태 초기화
 * 
 * Input: N/A
 * Output: void
 */
export function resetApiStatus() {
    apiState.isConnected = false;
    apiState.lastError = null;
    apiState.consecutiveErrors = 0;
}

/**
 * 과거 금값 데이터 가져오기 (시뮬레이션)
 * 실제 API가 과거 데이터를 제공하지 않는 경우 모의 데이터 생성
 * 
 * Input: period (기간: '1h', '4h', '1d', '1w'), points (데이터 포인트 수)
 * Output: Array<{timestamp, price}>
 * 
 * @param {string} period - 기간
 * @param {number} points - 데이터 포인트 수
 * @returns {Array} 과거 가격 데이터
 */
export async function fetchHistoricalData(period = '1h', points = 60, currentPrice = null) {
    // 실제 과거 데이터 API가 없으므로 모의 데이터 생성
    const intervals = {
        '1h': 60 * 1000,      // 1분
        '4h': 5 * 60 * 1000,  // 5분
        '1d': 15 * 60 * 1000, // 15분
        '1w': 60 * 60 * 1000, // 1시간
    };

    const interval = intervals[period] || intervals['1h'];
    const now = Date.now();

    // 현재 가격이 없으면 기본값 사용
    let basePrice;
    if (currentPrice) {
        basePrice = currentPrice;
    } else {
        const GRAMS_PER_OUNCE = 31.1034768;
        basePrice = 4217 / GRAMS_PER_OUNCE;
    }

    const data = [];
    let lastPrice = basePrice;

    // 현재 시점부터 과거로 역산하여 데이터 생성 (Random Walk)
    // i=0일 때(현재)는 basePrice를 그대로 사용하고, 과거로 갈수록 변동을 적용

    // 가장 최신 데이터 (현재)
    data.unshift({
        timestamp: now,
        price: basePrice
    });

    // 과거 데이터 생성 (1부터 시작)
    for (let i = 1; i < points; i++) {
        const timestamp = now - (i * interval);

        // 변동성 설정
        let volatility = 0.0005;
        if (period === '1d' || period === '1w') {
            volatility = 0.002;
        }

        // lastPrice(미래 시점)에서 역산하여 과거 가격 추정
        // price_future = price_past + change
        // price_past = price_future - change
        const change = lastPrice * volatility * (Math.random() - 0.5);
        let price = lastPrice - change;

        // 노이즈 추가
        price += (Math.random() - 0.5) * (basePrice * 0.0002);

        data.unshift({
            timestamp,
            price: Math.max(0, price),
        });

        lastPrice = price;
    }

    return data;
}

export default {
    fetchGoldPrice,
    getApiStatus,
    resetApiStatus,
    fetchHistoricalData,
};
