# 웹앱 국제화(i18n) 아키텍처 가이드

**문서 버전**: 1.0  
**최종 수정일**: 2025년 11월 24일  
**대상 독자**: 경영진, 개발팀, 제품팀

---

## Executive Summary

글로벌 서비스 진출을 위해서는 단순한 번역을 넘어 **시간대, 통화, 언어, 지역 규정** 등을 종합적으로 관리하는 국제화 아키텍처가 필수입니다. 

본 문서는:
- **경영진**: 글로벌 진출 체크리스트, 예상 리스크, 비용 영향도
- **개발자**: 기술 구현 가이드, 아키텍처 패턴, 코드 예시

를 제공합니다.

---

## 1. 개요

### 1.1 국제화(i18n) vs 현지화(L10n)

| 구분 | 내용 |
|------|------|
| **국제화(i18n)** | 소프트웨어를 다양한 언어와 지역을 지원할 수 있도록 설계하는 과정 |
| **현지화(L10n)** | 특정 지역에 맞게 번역, 통화, 시간대 등을 구성하는 과정 |

### 1.2 왜 필수인가?

- **시장 확대**: 전 세계 8억+ 인구에 접근 가능
- **사용자 경험**: 사용자의 언어/지역에서 자연스러운 경험 제공
- **법적 준수**: 각 국가의 데이터보호법, 세금 규정 준수
- **비용 절감**: 사후 리팩토링은 초기 설계의 3-5배 비용

---

## 2. 핵심 아키텍처 요소 (3가지 기본 + 11가지 추가)

### 2.1 기본 요소 (필수)

#### 1️⃣ Time & Timezone 관리

**원칙:**
- **저장**: 모든 시간은 **UTC**로 데이터베이스에 저장
- **표시**: 사용자의 timezone으로 변환하여 화면에 표시
- **입력**: 사용자 입력은 timezone 정보와 함께 수신 후 UTC로 변환

**구현 예시:**

```javascript
// ==================
// Backend (Node.js)
// ==================

// 1. 데이터 저장 - UTC로 변환
const saveTimestamp = (userLocalTime, userTimezone) => {
  const utcTime = new Date(userLocalTime).toISOString();
  // DB에 저장
  db.query('INSERT INTO events (created_at) VALUES (?)', [utcTime]);
};

// 2. 데이터 조회 - User의 timezone으로 변환
const getEventForUser = (eventId, userTimezone) => {
  const event = db.query('SELECT * FROM events WHERE id = ?', [eventId]);
  
  return {
    ...event,
    displayTime: formatToTimezone(event.created_at, userTimezone)
  };
};

// Helper 함수
const formatToTimezone = (utcTime, timezone) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(utcTime));
};

// ==================
// Frontend (React)
// ==================

import { format, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

// 1. UTC → 사용자 timezone으로 변환하여 표시
const DisplayTime = ({ utcTime, timezone }) => {
  const zonedDate = utcToZonedTime(utcTime, timezone);
  const formatted = format(zonedDate, 'yyyy-MM-dd HH:mm:ss', { 
    timeZone: timezone 
  });
  return <div>{formatted}</div>;
};

// 2. 사용자 입력 → UTC로 변환하여 저장
const handleScheduleEvent = (localDateTime, timezone) => {
  const utcTime = zonedTimeToUtc(new Date(localDateTime), timezone);
  
  api.post('/events', {
    scheduledTime: utcTime.toISOString()
  });
};
```

**권장 라이브러리:**
- `date-fns-tz` (가볍고 Tree-shakeable)
- `dayjs` + `timezone` 플러그인
- `luxon` (더 많은 기능)

---

#### 2️⃣ Currency 통화 처리

**원칙:**
- **저장**: 기본 통화(예: USD)로 저장, 통화 코드와 함께 저장
- **표시**: 사용자의 선호 통화로 변환 후 포맷팅
- **환율**: 외부 API (예: ECB, ExchangeRate API) 에서 주기적으로 갱신

**구현 예시:**

```javascript
// ==================
// Backend (Node.js)
// ==================

// 1. 환율 데이터 갱신 (일일 배치)
const updateExchangeRates = async () => {
  const rates = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    .then(res => res.json());
  
  // Redis 또는 DB에 캐싱
  cache.set('exchange_rates', rates.rates, { 
    ttl: 86400 // 24시간
  });
};

// 2. 통화 변환 함수
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  const rates = await cache.get('exchange_rates');
  const rate = rates[toCurrency] / rates[fromCurrency];
  
  return parseFloat((amount * rate).toFixed(2));
};

// 3. API 응답에 통화 정보 포함
app.get('/api/products/:id', async (req, res) => {
  const product = await db.getProduct(req.params.id);
  const userCurrency = req.user.currency || 'USD'; // 기본값
  
  const price = await convertCurrency(
    product.priceInUSD,
    'USD',
    userCurrency
  );
  
  res.json({
    ...product,
    price: price,
    currency: userCurrency
  });
});

// ==================
// Frontend (React)
// ==================

// 통화 포맷팅
const formatCurrency = (amount, currency, locale) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// 예시:
// formatCurrency(1234.56, 'USD', 'en-US')   → $1,234.56
// formatCurrency(1234.56, 'EUR', 'de-DE')   → 1.234,56 €
// formatCurrency(1234.56, 'KRW', 'ko-KR')   → ₩1,234.56

const ProductCard = ({ product, userCurrency, userLocale }) => {
  return (
    <div>
      <h3>{product.name}</h3>
      <p className="price">
        {formatCurrency(product.price, userCurrency, userLocale)}
      </p>
    </div>
  );
};
```

