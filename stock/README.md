# 🏆 Gold Price Tracker

실시간 금값 차트를 보여주는 웹 애플리케이션입니다. 향후 다양한 기능을 테스트하고 확장할 수 있도록 모듈화된 구조로 설계되었습니다.

## ✨ 주요 기능

- 📊 **실시간 금값 차트**: Chart.js 기반 인터랙티브 차트
- 💰 **다양한 시세 정보**: 현재가, 고가, 저가, 거래량
- ⏱️ **자동 업데이트**: 30초마다 자동으로 데이터 갱신
- 📱 **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- 🎨 **프리미엄 UI**: 다크 테마 + 골드 악센트

## 🗂️ 프로젝트 구조

```
2512_WebPage_test/
├── index.html          # 메인 HTML 파일
├── css/
│   └── style.css       # 스타일시트
├── js/
│   ├── config.js       # 설정 관리
│   ├── utils.js        # 유틸리티 함수
│   ├── api.js          # API 호출 및 데이터 관리
│   ├── chart.js        # 차트 렌더링
│   └── main.js         # 메인 애플리케이션 로직
└── README.md           # 프로젝트 문서
```

## 🚀 시작하기

### 1. 로컬에서 실행

```bash
# 저장소 클론
git clone https://github.com/AnsysKorEbu/2512_WebPage_test.git
cd 2512_WebPage_test

# 웹 서버 실행 (Python 사용 예시)
python -m http.server 8000

# 브라우저에서 접속
# http://localhost:8000
```

### 2. Live Server 사용 (VSCode)

1. VSCode에서 프로젝트 폴더 열기
2. Live Server 확장 프로그램 설치
3. `index.html` 우클릭 → "Open with Live Server"

## 📚 모듈 설명

### config.js
- **목적**: 중앙화된 설정 관리
- **주요 기능**:
  - API 엔드포인트 및 업데이트 간격 설정
  - 차트 설정 (색상, 최대 데이터 포인트 등)
  - UI 설정 (애니메이션 시간 등)

### utils.js
- **목적**: 재사용 가능한 헬퍼 함수
- **주요 함수**:
  - `formatCurrency()`: 통화 포맷팅
  - `formatDateTime()`: 날짜/시간 포맷팅
  - `calculatePercentChange()`: 퍼센트 변화 계산
  - `debounce()` / `throttle()`: 함수 실행 제어
  - `setStorage()` / `getStorage()`: 로컬 스토리지 관리

### api.js
- **목적**: API 호출 및 데이터 관리
- **주요 함수**:
  - `fetchGoldPrice()`: 실시간 금값 가져오기
  - `fetchHistoricalData()`: 과거 데이터 가져오기
  - `getApiStatus()`: API 연결 상태 확인
- **특징**:
  - 타임아웃 처리
  - 백업 API 자동 전환
  - 에러 발생 시 모의 데이터 제공

### chart.js
- **목적**: Chart.js 기반 차트 관리
- **주요 함수**:
  - `initChart()`: 차트 초기화
  - `updateChart()`: 차트 데이터 업데이트
  - `addDataPoint()`: 새 데이터 포인트 추가
  - `setCurrentPeriod()`: 시간 범위 변경
- **특징**:
  - 반응형 차트
  - 커스텀 툴팁
  - 그라디언트 효과

### main.js
- **목적**: 애플리케이션 메인 로직
- **주요 함수**:
  - `init()`: 앱 초기화
  - `updateData()`: 데이터 갱신
  - `handleRefresh()`: 수동 새로고침
  - `handlePeriodChange()`: 시간 범위 변경
- **특징**:
  - 자동 업데이트
  - 이벤트 핸들링
  - 상태 관리

## 🔧 확장 가능성

이 프로젝트는 확장성을 고려하여 설계되었습니다. 다음과 같은 기능을 쉽게 추가할 수 있습니다:

### 새로운 기능 추가 예시

1. **새로운 차트 타입 추가**
   - `chart.js`에 새 차트 생성 함수 추가
   - `config.js`에 차트 설정 추가

2. **다른 금속 가격 추가 (은, 백금 등)**
   - `api.js`에 새 API 함수 추가
   - `main.js`에 UI 업데이트 로직 추가

3. **가격 알림 기능**
   - 새로운 `notification.js` 모듈 생성
   - `main.js`에서 임계값 체크 로직 추가

4. **과거 데이터 분석**
   - 새로운 `analytics.js` 모듈 생성
   - 이동평균, RSI 등 지표 계산

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **차트**: Chart.js 4.x
- **폰트**: Google Fonts (Inter)
- **API**: 
  - Primary: [Metals Live API](https://metals.live)
  - Backup: [CoinGecko API](https://coingecko.com)

## 📝 개발 가이드

### 코딩 스타일

- 모든 함수는 명확한 Input/Output 주석 포함
- JSDoc 형식 주석 사용
- 의미 있는 변수/함수명 사용
- 모듈화된 구조 유지

### 새 기능 추가 시 체크리스트

- [ ] 새 모듈이 필요한가? → `js/` 폴더에 생성
- [ ] 설정이 필요한가? → `config.js`에 추가
- [ ] 유틸리티 함수가 필요한가? → `utils.js`에 추가
- [ ] API 호출이 필요한가? → `api.js`에 추가
- [ ] UI 업데이트가 필요한가? → `main.js`에 추가
- [ ] README 업데이트

## 🐛 문제 해결

### API 연결 실패
- 인터넷 연결 확인
- 브라우저 콘솔에서 에러 메시지 확인
- CORS 정책으로 인한 문제인 경우 로컬 서버 사용

### 차트가 표시되지 않음
- Chart.js CDN 로드 확인
- 브라우저 콘솔에서 JavaScript 에러 확인

## 📄 라이선스

MIT License

## 👤 작성자

AnsysKorEbu

---

**Last Updated**: 2025-12-02
