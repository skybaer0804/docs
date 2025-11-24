# UTC & Locale 기반 타임존 처리 - TDD 함수 설계 가이드

## 개요

이 가이드는 **UTC 기준 저장**, **Locale별 조회/변환**, **TDD 방식 함수 설계**를 다룹니다.

### 핵심 원칙

-   **DB 저장**: 항상 UTC
-   **API 통신**: UTC 기준
-   **사용자 표시**: Locale/Timezone 기준으로 변환
-   **테스트**: 각 함수마다 단위 테스트 작성

---

## 시나리오: 한국 유저 이벤트 목록 조회

**유저 정보:**

```
Locale: ko-KR
Timezone: Asia/Seoul (UTC+9)
조회 범위: 2025-11-24 09:00 ~ 18:00 (한국 시간)
```

**데이터 흐름:**

```
[Frontend 한국시간] → [UTC 변환] → [API 요청]
                                    ↓
                            [Backend DB 쿼리]
                                    ↓
                            [UTC → 한국시간 변환]
                                    ↓
              [Frontend 사용자에게 표시]
```

---

## TDD 함수 설계

### 1. Frontend 타임존 변환 함수

#### 1.1 `convertLocalToUTC` - 로컬 시간을 UTC로 변환

**테스트 코드**

```typescript
import { describe, it, expect } from 'vitest';
import { convertLocalToUTC } from '@/utils/timezone';

describe('convertLocalToUTC', () => {
    it('한국 시간(2025-11-24 09:00)을 UTC로 변환', () => {
        const result = convertLocalToUTC('2025-11-24 09:00', 'Asia/Seoul');
        expect(result).toBe('2025-11-24T00:00:00.000Z');
    });

    it('한국 시간(2025-11-24 18:00)을 UTC로 변환', () => {
        const result = convertLocalToUTC('2025-11-24 18:00', 'Asia/Seoul');
        expect(result).toBe('2025-11-24T09:00:00.000Z');
    });

    it('미국 뉴욕 시간을 UTC로 변환 (EST: UTC-5)', () => {
        const result = convertLocalToUTC('2025-11-24 10:00', 'America/New_York');
        expect(result).toBe('2025-11-24T15:00:00.000Z');
    });

    it('잘못된 날짜 형식시 에러 반환', () => {
        expect(() => {
            convertLocalToUTC('invalid-date', 'Asia/Seoul');
        }).toThrow('Invalid date format');
    });

    it('잘못된 timezone시 에러 반환', () => {
        expect(() => {
            convertLocalToUTC('2025-11-24 09:00', 'Invalid/Timezone');
        }).toThrow('Invalid timezone');
    });
});
```

**구현 코드**

```typescript
import { zonedTimeToUtc } from 'date-fns-tz';

/**
 * 로컬 시간을 UTC로 변환
 * @param localDateTime - 로컬 시간 (형식: 'YYYY-MM-DD HH:mm')
 * @param timezone - 타임존 (예: 'Asia/Seoul')
 * @returns UTC ISO String (형식: '2025-11-24T00:00:00.000Z')
 * @throws {Error} 날짜 형식 또는 타임존이 유효하지 않음
 */
export function convertLocalToUTC(localDateTime: string, timezone: string): string {
    try {
        // 날짜 형식 검증
        const datePattern = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/;
        if (!datePattern.test(localDateTime)) {
            throw new Error('Invalid date format. Expected: YYYY-MM-DD HH:mm:ss');
        }

        const localDate = new Date(localDateTime);
        if (isNaN(localDate.getTime())) {
            throw new Error('Invalid date');
        }

        const utcDate = zonedTimeToUtc(localDate, timezone);
        return utcDate.toISOString();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`convertLocalToUTC error: ${error.message}`);
        }
        throw error;
    }
}
```

---

#### 1.2 `convertUTCToLocal` - UTC를 로컬 시간으로 변환

**테스트 코드**

```typescript
describe('convertUTCToLocal', () => {
    it('UTC 시간을 한국 시간으로 변환', () => {
        const result = convertUTCToLocal('2025-11-24T00:00:00.000Z', 'Asia/Seoul');
        expect(result).toBe('2025-11-24 09:00:00');
    });

    it('UTC 시간을 뉴욕 시간으로 변환', () => {
        const result = convertUTCToLocal('2025-11-24T15:00:00.000Z', 'America/New_York');
        expect(result).toBe('2025-11-24 10:00:00');
    });

    it('잘못된 UTC 형식시 에러 반환', () => {
        expect(() => {
            convertUTCToLocal('invalid-utc', 'Asia/Seoul');
        }).toThrow();
    });
});
```