**결제 시스템 연동:**
```javascript
// Stripe, PayPal 등은 통화별로 결제 처리
const createPaymentIntent = async (amount, currency, userId) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Cents
    currency: currency.toLowerCase(),
    customer: userId
  });
  
  return paymentIntent;
};
```

---

#### 3️⃣ Translation 다국어 지원

**원칙:**
- **구조**: 언어별 JSON 파일로 관리
- **위치**: Frontend에서 로드 및 렌더링
- **키 네이밍**: 계층적 구조 (예: `auth.login.submit`)

**구현 예시:**

```
locales/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── errors.json
│   └── messages.json
└── ko/
    ├── common.json
    ├── auth.json
    ├── errors.json
    └── messages.json
```

**en/common.json:**
```json
{
  "app": {
    "name": "MyApp",
    "tagline": "Global Habit Tracker"
  },
  "navigation": {
    "home": "Home",
    "profile": "Profile",
    "settings": "Settings"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading..."
  }
}
```

**ko/common.json:**
```json
{
  "app": {
    "name": "MyApp",
    "tagline": "글로벌 습관 추적기"
  },
  "navigation": {
    "home": "홈",
    "profile": "프로필",
    "settings": "설정"
  },
  "common": {
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "loading": "로딩 중..."
  }
}
```

**Frontend 구현 (react-i18next):**

```javascript
// i18n.config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import koCommon from './locales/ko/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enCommon },
      ko: { translation: koCommon }
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;

// Component에서 사용
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { t, i18n } = useTranslation();
  
  return (
    <header>
      <h1>{t('app.name')}</h1>
      <nav>
        <a href="/">{t('navigation.home')}</a>
        <a href="/profile">{t('navigation.profile')}</a>
      </nav>
      
      <select onChange={(e) => i18n.changeLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="ko">한국어</option>
      </select>
    </header>
  );
};
```

**권장 라이브러리:**
- `react-i18next` (React 최적화)
- `next-intl` (Next.js 추천)
- `i18next` (백엔드도 지원)

---

### 2.2 추가 필수 요소 (중요)

#### 4️⃣ Locale 관리 시스템 (필수!)

**Locale 결정 우선순위:**

```javascript
const determineUserLocale = (req, user) => {
  // 1. 사용자가 설정한 선호도 (DB에서 가져옴)
  if (user && user.preferredLocale) {
    return user.preferredLocale;
  }
  
  // 2. URL 파라미터 (/ko/products, /en/settings)
  if (req.params.locale) {
    return req.params.locale;
  }
  
  // 3. 쿠키 (비로그인 사용자 추적)
  if (req.cookies.locale) {
    return req.cookies.locale;
  }
  
  // 4. Accept-Language 헤더 (브라우저 설정)
  const browserLanguage = req.headers['accept-language'];
  if (browserLanguage) {
    return browserLanguage.split(',')[0]; // 첫 번째 선호 언어
  }
  
  // 5. IP 기반 지역 감지 (GeoIP)
  const geoLocale = await getLocaleFromIP(req.ip);
  if (geoLocale) {
    return geoLocale;
  }
  
  // 6. 기본값
  return 'en-US';
};
```

**저장 위치:**

| 저장 위치 | 용도 | 예시 |
|---------|------|------|
| **Database** | 로그인 사용자의 영구 설정 | `users.locale`, `users.timezone`, `users.currency` |
| **Context/Store** | Frontend 세션 상태 | Zustand, Redux, Context API |
| **Cookie** | 비로그인 사용자 추적 (7-30일) | `locale=ko; path=/; max-age=2592000` |
| **LocalStorage** | 임시 사용자 선호도 | JavaScript로 저장/로드 |
| **URL Path** | SEO 친화적 | `/ko/products`, `/en/about` |

