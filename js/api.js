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
        // 메인 API 시도
        const response = await fetchWithTimeout(CONFIG.API.GOLD_API_URL);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // API 응답 구조에 맞게 조정
        // metals.live API는 다음과 같은 구조를 반환합니다:
        // [{ timestamp, price, ... }]

        const priceData = Array.isArray(data) ? data[0] : data;

        apiState.isConnected = true;
        apiState.consecutiveErrors = 0;
        apiState.lastError = null;

        return {
            price: priceData.price || generateMockPrice(),
            timestamp: priceData.timestamp || Date.now(),
            change24h: priceData.change24h || 0,
            high24h: priceData.high24h || priceData.price * 1.02,
            low24h: priceData.low24h || priceData.price * 0.98,
            volume: priceData.volume || 0,
        };

    } catch (error) {
        console.error('Primary API failed:', error);

        // 백업 API 시도
        try {
            return await fetchGoldPriceBackup();
        } catch (backupError) {
            console.error('Backup API also failed:', backupError);

            apiState.consecutiveErrors++;
            apiState.lastError = getUserFriendlyError(backupError);

            // 연속 에러 5회 이상이면 연결 끊김 표시
            if (apiState.consecutiveErrors >= 5) {
                apiState.isConnected = false;
            }

            // 모의 데이터 반환 (개발/테스트용)
            return getMockGoldData();
        }
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
    const basePrice = 2050; // 2025년 예상 금값 기준
    const price = generateMockPrice(basePrice);

    return {
        price: price,
        timestamp: Date.now(),
        change24h: (Math.random() - 0.5) * 4, // -2% ~ +2%
        high24h: price * (1 + Math.random() * 0.02),
        low24h: price * (1 - Math.random() * 0.02),
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
function generateMockPrice(basePrice = 2050) {
    // 시간에 따라 변하는 가격 생성
    const time = Date.now() / 1000;
    const wave1 = Math.sin(time / 100) * 20;
    const wave2 = Math.sin(time / 50) * 10;
    const noise = (Math.random() - 0.5) * 5;

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
export async function fetchHistoricalData(period = '1h', points = 60) {
    // 실제 과거 데이터 API가 없으므로 모의 데이터 생성
    const intervals = {
        '1h': 60 * 1000,      // 1분
        '4h': 5 * 60 * 1000,  // 5분
        '1d': 15 * 60 * 1000, // 15분
        '1w': 60 * 60 * 1000, // 1시간
    };

    const interval = intervals[period] || intervals['1h'];
    const now = Date.now();
    const basePrice = 2050;

    const data = [];

    for (let i = points - 1; i >= 0; i--) {
        const timestamp = now - (i * interval);
        const time = timestamp / 1000;

        // 시간에 따라 변하는 가격 생성 (일관성 있는 추세)
        const trend = Math.sin(time / 1000) * 30;
        const wave = Math.sin(time / 100) * 10;
        const noise = (Math.random() - 0.5) * 3;
        const price = basePrice + trend + wave + noise;

        data.push({
            timestamp,
            price: Math.round(price * 100) / 100,
        });
    }

    return data;
}

export default {
    fetchGoldPrice,
    getApiStatus,
    resetApiStatus,
    fetchHistoricalData,
};