**구현 코드**

```typescript
import { formatInTimeZone } from 'date-fns-tz';

/**
 * UTC 시간을 특정 타임존의 로컬 시간으로 변환
 * @param utcDateTime - UTC 시간 (ISO String)
 * @param timezone - 타임존 (예: 'Asia/Seoul')
 * @returns 로컬 시간 (형식: 'YYYY-MM-DD HH:mm:ss')
 */
export function convertUTCToLocal(utcDateTime: string, timezone: string): string {
    try {
        const date = new Date(utcDateTime);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid UTC datetime');
        }

        return formatInTimeZone(date, timezone, 'yyyy-MM-dd HH:mm:ss');
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`convertUTCToLocal error: ${error.message}`);
        }
        throw error;
    }
}
```

---

#### 1.3 `createDateRangeQuery` - Frontend에서 쿼리 범위 생성

**테스트 코드**

```typescript
describe('createDateRangeQuery', () => {
    it('한국 유저의 조회 범위를 UTC로 변환', () => {
        const result = createDateRangeQuery('2025-11-24 09:00', '2025-11-24 18:00', 'Asia/Seoul');

        expect(result).toEqual({
            fromDateTime: '2025-11-24T00:00:00.000Z',
            toDateTime: '2025-11-24T09:00:00.000Z',
            timezone: 'Asia/Seoul',
        });
    });

    it('시작 시간이 종료 시간보다 늦으면 에러', () => {
        expect(() => {
            createDateRangeQuery('2025-11-24 18:00', '2025-11-24 09:00', 'Asia/Seoul');
        }).toThrow('fromDateTime must be before toDateTime');
    });

    it('범위가 같으면 정상 처리', () => {
        const result = createDateRangeQuery('2025-11-24 09:00', '2025-11-24 09:00', 'Asia/Seoul');

        expect(result.fromDateTime).toBe(result.toDateTime);
    });
});
```

**구현 코드**

```typescript
/**
 * Frontend에서 조회 범위를 API 요청 형식으로 변환
 * @param fromLocalDateTime - 시작 시간 (로컬)
 * @param toLocalDateTime - 종료 시간 (로컬)
 * @param timezone - 타임존
 * @returns API 요청용 쿼리 객체
 */
export function createDateRangeQuery(
    fromLocalDateTime: string,
    toLocalDateTime: string,
    timezone: string
): {
    fromDateTime: string;
    toDateTime: string;
    timezone: string;
} {
    const fromUTC = convertLocalToUTC(fromLocalDateTime, timezone);
    const toUTC = convertLocalToUTC(toLocalDateTime, timezone);

    // 시작 시간이 종료 시간보다 늦지 않는지 검증
    if (new Date(fromUTC) > new Date(toUTC)) {
        throw new Error('fromDateTime must be before toDateTime');
    }

    return {
        fromDateTime: fromUTC,
        toDateTime: toUTC,
        timezone,
    };
}
```

---

### 2️. Backend 타임존 변환 함수

#### 2.1 `formatEventWithUserTimezone` - DB 결과를 사용자 시간대로 포맷

**테스트 코드**

```typescript
describe('formatEventWithUserTimezone', () => {
    const mockEvent = {
        id: 1,
        title: 'Morning Meeting',
        created_at: '2025-11-24T01:30:00.000Z', // UTC
    };

    it('UTC 이벤트를 한국 시간으로 변환', () => {
        const result = formatEventWithUserTimezone(mockEvent, 'Asia/Seoul');

        expect(result).toEqual({
            id: 1,
            title: 'Morning Meeting',
            created_at: '2025-11-24T01:30:00.000Z',
            displayTime: '2025-11-24 10:30:00',
            timezone: 'Asia/Seoul',
        });
    });

    it('UTC 이벤트를 미국 뉴욕 시간으로 변환', () => {
        const result = formatEventWithUserTimezone(mockEvent, 'America/New_York');

        expect(result).toEqual(
            expect.objectContaining({
                displayTime: '2025-11-23 20:30:00',
                timezone: 'America/New_York',
            })
        );
    });

    it('null 이벤트 처리', () => {
        expect(() => {
            formatEventWithUserTimezone(null as any, 'Asia/Seoul');
        }).toThrow();
    });
});
```