**Database Schema:**
```sql
ALTER TABLE users ADD COLUMN (
  locale VARCHAR(10) DEFAULT 'en-US' COMMENT '사용자 언어 (예: en-US, ko-KR, ja-JP)',
  timezone VARCHAR(50) DEFAULT 'UTC' COMMENT '사용자 타임존 (예: Asia/Seoul)',
  currency VARCHAR(3) DEFAULT 'USD' COMMENT '사용자 선호 통화'
);

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX idx_users_locale ON users(locale);
CREATE INDEX idx_users_timezone ON users(timezone);
```

---

#### 5️⃣ 숫자 & 단위 형식

```javascript
// 1. 숫자 형식 - 지역에 따라 소수점과 천 단위가 다름
const formatNumber = (number, locale) => {
  return new Intl.NumberFormat(locale).format(number);
};

// formatNumber(1234567.89, 'en-US')  → 1,234,567.89
// formatNumber(1234567.89, 'de-DE')  → 1.234.567,89
// formatNumber(1234567.89, 'fr-FR')  → 1 234 567,89
// formatNumber(1234567.89, 'ko-KR')  → 1,234,567.89

// 2. 단위 변환 - 국가별로 다른 측정 단위
const Unit = {
  US: { temperature: '°F', weight: 'lb', distance: 'mi' },
  EU: { temperature: '°C', weight: 'kg', distance: 'km' },
  KR: { temperature: '°C', weight: 'kg', distance: 'km' }
};

const getUnitForCountry = (country, unitType) => {
  return Unit[country]?.[unitType] || Unit.EU[unitType];
};

// 3. 백분율 - 일부 지역은 쉼표 사용
const formatPercent = (number, locale) => {
  return new Intl.NumberFormat(locale, {
    style: 'percent'
  }).format(number);
};

// formatPercent(0.1234, 'en-US') → 12%
// formatPercent(0.1234, 'de-DE') → 12 %
```

---

#### 6️⃣ 주소 형식

국가별로 주소 입력 필드와 유효성 검사가 다릅니다.

```javascript
// 주소 형식 정의
const addressFormats = {
  'US': {
    fields: ['street', 'city', 'state', 'zipCode'],
    zipCodePattern: /^\d{5}(-\d{4})?$/,
    example: '123 Main St, New York, NY 10001'
  },
  'KR': {
    fields: ['zipCode', 'region', 'city', 'detail'],
    zipCodePattern: /^\d{5}$/,
    example: '03121 서울시 종로구 청와대로 1'
  },
  'JP': {
    fields: ['zipCode', 'prefecture', 'city', 'detail'],
    zipCodePattern: /^\d{3}-\d{4}$/,
    example: '〒100-0001 東京都 千代田区 丸の内'
  }
};

// 권장: Google Places API 사용 (자동완성, 유효성 검증)
const fetchAddressSuggestions = async (input, country) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&componentRestrictions=country:${country}`
  );
  return response.json();
};
```

**권장 라이브러리:**
- `@react-google-maps/api` (Google Places)
- `libaddresscode` (오픈소스 주소 포맷)

---

#### 7️⃣ 폰트 & 타이포그래피

```css
/* 다국어 폰트 전략 */
/* 방법 1: System Font 스택 */
body {
  font-family: 
    -apple-system,           /* macOS, iOS */
    BlinkMacSystemFont,      /* Chrome */
    'Segoe UI',              /* Windows */
    'Noto Sans KR',          /* 한국어 */
    'Noto Sans JP',          /* 일본어 */
    'Noto Sans SC',          /* 중국어 간체 */
    'Noto Sans TC',          /* 중국어 번체 */
    sans-serif;
  font-size: 16px;
  line-height: 1.5;
}

/* 방법 2: Google Fonts (권장) */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');

body {
  font-family: 'Noto Sans', 'Noto Sans KR', 'Noto Sans JP', sans-serif;
}

/* CJK 문자 최적화 */
.cjk-text {
  font-feature-settings: 'pkna' on; /* Proportional Kana */
  text-rendering: geometricPrecision;
}

/* 영어 문자 렌더링 최적화 */
.en-text {
  font-feature-settings: 'liga' on;
  font-kerning: auto;
}
```

**성능 최적화:**
```css
/* 폰트 로딩 최적화 */
@font-face {
  font-family: 'Noto Sans KR';
  src: url('/fonts/noto-sans-kr.woff2') format('woff2');
  font-display: swap; /* FOIT 방지 */
  font-weight: 400;
  unicode-range: U+AC00-D7AF; /* 한글만 */
}

/* 불필요한 글리프 제거 (서브셋 폰트) */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-subset.woff2') format('woff2');
  font-display: fallback;
}
```

---

#### 8️⃣ RTL (Right-to-Left) 언어 지원

아랍어, 히브리어 등 오른쪽에서 왼쪽으로 읽는 언어를 지원합니다.

```html
<!-- HTML 방향 설정 -->
<html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <!-- 내용 -->
  </body>
</html>
```

```css
/* RTL 레이아웃 - 논리적 프로퍼티 사용 */

