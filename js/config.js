/**
 * Configuration Module
 * 
 * Purpose: 중앙화된 설정 관리
 * Input: N/A
 * Output: CONFIG 객체
 */

export const CONFIG = {
    // API 설정
    API: {
        // Gold API - 무료 실시간 금값 API (CORS 지원)
        GOLD_API_URL: 'https://api.gold-api.com/price/XAU',
        // 백업 API (CoinGecko의 금 관련 토큰)
        BACKUP_API_URL: 'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true',
        // 업데이트 간격 (밀리초)
        UPDATE_INTERVAL: 30000, // 30초
        // 요청 타임아웃 (밀리초)
        TIMEOUT: 10000, // 10초
    },

    // 차트 설정
    CHART: {
        // 차트 업데이트 간격 (밀리초)
        UPDATE_INTERVAL: 30000, // 30초
        // 최대 데이터 포인트 수
        MAX_DATA_POINTS: {
            '1h': 60,   // 1분 간격
            '4h': 48,   // 5분 간격
            '1d': 96,   // 15분 간격
            '1w': 168,  // 1시간 간격
        },
        // 차트 색상
        COLORS: {
            line: '#ffd700',
            gradient: {
                start: 'rgba(255, 215, 0, 0.4)',
                end: 'rgba(255, 215, 0, 0.0)',
            },
            grid: 'rgba(255, 255, 255, 0.1)',
            text: '#a0aec0',
        },
    },

    // UI 설정
    UI: {
        // 가격 변화 표시 지속 시간 (밀리초)
        PRICE_CHANGE_DURATION: 2000,
        // 애니메이션 지속 시간 (밀리초)
        ANIMATION_DURATION: 300,
        // 카운트다운 업데이트 간격 (밀리초)
        COUNTDOWN_INTERVAL: 1000, // 1초
    },

    // 로컬 스토리지 키
    STORAGE: {
        CHART_PERIOD: 'goldChart_selectedPeriod',
        PRICE_HISTORY: 'goldChart_priceHistory',
    },

    // 디버그 모드
    DEBUG: false,
};

/**
 * 설정값 가져오기
 * 
 * @param {string} path - 설정 경로 (예: 'API.UPDATE_INTERVAL')
 * @returns {*} 설정값
 */
export function getConfig(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], CONFIG);
}

/**
 * 설정값 업데이트
 * 
 * @param {string} path - 설정 경로
 * @param {*} value - 새로운 값
 */
export function updateConfig(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key], CONFIG);
    target[lastKey] = value;
}

export default CONFIG;