**구현 코드**

```typescript
import { formatInTimeZone } from 'date-fns-tz';

interface Event {
    id: number;
    title: string;
    created_at: string;
    [key: string]: any;
}

interface FormattedEvent extends Event {
    displayTime: string;
    timezone: string;
}

/**
 * DB에서 조회한 이벤트를 사용자 시간대로 포맷
 * @param event - DB 쿼리 결과 (created_at은 UTC)
 * @param timezone - 사용자 타임존
 * @returns 포맷된 이벤트 객체
 */
export function formatEventWithUserTimezone(event: Event, timezone: string): FormattedEvent {
    if (!event || !event.created_at) {
        throw new Error('Invalid event object');
    }

    try {
        const date = new Date(event.created_at);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid created_at datetime');
        }

        const displayTime = formatInTimeZone(date, timezone, 'yyyy-MM-dd HH:mm:ss');

        return {
            ...event,
            displayTime,
            timezone,
        };
    } catch (error) {
        throw new Error(`formatEventWithUserTimezone error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
```

---

#### 2.2 `buildDateRangeFilter` - 쿼리 범위 검증 및 SQL 필터 생성

**테스트 코드**

```typescript
describe('buildDateRangeFilter', () => {
    it('유효한 날짜 범위로 필터 생성', () => {
        const result = buildDateRangeFilter('2025-11-24T00:00:00.000Z', '2025-11-24T09:00:00.000Z');

        expect(result).toEqual({
            query: 'WHERE created_at >= ? AND created_at <= ?',
            params: ['2025-11-24T00:00:00.000Z', '2025-11-24T09:00:00.000Z'],
        });
    });

    it('시작이 종료보다 늦으면 에러', () => {
        expect(() => {
            buildDateRangeFilter('2025-11-24T09:00:00.000Z', '2025-11-24T00:00:00.000Z');
        }).toThrow('fromDateTime must be before toDateTime');
    });

    it('범위가 30일을 초과하면 경고 로그', () => {
        const consoleSpy = vi.spyOn(console, 'warn');

        buildDateRangeFilter('2025-11-01T00:00:00.000Z', '2025-12-02T00:00:00.000Z');

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Date range exceeds 30 days'));
    });
});
```

**구현 코드**

```typescript
const MAX_RANGE_DAYS = 30;

interface DateRangeFilter {
    query: string;
    params: string[];
}

/**
 * API 요청의 날짜 범위를 검증하고 SQL 필터 생성
 * @param fromDateTime - 시작 시간 (UTC ISO String)
 * @param toDateTime - 종료 시간 (UTC ISO String)
 * @returns SQL WHERE 쿼리와 파라미터
 * @throws {Error} 날짜 범위가 유효하지 않음
 */