/* 기존 방식 (지양) */
.box {
  margin-left: 20px;     /* LTR에서만 작동 */
  padding-right: 10px;
  text-align: left;
  float: right;
}

/* 논리적 프로퍼티 (권장) */
.box {
  margin-inline-start: 20px;   /* LTR:left, RTL:right */
  padding-inline-end: 10px;    /* LTR:right, RTL:left */
  text-align: start;           /* LTR:left, RTL:right */
  float: inline-end;           /* LTR:right, RTL:left */
}

/* Grid/Flex에서 자동 반영 */
.flex-container {
  display: flex;
  flex-direction: row; /* RTL에서 자동으로 역순 */
}
```

```javascript
// React에서 RTL 감지 및 처리
const useDir = (locale) => {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  const isRTL = rtlLocales.includes(locale);
  
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);
  
  return isRTL;
};

// 컴포넌트에서 사용
const App = () => {
  const { locale } = useLocale();
  const isRTL = useDir(locale);
  
  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      {/* 자동으로 레이아웃이 반대로 됨 */}
    </div>
  );
};
```

---

#### 9️⃣ SEO & URL 구조

```
URL 패턴 선택 (권장 순서):

1. Subdirectory (가장 권장)
   https://example.com/en/products
   https://example.com/ko/products
   → SEO 좋음, 구현 쉬움

2. Subdomain (국가별 도메인)
   https://en.example.com/products
   https://ko.example.com/products
   → 완전한 분리 가능, DNS 추가 필요

3. ccTLD (권장하지 않음)
   https://example.com (영어)
   https://example.kr (한국어)
   → 매우 복잡, 비용 높음
```

```html
<!-- Hreflang 태그 - 검색 엔진에 다국어 버전 알림 -->
<!-- /en/products 페이지 -->
<link rel="alternate" hreflang="en" href="https://example.com/en/products" />
<link rel="alternate" hreflang="ko" href="https://example.com/ko/products" />
<link rel="alternate" hreflang="ja" href="https://example.com/ja/products" />
<link rel="alternate" hreflang="x-default" href="https://example.com/en/products" />

<!-- /ko/products 페이지 -->
<link rel="alternate" hreflang="ko" href="https://example.com/ko/products" />
<link rel="alternate" hreflang="en" href="https://example.com/en/products" />
<link rel="alternate" hreflang="x-default" href="https://example.com/en/products" />
```

```javascript
// Next.js 예시
export async function getStaticProps({ locale }) {
  return {
    props: {
      locale
    },
    revalidate: 3600 // ISR
  };
}

// robots.txt
User-agent: *
Allow: /
Disallow: /admin

// XML Sitemap (sitemap.xml)
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/en/products</loc>
    <xhtml:link rel="alternate" hreflang="ko" href="https://example.com/ko/products" />
    <xhtml:link rel="alternate" hreflang="ja" href="https://example.com/ja/products" />
    <lastmod>2025-11-24</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

#### 🔟 결제 시스템 다국어 지원

```javascript
// 국가별 선호 결제 수단
const paymentMethods = {
  'US': ['card', 'paypal', 'apple_pay', 'google_pay'],
  'KR': ['card', 'kakao_pay', 'naver_pay', 'toss', 'bank_transfer'],
  'CN': ['alipay', 'wechat_pay'],
  'JP': ['card', 'convenience_store', 'bank_transfer'],
  'EU': ['card', 'sepa', 'paypal', 'ideal']
};

// Stripe 예시 - 결제 처리
const createPayment = async (amount, currency, country, userId) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    customer: userId,
    payment_method_types: getPaymentMethodsForCountry(country),
    metadata: {
      country,
      locale: `${country.toLowerCase()}-${country.toUpperCase()}`
    }
  });
  
  return paymentIntent;
};

// 국가별 결제 수단 가져오기
const getPaymentMethodsForCountry = (country) => {
  return paymentMethods[country] || ['card', 'paypal'];
};

// 세금 계산 (VAT, GST, Tax)
const calculateTax = (amount, country, productType) => {
  const taxRates = {
    'US': { digital: 0, physical: 0.07 }, // 주 별로 다름
    'EU': { digital: 0.21, physical: 0.21 }, // VAT
    'KR': { digital: 0, physical: 0.1 }, // 부가세
    'UK': { digital: 0.2, physical: 0.2 }, // 브렉시트 후
    'AU': { digital: 0.1, physical: 0.1 }  // GST
  };
  
  const rate = taxRates[country]?.[productType] || 0;
  return amount * rate;
};
```

---

#### 1️⃣1️⃣ 법적 준수 & 규정

