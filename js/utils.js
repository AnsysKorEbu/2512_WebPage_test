/**
 * Utility Functions Module
 * 
 * Purpose: 재사용 가능한 유틸리티 함수 모음
 */

/**
 * 숫자를 통화 형식으로 포맷팅
 * 
 * Input: number (숫자), currency (통화 코드, 기본값: 'USD'), decimals (소수점 자릿수, 기본값: 2)
 * Output: string (포맷된 통화 문자열)
 * 
 * @param {number} number - 포맷할 숫자
 * @param {string} currency - 통화 코드
 * @param {number} decimals - 소수점 자릿수
 * @returns {string} 포맷된 문자열
 */
export function formatCurrency(number, currency = 'USD', decimals = 2) {
    if (typeof number !== 'number' || isNaN(number)) {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(number);
}

/**
 * 큰 숫자를 컴팩트 형식으로 포맷팅 (K, M, B 등)
 * 
 * Input: number (숫자)
 * Output: string (포맷된 문자열)
 * 
 * @param {number} number - 포맷할 숫자
 * @returns {string} 포맷된 문자열
 */
export function formatCompactNumber(number) {
    if (typeof number !== 'number' || isNaN(number)) {
        return '-';
    }

    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(number);
}

/**
 * 날짜/시간을 특정 형식으로 포맷팅
 * 
 * Input: date (Date 객체 또는 타임스탬프), format (포맷 타입)
 * Output: string (포맷된 날짜 문자열)
 * 
 * @param {Date|number} date - 포맷할 날짜
 * @param {string} format - 'time', 'date', 'datetime' 중 하나
 * @returns {string} 포맷된 문자열
 */
export function formatDateTime(date, format = 'datetime') {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    if (isNaN(date.getTime())) {
        return '-';
    }

    const options = {
        'time': { hour: '2-digit', minute: '2-digit', second: '2-digit' },
        'date': { year: 'numeric', month: '2-digit', day: '2-digit' },
        'datetime': {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        },
    };

    return new Intl.DateTimeFormat('ko-KR', options[format]).format(date);
}

/**
 * 퍼센트 변화를 계산하고 포맷팅
 * 
 * Input: oldValue (이전 값), newValue (새 값)
 * Output: object { value: number, formatted: string, isPositive: boolean }
 * 
 * @param {number} oldValue - 이전 값
 * @param {number} newValue - 새 값
 * @returns {object} 변화율 정보
 */
export function calculatePercentChange(oldValue, newValue) {
    if (typeof oldValue !== 'number' || typeof newValue !== 'number' ||
        isNaN(oldValue) || isNaN(newValue) || oldValue === 0) {
        return { value: 0, formatted: '0.00%', isPositive: true };
    }

    const change = ((newValue - oldValue) / oldValue) * 100;
    const isPositive = change >= 0;
    const formatted = `${isPositive ? '+' : ''}${change.toFixed(2)}%`;

    return { value: change, formatted, isPositive };
}

/**
 * 디바운스 함수 (연속 호출 방지)
 * 
 * Input: func (실행할 함수), delay (지연 시간, 밀리초)
 * Output: function (디바운스된 함수)
 * 
 * @param {Function} func - 디바운스할 함수
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 쓰로틀 함수 (일정 간격으로만 실행)
 * 
 * Input: func (실행할 함수), limit (제한 시간, 밀리초)
 * Output: function (쓰로틀된 함수)
 * 
 * @param {Function} func - 쓰로틀할 함수
 * @param {number} limit - 제한 시간 (밀리초)
 * @returns {Function} 쓰로틀된 함수
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 로컬 스토리지에 데이터 저장
 * 
 * Input: key (키), value (값)
 * Output: boolean (성공 여부)
 * 
 * @param {string} key - 저장소 키
 * @param {*} value - 저장할 값
 * @returns {boolean} 성공 여부
 */
export function setStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Storage set error:', error);
        return false;
    }
}

/**
 * 로컬 스토리지에서 데이터 가져오기
 * 
 * Input: key (키), defaultValue (기본값)
 * Output: any (저장된 값 또는 기본값)
 * 
 * @param {string} key - 저장소 키
 * @param {*} defaultValue - 기본값
 * @returns {*} 저장된 값 또는 기본값
 */
export function getStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Storage get error:', error);
        return defaultValue;
    }
}

/**
 * 로컬 스토리지에서 데이터 삭제
 * 
 * Input: key (키)
 * Output: boolean (성공 여부)
 * 
 * @param {string} key - 저장소 키
 * @returns {boolean} 성공 여부
 */
export function removeStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Storage remove error:', error);
        return false;
    }
}

/**
 * 에러 메시지를 사용자 친화적으로 변환
 * 
 * Input: error (Error 객체 또는 문자열)
 * Output: string (사용자 친화적 에러 메시지)
 * 
 * @param {Error|string} error - 에러 객체 또는 메시지
 * @returns {string} 사용자 친화적 메시지
 */
export function getUserFriendlyError(error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    const errorMap = {
        'Failed to fetch': '네트워크 연결을 확인해주세요.',
        'NetworkError': '네트워크 오류가 발생했습니다.',
        'timeout': '요청 시간이 초과되었습니다.',
        'Not Found': '데이터를 찾을 수 없습니다.',
    };

    for (const [key, message] of Object.entries(errorMap)) {
        if (errorMessage.includes(key)) {
            return message;
        }
    }

    return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

/**
 * 객체가 비어있는지 확인
 * 
 * Input: obj (객체)
 * Output: boolean (비어있으면 true)
 * 
 * @param {object} obj - 확인할 객체
 * @returns {boolean} 비어있는지 여부
 */
export function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * 딥 클론 (깊은 복사)
 * 
 * Input: obj (복사할 객체)
 * Output: object (복사된 객체)
 * 
 * @param {*} obj - 복사할 객체
 * @returns {*} 복사된 객체
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * 카운트다운 타이머 포맷팅
 * 
 * Input: seconds (초)
 * Output: string (MM:SS 형식)
 * 
 * @param {number} seconds - 초
 * @returns {string} 포맷된 시간
 */
export function formatCountdown(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
        return '00:00';
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default {
    formatCurrency,
    formatCompactNumber,
    formatDateTime,
    calculatePercentChange,
    debounce,
    throttle,
    setStorage,
    getStorage,
    removeStorage,
    getUserFriendlyError,
    isEmptyObject,
    deepClone,
    formatCountdown,
};