export function buildDateRangeFilter(fromDateTime: string, toDateTime: string): DateRangeFilter {
    try {
        const fromDate = new Date(fromDateTime);
        const toDate = new Date(toDateTime);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            throw new Error('Invalid datetime format');
        }

        if (fromDate > toDate) {
            throw new Error('fromDateTime must be before toDateTime');
        }

        // 범위 체크 (30일 초과시 경고)
        const diffMs = toDate.getTime() - fromDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays > MAX_RANGE_DAYS) {
            console.warn(`⚠️ Date range exceeds ${MAX_RANGE_DAYS} days (${Math.ceil(diffDays)} days requested)`);
        }

        return {
            query: 'WHERE created_at >= ? AND created_at <= ?',
            params: [fromDateTime, toDateTime],
        };
    } catch (error) {
        throw new Error(`buildDateRangeFilter error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
```

---

#### 2.3 `processEventList` - 이벤트 목록 일괄 처리

**테스트 코드**

```typescript
describe('processEventList', () => {
    const mockEvents = [
        { id: 1, title: 'Event 1', created_at: '2025-11-24T01:30:00.000Z' },
        { id: 2, title: 'Event 2', created_at: '2025-11-24T04:00:00.000Z' },
        { id: 3, title: 'Event 3', created_at: '2025-11-24T07:15:00.000Z' },
    ];

    it('이벤트 목록을 한국 시간으로 변환', () => {
        const result = processEventList(mockEvents, 'Asia/Seoul');

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual(
            expect.objectContaining({
                displayTime: '2025-11-24 10:30:00',
                timezone: 'Asia/Seoul',
            })
        );
    });

    it('빈 배열 처리', () => {
        const result = processEventList([], 'Asia/Seoul');
        expect(result).toEqual([]);
    });

    it('잘못된 타입 처리', () => {
        expect(() => {
            processEventList('invalid' as any, 'Asia/Seoul');
        }).toThrow();
    });
});
```

**구현 코드**

```typescript
/**
 * DB 쿼리 결과 이벤트 목록을 사용자 시간대로 일괄 처리
 * @param events - DB 쿼리 결과 배열
 * @param timezone - 사용자 타임존
 * @returns 포맷된 이벤트 배열
 */
export function processEventList(events: Event[], timezone: string): FormattedEvent[] {
    if (!Array.isArray(events)) {
        throw new Error('events must be an array');
    }

    try {
        return events.map((event) => formatEventWithUserTimezone(event, timezone));
    } catch (error) {
        throw new Error(`processEventList error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
```

---

### 3️. 유효성 검사 함수

#### 3.1 `isValidTimezone` - 타임존 유효성 검사

**테스트 코드**

```typescript
describe('isValidTimezone', () => {
    it('유효한 타임존 검증', () => {
        expect(isValidTimezone('Asia/Seoul')).toBe(true);
        expect(isValidTimezone('America/New_York')).toBe(true);
        expect(isValidTimezone('Europe/London')).toBe(true);
    });

    it('잘못된 타임존 검증', () => {
        expect(isValidTimezone('Invalid/Timezone')).toBe(false);
        expect(isValidTimezone('')).toBe(false);
        expect(isValidTimezone(null as any)).toBe(false);
    });
});
```

**구현 코드**

```typescript
/**
 * 타임존이 유효한지 검사
 * @param timezone - 검사할 타임존
 * @returns 유효 여부
 */
export function isValidTimezone(timezone: string): boolean {
    if (typeof timezone !== 'string' || timezone.trim() === '') {
        return false;
    }

    try {
        // Intl API를 이용한 타임존 검증
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;
    } catch {
        return false;
    }
}
```

---

## Frontend 유틸리티

### 완전한 Frontend Hook

```typescript
import { useState, useCallback } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { createDateRangeQuery } from '@/utils/timezone';

interface UseEventListParams {
    onLoading?: (loading: boolean) => void;
    onError?: (error: Error) => void;
}

export function useEventList({ onLoading, onError }: UseEventListParams = {}) {
    const [events, setEvents] = useState([]);
    const { timezone, locale } = useLocale();

    const fetchEventList = useCallback(
        async (fromDateTime: string, toDateTime: string) => {
            try {
                onLoading?.(true);

                // Step 1: 로컬 시간을 UTC로 변환 및 쿼리 생성
                const query = createDateRangeQuery(fromDateTime, toDateTime, timezone);

                // Step 2: API 요청
                const response = await fetch('/api/events/list', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept-Language': locale,
                    },
                    body: JSON.stringify(query),
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.statusText}`);
                }

                // Step 3: 결과 처리 (이미 변환된 displayTime 포함)
                const data = await response.json();
                setEvents(data.events);
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                onError?.(err);
                console.error('❌ Event list fetch failed:', err);
            } finally {
                onLoading?.(false);
            }
        },
        [timezone, locale, onLoading, onError]
    );

    return {
        events,
        fetchEventList,
        timezone,
    };
}
```

---

## Backend 유틸리티

### 완전한 Backend Route Handler

```typescript
import express, { Request, Response } from 'express';
import { buildDateRangeFilter, processEventList, isValidTimezone } from '@/utils/timezone';
import db from '@/db';

const router = express.Router();

/**
 * POST /api/events/list
 * 사용자의 시간대 기준으로 이벤트 목록 조회
 */
router.post('/api/events/list', async (req: Request, res: Response) => {
    try {
        const { fromDateTime, toDateTime, timezone } = req.body;

        // Step 1: 입력값 검증
        if (!fromDateTime || !toDateTime || !timezone) {
            return res.status(400).json({
                error: 'Missing required fields: fromDateTime, toDateTime, timezone',
            });
        }

        if (!isValidTimezone(timezone)) {
            return res.status(400).json({
                error: `Invalid timezone: ${timezone}`,
            });
        }

        // Step 2: 날짜 범위 필터 생성
        const filter = buildDateRangeFilter(fromDateTime, toDateTime);

        // Step 3: DB 쿼리 실행
        const events = await db.query(
            `SELECT id, title, created_at FROM events
       ${filter.query}
       ORDER BY created_at DESC`,
            filter.params
        );

        // Step 4: 이벤트 목록을 사용자 시간대로 변환
        const formattedEvents = processEventList(events, timezone);

        // Step 5: 응답 반환
        return res.json({
            success: true,
            count: formattedEvents.length,
            timezone,
            events: formattedEvents,
            queryRange: {
                from: fromDateTime,
                to: toDateTime,
            },
        });
    } catch (error) {
        console.error('❌ Event list API error:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});

export default router;
```

---

## 통합 예제

### 전체 흐름 (한국 유저)

```typescript
// ===== FRONTEND =====
import { useEventList } from '@/hooks/useEventList';

function EventListPage() {
    const { events, fetchEventList, timezone } = useEventList();

    const handleSearch = (fromDate: string, toDate: string) => {
        // 사용자가 입력한 한국 시간
        fetchEventList(fromDate, toDate);
        // 내부 동작:
        // 1. "2025-11-24 09:00" → "2025-11-24T00:00:00.000Z" (UTC 변환)
        // 2. "2025-11-24 18:00" → "2025-11-24T09:00:00.000Z" (UTC 변환)
        // 3. API 요청 전송
    };

    return (
        <div>
            <h1>이벤트 목록 ({timezone})</h1>
            <DateRangePicker onSearch={handleSearch} />
            <EventList events={events} />
        </div>
    );
}

// ===== API REQUEST =====
// POST /api/events/list
// Body:
// {
//   "fromDateTime": "2025-11-24T00:00:00.000Z",
//   "toDateTime": "2025-11-24T09:00:00.000Z",
//   "timezone": "Asia/Seoul"
// }

// ===== BACKEND =====
// 1. buildDateRangeFilter()로 SQL WHERE 생성
// 2. DB 쿼리:
//    SELECT * FROM events
//    WHERE created_at >= '2025-11-24T00:00:00.000Z'
//      AND created_at <= '2025-11-24T09:00:00.000Z'
//
// 3. 결과 (UTC):
//    [
//      { id: 1, title: "Morning Meeting", created_at: "2025-11-24T01:30:00.000Z" },
//      { id: 2, title: "Lunch Break", created_at: "2025-11-24T04:00:00.000Z" }
//    ]
//
// 4. processEventList()로 한국 시간으로 변환:
//    [
//      { id: 1, title: "Morning Meeting",
//        created_at: "2025-11-24T01:30:00.000Z",
//        displayTime: "2025-11-24 10:30:00",
//        timezone: "Asia/Seoul"
//      },
//      { id: 2, title: "Lunch Break",
//        created_at: "2025-11-24T04:00:00.000Z",
//        displayTime: "2025-11-24 13:00:00",
//        timezone: "Asia/Seoul"
//      }
//    ]

// ===== API RESPONSE =====
// {
//   "success": true,
//   "count": 2,
//   "timezone": "Asia/Seoul",
//   "events": [
//     {
//       "id": 1,
//       "title": "Morning Meeting",
//       "created_at": "2025-11-24T01:30:00.000Z",
//       "displayTime": "2025-11-24 10:30:00",
//       "timezone": "Asia/Seoul"
//     },
//     {
//       "id": 2,
//       "title": "Lunch Break",
//       "created_at": "2025-11-24T04:00:00.000Z",
//       "displayTime": "2025-11-24 13:00:00",
//       "timezone": "Asia/Seoul"
//     }
//   ],
//   "queryRange": {
//     "from": "2025-11-24T00:00:00.000Z",
//     "to": "2025-11-24T09:00:00.000Z"
//   }
// }

// ===== FRONTEND DISPLAY =====
// 사용자가 보는 화면:
// 이벤트 목록 (Asia/Seoul)
// - Morning Meeting: 2025-11-24 10:30:00
// - Lunch Break: 2025-11-24 13:00:00
```

---

## 고려사항 & 체크리스트

### 📋 TDD 작성시 체크리스트

#### 함수별 테스트 커버리지

```typescript
// ✅ 필수 테스트 시나리오
□ 정상 케이스 (Happy Path)
□ 경계값 (Boundary Values)
  - 자정(00:00), 자정 직전(23:59)
  - 월/연 경계
  - DST(서머타임) 전환일
□ 에러 케이스
  - 유효하지 않은 입력값
  - null/undefined 처리
  - 범위 역순
□ Timezone 별 테스트
  - UTC+9 (Asia/Seoul)
  - UTC-5 (America/New_York)
  - UTC+0 (Europe/London)
  - DST 적용 지역
```

#### 함수 설계시 체크리스트

```typescript
// ✅ 함수 설계 원칙
□ 단일 책임 원칙 (SRP)
  - 한 함수는 하나의 변환 작업만 수행
  - convertLocalToUTC: 로컬 → UTC
  - convertUTCToLocal: UTC → 로컬

□ 입력 검증
  - 날짜 형식 검증
  - 타임존 유효성 검증
  - null/undefined 체크

□ 명확한 반환값
  - 성공/실패 명확
  - 타입 정의 명확
  - Error 메시지 구체적

□ 에러 처리
  - try-catch로 예외 처리
  - 의미있는 에러 메시지
  - 에러 로깅
```

---

### ⚠️ 주의사항

#### 1. **DST (Daylight Saving Time) 고려**

```typescript
// 문제: 같은 로컬 시간이 연 2회 발생
// 2025년 11월 2일 02:00 EDT → 02:00 EST (1시간 뒤로 감)

// 해결: date-fns-tz 라이브러리 사용
// → DST 자동 처리
```

#### 2. **범위 쿼리 성능**

```typescript
// ❌ 주의: 너무 긴 범위
// 30일 이상 조회시 경고 로그 추가
// → 대량의 데이터 반환 방지

// ✅ 권장: 범위 제한
const MAX_RANGE_DAYS = 30;
```

#### 3. **API 타임아웃**

```typescript
// timezone 변환은 수 밀리초 소요
// 수백 개 이벤트 포맷 시간 고려
// → 배치 처리 또는 페이지네이션 고려
```

#### 4. **사용자 정보 저장**

```typescript
// ✅ 권장: user 테이블에 timezone 저장
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255),
  timezone VARCHAR(100),
  locale VARCHAR(10)
);

// 그러면 API 요청시 자동 적용 가능
```

---

### 🔒 보안 고려사항

```typescript
// 1. Timezone 인젝션 방지
if (!isValidTimezone(timezone)) {
    return res.status(400).json({ error: 'Invalid timezone' });
}

// 2. 날짜 범위 검증
const diffDays = (toDate - fromDate) / (1000 * 60 * 60 * 24);
if (diffDays > 30) {
    console.warn('Suspicious large date range');
}

// 3. 사용자 권한 확인
// API 요청시 사용자 본인의 이벤트만 조회 확인
```

---

### 📊 성능 최적화

```typescript
// 1. DB 인덱스
CREATE INDEX idx_events_created_at ON events(created_at);

// 2. 결과 캐싱
// Redis에 timezone별로 캐싱
const cacheKey = `events:${userId}:${timezone}:${dateRange}`;
const cached = await redis.get(cacheKey);

// 3. 배치 처리
// 1000개 이상 이벤트는 pagination 적용
```

---

### 🧪 테스트 실행 명령어

```bash
# 모든 테스트 실행
npm test

# 특정 파일만 테스트
npm test timezone.test.ts

# 커버리지 확인
npm test -- --coverage

# Watch 모드
npm test -- --watch
```

---

## 요약

**핵심 흐름:**

```
Frontend (한국 시간)
  ↓ convertLocalToUTC()
UTC 변환 후 API 요청
  ↓ buildDateRangeFilter()
Backend DB 쿼리 (UTC 범위)
  ↓ processEventList()
UTC → 한국 시간 변환
  ↓ API 응답
Frontend 화면 표시 (한국 시간)
```

**TDD 작성 순서:**

1. 테스트 코드 작성 (RED)
2. 최소 구현 (GREEN)
3. 리팩토링 (REFACTOR)
4. 모든 엣지 케이스 테스트 추가

**라이브러리:**

-   Frontend: `date-fns-tz`
-   Backend: `date-fns-tz`, `Intl API`

이 가이드를 통해 **UTC 기반 저장**과 **Locale별 조회/변환**을 안전하게 구현할 수 있습니다! 🚀