| 국가/지역 | 주요 규정 | 필수 사항 |
|----------|---------|---------|
| **EU** | GDPR | 개인정보 동의, 데이터 삭제 권리, 개인정보 이동권 |
| **캘리포니아** | CCPA | 개인정보 판매 거부 (Do Not Sell), 수집 정보 공개 |
| **한국** | 개인정보보호법 | 14세 미만 부모 동의, 휴면계정 정책 |
| **영국** | UK-GDPR (Post-Brexit) | GDPR과 유사 |
| **캐나다** | PIPEDA | 개인정보 접근 및 정정 권리 |
| **일본** | APPI | 개인정보 보호 및 국제 이전 제한 |
| **호주** | Privacy Act | 개인정보 수집, 공개, 보안 의무 |

```javascript
// 규정 준수 체크리스트 구현 예시

class ComplianceManager {
  // 1. 쿠키 동의 (GDPR, CCPA)
  static async getCookieConsent(country) {
    if (['EU', 'UK'].includes(country)) {
      return {
        required: true,
        categories: ['essential', 'analytics', 'marketing'],
        mustExplicitlyConsent: true
      };
    }
    if (country === 'US') {
      return {
        required: true,
        doNotSellOption: true
      };
    }
  }
  
  // 2. 데이터 처리 약관
  static getTermsForCountry(country) {
    return {
      dataResidency: `Data stored in ${country}`,
      dataController: 'Company HQ',
      dataRetention: country === 'EU' ? '3 years' : '5 years'
    };
  }
  
  // 3. 약관 URL
  static getComplianceURLs(country) {
    return {
      privacyPolicy: `/privacy-policy?locale=${country.toLowerCase()}`,
      termsOfService: `/terms?locale=${country.toLowerCase()}`,
      cookiePolicy: `/cookie-policy?locale=${country.toLowerCase()}`
    };
  }
}
```

---

#### 1️⃣2️⃣ 에러 메시지 다국어 처리

```javascript
// Backend 에러 처리
app.use((err, req, res, next) => {
  const locale = req.locale || 'en-US';
  
  // 에러 코드 → 다국어 메시지 매핑
  const errorMessages = {
    'en-US': {
      'AUTH_INVALID_CREDENTIALS': 'Invalid email or password',
      'PAYMENT_FAILED': 'Payment processing failed. Please try again.',
      'NETWORK_ERROR': 'Network error. Please check your connection.',
      'RESOURCE_NOT_FOUND': 'Resource not found',
      'VALIDATION_ERROR': 'Invalid input'
    },
    'ko-KR': {
      'AUTH_INVALID_CREDENTIALS': '이메일 또는 비밀번호가 잘못되었습니다',
      'PAYMENT_FAILED': '결제 처리에 실패했습니다. 다시 시도해주세요.',
      'NETWORK_ERROR': '네트워크 오류입니다. 연결을 확인해주세요.',
      'RESOURCE_NOT_FOUND': '리소스를 찾을 수 없습니다',
      'VALIDATION_ERROR': '입력값이 유효하지 않습니다'
    }
  };
  
  const message = errorMessages[locale]?.[err.code] || 'An error occurred';
  
  res.status(err.status || 500).json({
    error: message,
    code: err.code,
    timestamp: new Date().toISOString()
  });
});

// Frontend 에러 표시
const showError = (errorCode) => {
  const { t } = useTranslation();
  const message = t(`errors.${errorCode}`);
  
  toast.error(message);
};
```

---

## 3. 아키텍처 다이어그램

### 3.1 데이터 흐름

```
┌─────────────────────────────────────────────────────────┐
│                  사용자 접속                             │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Locale 결정 (우선순위):                                 │
│  1. 사용자 설정 (DB) → 2. URL → 3. 쿠키                  │
│  4. Accept-Language → 5. GeoIP → 6. 기본값              │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│  Context 설정 (Frontend):                               │
│  • locale (예: ko-KR)                                   │
│  • timezone (예: Asia/Seoul)                            │
│  • currency (예: KRW)                                   │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│  데이터 조회/조작:                                       │
│                                                         │
│  DB (UTC)  →  Backend  →  변환 계층  →  Frontend      │
│  ↓             ↓            ↓           ↓              │
│  [2025-11-24  사용자      [2025-11-24  표시:         │
│   08:00 UTC]  timezone    08:00]       2025-11-24    │
│              처리           한국시간    17:00         │
│                                        (사용자 화면)  │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Frontend 상태 관리

```
┌─────────────────────────────────────────────────────────┐
│               LocaleContext (전역 상태)                  │
├─────────────────────────────────────────────────────────┤
│ • locale: 'ko-KR'                                       │
│ • timezone: 'Asia/Seoul'                               │
│ • currency: 'KRW'                                       │
│ • translations: {...}                                  │
│ • setLocale(), setTimezone(), setCurrency()            │
└─────────────────────────────────────────────────────────┘
         ▲
         │ useLocale()
         │
    ┌────┴────────────────────────┐
    │                             │
┌───┴────────┐          ┌────────┴───┐
│  Header    │          │  Product   │
│ (번역)      │          │  List      │
└────────────┘          │ (통화)     │
                        └────────────┘
```

---

## 4. Frontend 구현 예시

### 4.1 기본 설정 (react-i18next)

```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import koCommon from './locales/ko/common.json';
import jaCommon from './locales/ja/common.json';

export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  ko: { name: '한국어', flag: '🇰🇷' },
  ja: { name: '日本語', flag: '🇯🇵' }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enCommon },
      ko: { translation: koCommon },
      ja: { translation: jaCommon }
    },
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;

// src/contexts/LocaleContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

interface LocaleContextType {
  locale: string;
  timezone: string;
  currency: string;
  setLocale: (locale: string) => void;
  setTimezone: (timezone: string) => void;
  setCurrency: (currency: string) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [locale, setLocale] = useState('en-US');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(true);

  // 사용자 설정 로드
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const response = await fetch('/api/user/settings');
        const data = await response.json();
        setLocale(data.locale || 'en-US');
        setTimezone(data.timezone || 'UTC');
        setCurrency(data.currency || 'USD');
      } catch (error) {
        console.error('Failed to load user settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSettings();
  }, []);

  const value = {
    locale,
    timezone,
    currency,
    setLocale,
    setTimezone,
    setCurrency
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
};
```

### 4.2 컴포넌트 예시

```typescript
// src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/contexts/LocaleContext';
import { SUPPORTED_LANGUAGES } from '@/i18n/config';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { setLocale } = useLocale();

  const handleLanguageChange = async (lang: string) => {
    await i18n.changeLanguage(lang);
    setLocale(lang);

    // Backend에 저장
    await fetch('/api/user/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: lang })
    });
  };

  return (
    <select onChange={(e) => handleLanguageChange(e.target.value)}>
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, flag }]) => (
        <option key={code} value={code}>
          {flag} {name}
        </option>
      ))}
    </select>
  );
};

// src/components/ProductCard.tsx
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/contexts/LocaleContext';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface Product {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export const ProductCard = ({ product }: { product: Product }) => {
  const { t } = useTranslation();
  const { currency, timezone } = useLocale();

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p className="price">
        {formatCurrency(product.price, currency, 'en-US')}
      </p>
      <p className="date">
        {t('common.created')}: {formatDate(product.createdAt, timezone)}
      </p>
      <button>{t('common.addToCart')}</button>
    </div>
  );
};

// src/utils/formatters.ts
import { format, utcToZonedTime } from 'date-fns-tz';

export const formatCurrency = (
  amount: number,
  currency: string,
  locale: string
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDate = (utcDate: string, timezone: string): string => {
  const zonedDate = utcToZonedTime(new Date(utcDate), timezone);
  return format(zonedDate, 'yyyy-MM-dd HH:mm:ss', { timeZone: timezone });
};

export const formatNumber = (number: number, locale: string): string => {
  return new Intl.NumberFormat(locale).format(number);
};
```

---

## 5. Backend 구현 예시 (Node.js/Express)

```typescript
// src/middleware/locale.middleware.ts
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      locale: string;
      timezone: string;
      currency: string;
    }
  }
}

export const localeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. 사용자가 로그인한 경우
    if (req.user) {
      req.locale = req.user.locale || 'en-US';
      req.timezone = req.user.timezone || 'UTC';
      req.currency = req.user.currency || 'USD';
      return next();
    }

    // 2. URL 파라미터에서 locale 확인
    if (req.params.locale) {
      req.locale = req.params.locale;
      req.timezone = 'UTC'; // 기본값
      req.currency = getCurrencyForLocale(req.params.locale);
      return next();
    }

    // 3. 쿠키에서 확인
    if (req.cookies.locale) {
      req.locale = req.cookies.locale;
      req.timezone = req.cookies.timezone || 'UTC';
      req.currency = req.cookies.currency || 'USD';
      return next();
    }

    // 4. Accept-Language 헤더
    const acceptLanguage = req.headers['accept-language']?.split(',')[0];
    if (acceptLanguage) {
      req.locale = acceptLanguage;
      req.timezone = 'UTC';
      req.currency = getCurrencyForLocale(acceptLanguage);
      return next();
    }

    // 5. GeoIP 기반 (선택사항)
    // const geoLocale = await getLocaleFromIP(req.ip);

    // 기본값
    req.locale = 'en-US';
    req.timezone = 'UTC';
    req.currency = 'USD';
    next();
  } catch (error) {
    console.error('Locale middleware error:', error);
    req.locale = 'en-US';
    req.timezone = 'UTC';
    req.currency = 'USD';
    next();
  }
};

const getCurrencyForLocale = (locale: string): string => {
  const currencyMap: { [key: string]: string } = {
    'ko': 'KRW',
    'en-US': 'USD',
    'en-GB': 'GBP',
    'de': 'EUR',
    'fr': 'EUR',
    'ja': 'JPY',
    'zh': 'CNY'
  };
  return currencyMap[locale] || 'USD';
};

// src/utils/timezone.ts
import { formatInTimeZone } from 'date-fns-tz';

export const convertToUTC = (
  localDateTime: string,
  timezone: string
): Date => {
  return new Date(localDateTime); // date-fns-tz 사용 권장
};

export const convertFromUTC = (
  utcDateTime: string | Date,
  timezone: string
): string => {
  const date = new Date(utcDateTime);
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd HH:mm:ss');
};

export const getCurrentTimeInTimezone = (timezone: string): string => {
  return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd HH:mm:ss');
};

// src/utils/currency.ts
export interface ExchangeRate {
  [key: string]: number;
}

let cachedRates: ExchangeRate | null = null;
let ratesFetchedAt: number = 0;

export const getExchangeRates = async (): Promise<ExchangeRate> => {
  const now = Date.now();
  const CACHE_DURATION = 3600000; // 1시간

  if (cachedRates && now - ratesFetchedAt < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD'
    );
    const data = await response.json();
    cachedRates = data.rates;
    ratesFetchedAt = now;
    return cachedRates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return cachedRates || { USD: 1 };
  }
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;

  const rates = await getExchangeRates();
  const baseRate = rates[toCurrency] / rates[fromCurrency];
  return parseFloat((amount * baseRate).toFixed(2));
};

// src/routes/products.ts
import express from 'express';
import { localeMiddleware } from '@/middleware/locale.middleware';
import { convertCurrency } from '@/utils/currency';

const router = express.Router();

router.use(localeMiddleware);

router.get('/:id', async (req, res) => {
  try {
    const product = await db.getProduct(req.params.id);

    // 통화 변환
    const price = await convertCurrency(
      product.priceInUSD,
      'USD',
      req.currency
    );

    res.json({
      ...product,
      price: price,
      currency: req.currency,
      locale: req.locale,
      timezone: req.timezone
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
```

---

## 6. 배포 & 모니터링

### 6.1 환경 변수 설정

```bash
# .env.example
SUPPORTED_LOCALES=en-US,ko-KR,ja-JP,de-DE
DEFAULT_LOCALE=en-US
DEFAULT_TIMEZONE=UTC
DEFAULT_CURRENCY=USD

# 외부 API
EXCHANGE_RATE_API_KEY=your_api_key
GOOGLE_PLACES_API_KEY=your_api_key

# i18n 설정
I18N_NAMESPACE=translation
I18N_DEBUG=false
```

### 6.2 CI/CD 검증

```yaml
# .github/workflows/i18n-check.yml
name: i18n Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Check translation keys
        run: |
          # 모든 locale에서 키가 일치하는지 확인
          node scripts/validate-i18n.js
      
      - name: Check for missing translations
        run: |
          # 사용하지 않는 키 찾기
          node scripts/find-unused-keys.js
      
      - name: Validate locale format
        run: |
          # JSON 형식 검증
          node scripts/validate-json.js
```

---

## 7. 체크리스트

### Phase 1: 기본 설정 (1-2주)

#### 경영진 체크리스트
- [ ] 타겟 국가/지역 확정
- [ ] 각 국가별 기본 통화 확정
- [ ] 지원할 언어 우선순위 결정
- [ ] 예산 승인 (번역 비용, 외부 API 비용)
- [ ] 법적 검토 (GDPR, CCPA, 개인정보보호법 등)

#### 개발자 체크리스트
- [ ] i18n 라이브러리 선택 & 설치 (react-i18next 권장)
- [ ] 기본 locale 구조 생성 (locales/en, locales/ko)
- [ ] LocaleContext/Store 구현
- [ ] UTC timezone 처리 구현
- [ ] 기본 번역 파일 작성 (공통 사용 문구)
- [ ] 테스트 환경 구성

---

### Phase 2: 핵심 기능 (2-4주)

#### 경영진 체크리스트
- [ ] 번역사/현지화 전문가 영입
- [ ] 각 국가별 결제 방식 확인
- [ ] 법률 자문 받기 (조세, 개인정보, 약관)
- [ ] 고객 지원팀 다국어 준비

#### 개발자 체크리스트
- [ ] 통화 변환 및 포맷팅 구현
- [ ] 시간대 변환 기능 구현
- [ ] 모든 페이지/컴포넌트에 번역 적용
- [ ] 에러 메시지 다국어 처리
- [ ] Date/Number/Currency 포맷팅 구현
- [ ] Locale 관리 시스템 (DB 저장, 선호도)
- [ ] 단위 변환 (온도, 무게, 거리)

---

### Phase 3: 고급 기능 (2-3주)

#### 경영진 체크리스트
- [ ] SEO 전략 수립 (언어별 도메인/경로 결정)
- [ ] 마케팅 콘텐츠 현지화
- [ ] 각 국가별 고객 서비스 계획

#### 개발자 체크리스트
- [ ] RTL 언어 지원 (아랍어, 히브리어)
- [ ] 주소 형식 현지화 (국가별 주소 API 연동)
- [ ] 폰트 최적화 (CJK 문자, 웹폰트)
- [ ] SEO 구현 (hreflang, XML sitemap)
- [ ] 결제 시스템 다국어 지원
- [ ] 법적 문서 현지화 (약관, 개인정보)

---

### Phase 4: 테스트 & 런칭 (2주)

#### 경영진 체크리스트
- [ ] 각 국가별 현지 테스터 확보
- [ ] 런칭 일정 확정
- [ ] 마케팅 캠페인 시작

#### 개발자 체크리스트
- [ ] 모든 locale에서 UI 테스트 (깨진 레이아웃 확인)
- [ ] Text expansion 테스트 (긴 번역 텍스트)
- [ ] Pseudo-localization 테스트 (번역 누락 확인)
- [ ] SEO 검증 (Google Search Console)
- [ ] 성능 테스트 (각 locale별 로딩 시간)
- [ ] 모바일 반응형 테스트 (각 언어/지역)
- [ ] 통화 변환 정확도 테스트
- [ ] 시간대 변환 정확도 테스트
- [ ] 결제 시스템 end-to-end 테스트

---

### Phase 5: 유지보수 (지속)

#### 경영진 체크리스트
- [ ] 각 국가별 수익률 모니터링
- [ ] 신규 국가 진출 계획

#### 개발자 체크리스트
- [ ] 환율 API 모니터링 (실패 시 대응)
- [ ] 번역 누락/오류 수정
- [ ] 사용자 피드백 수집 및 반영
- [ ] 성능 최적화 (번역 파일 크기, 로딩 시간)
- [ ] 신규 국가 추가 시 프로세스 자동화
- [ ] 정기적 다국어 테스트 (월 1회 이상)

---

## 8. 일반적인 실수 & 해결책

| 실수 | 문제 | 해결책 |
|------|------|--------|
| **Hard-coded 문자열** | 번역 불가능 | 모든 문자열을 i18n으로 관리 |
| **TimeZone 무시** | 사용자별 시간 오류 | 항상 UTC 저장, 조회 시 변환 |
| **환율 캐싱 안 함** | API 과다 호출 & 비용 증가 | Redis/메모리에 캐싱, TTL 설정 |
| **UI 반응형 미고려** | 긴 텍스트로 레이아웃 깨짐 | Text expansion 여유(30%) 확보 |
| **RTL 미지원** | 아랍어/히브리어 사용자 이탈 | Logical CSS properties 사용 |
| **SEO 무시** | 검색 트래픽 손실 | hreflang, 언어별 URL 구조 |
| **법적 규정 미준수** | 벌금 & 서비스 중단 | 국가별 변호사 검토 필수 |
| **번역 품질 관리 부재** | 자동번역 오류 많음 | 전문 번역사 + QA 프로세스 |
| **성능 최적화 안 함** | 모든 번역 파일 로드 | Lazy loading, 언어별 번들 분리 |
| **사용자 Locale 선택권 없음** | 불만 증가 | 명확한 언어 선택 UI 제공 |

---

## 9. 추천 도구 & 서비스

### Frontend 라이브러리
- **react-i18next**: React 최적화, 많은 생태계
- **next-intl**: Next.js 전용, 서버사이드 렌더링 최적화
- **i18next**: Backend/Frontend 모두 지원

### 백엔드 지원
- **i18next Node.js**: Node.js 환경
- **node-polyglot**: 경량 라이브러리

### 번역 관리 도구
- **Phrase**: 팀 협업, CI/CD 통합
- **Lokalise**: 자동 번역, 번역가 관리
- **Crowdin**: 크라우드소싱, 대규모 번역
- **Weblate**: 오픈소스 (자체 호스팅)

### API 서비스
- **ExchangeRate-API**: 환율 데이터
- **Open-Meteo**: 시간대 정보
- **Google Places API**: 주소 자동완성
- **MaxMind GeoIP**: 지역 감지

### 모니터링
- **Sentry**: 에러 추적
- **DataDog**: 성능 모니터링
- **LogRocket**: 사용자 세션 리플레이

---

## 10. 다음 단계

1. **현재**: 이 문서 검토 & 팀 토론
2. **1주일 내**: 타겟 국가/언어 확정
3. **2주일 내**: Phase 1 기본 설정 완료
4. **4주일 내**: Phase 2-3 핵심 기능 구현
5. **6주일 내**: 테스트 및 런칭 준비

---

## 문의 & 피드백

이 문서에 대한 질문이나 피드백은 언제든 환영합니다.

**마지막 수정**: 2025-11-24  
**버전**: 1.0

