# UTC와 유저 Locale 정보를 활용한 날짜/시간 조회 가이드

UTC와 유저 Locale 정보를 활용한 날짜/시간 조회 예시를 한국(KO) 유저가 목록을 조회하는 상황으로 설명합니다.

## 시나리오: 한국 유저의 이벤트 목록 조회

### 유저 정보

-   **Locale**: ko-KR
-   **Timezone**: Asia/Seoul (UTC+9)
-   **조회 기간**: 2025년 11월 24일 09:00 ~ 18:00 (한국 시간)

## Frontend (사용자 입력)

### 사용자 입력 데이터

```typescript
// 사용자가 DatePicker에서 선택한 시간 (한국 시간 기준)
const userInput = {
    fromDateTime: '2025-11-24 09:00', // 오전 9시
    toDateTime: '2025-11-24 18:00', // 오후 6시
};

const userTimezone = 'Asia/Seoul';
```

### Step 1: 로컬 시간을 UTC로 변환

```typescript
import { zonedTimeToUtc } from 'date-fns-tz';

// 한국 시간을 UTC로 변환 (API 요청용)
const fromDateTimeUTC = zonedTimeToUtc(new Date('2025-11-24 09:00'), 'Asia/Seoul').toISOString();
// 결과: "2025-11-24T00:00:00.000Z" (UTC)

const toDateTimeUTC = zonedTimeToUtc(new Date('2025-11-24 18:00'), 'Asia/Seoul').toISOString();
// 결과: "2025-11-24T09:00:00.000Z" (UTC)
```

### Step 2: API 호출

```typescript
const response = await fetch('/api/events/list', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        fromDateTime: fromDateTimeUTC, // UTC 전송
        toDateTime: toDateTimeUTC, // UTC 전송
        timezone: 'Asia/Seoul', // 유저 timezone 함께 전달
    }),
});

const events = await response.json();
```

## Backend (Node.js/Express)

```typescript
import { formatInTimeZone } from 'date-fns-tz';

router.post('/api/events/list', async (req, res) => {
    const { fromDateTime, toDateTime, timezone } = req.body;

    // Step 1: DB 쿼리 (UTC 기준으로 저장된 데이터)
    const events = await db.query(
        `
    SELECT 
      id, 
      title, 
      created_at  -- UTC로 저장됨
    FROM events
    WHERE created_at >= ? AND created_at <= ?
    ORDER BY created_at DESC
  `,
        [fromDateTime, toDateTime]
    );

    // Result 예시:
    // [
    //   { id: 1, title: "Morning Meeting", created_at: "2025-11-24T01:30:00.000Z" },
    //   { id: 2, title: "Lunch Break", created_at: "2025-11-24T04:00:00.000Z" },
    //   { id: 3, title: "Afternoon Review", created_at: "2025-11-24T07:15:00.000Z" }
    // ]

    // Step 2: UTC 시간을 유저의 timezone으로 변환
    const formattedEvents = events.map((event) => ({
        ...event,
        // UTC를 한국 시간으로 변환
        displayTime: formatInTimeZone(new Date(event.created_at), timezone, 'yyyy-MM-dd HH:mm:ss'),
        // 원본 UTC도 함께 전달 (필요시)
        utcTime: event.created_at,
    }));

    // Result:
    // [
    //   {
    //     id: 1,
    //     title: "Morning Meeting",
    //     created_at: "2025-11-24T01:30:00.000Z",
    //     displayTime: "2025-11-24 10:30:00",  // 한국 시간
    //     utcTime: "2025-11-24T01:30:00.000Z"
    //   },
    //   {
    //     id: 2,
    //     title: "Lunch Break",
    //     displayTime: "2025-11-24 13:00:00",
    //     ...
    //   }
    // ]

    res.json({
        events: formattedEvents,
        timezone: timezone,
        count: formattedEvents.length,
    });
});
```

## Frontend (화면 표시)

```typescript
const EventList = () => {
    const [events, setEvents] = useState([]);
    const { timezone } = useLocale(); // 'Asia/Seoul'

    // API 응답을 받아서 바로 표시
    useEffect(() => {
        // ... fetch logic
        setEvents(response.events);
    }, []);

    return (
        <div>
            <h2>이벤트 목록 (한국 시간 기준)</h2>
            {events.map((event) => (
                <div key={event.id} className="event-card">
                    <h3>{event.title}</h3>
                    {/* Backend에서 변환된 시간을 그대로 표시 */}
                    <p>시간: {event.displayTime}</p>
                </div>
            ))}
        </div>
    );
};
```

## 전체 흐름 요약

```
[Frontend - 한국 유저]
2025-11-24 09:00 (KST)
        ↓ zonedTimeToUtc()
2025-11-24T00:00:00Z (UTC)
        ↓ API Request

[Backend - DB Query]
WHERE created_at >= '2025-11-24T00:00:00Z'
  AND created_at <= '2025-11-24T09:00:00Z'
        ↓ Query Result (UTC)
[
  { created_at: "2025-11-24T01:30:00Z" },  // UTC
  { created_at: "2025-11-24T04:00:00Z" }
]
        ↓ formatInTimeZone()
[
  { displayTime: "2025-11-24 10:30:00" },  // KST
  { displayTime: "2025-11-24 13:00:00" }
]
        ↓ API Response

[Frontend - Display]
"2025-11-24 10:30:00" (한국 시간으로 표시)
```

## 핵심 포인트

-   **DB는 항상 UTC로 저장**: `created_at` TIMESTAMP 컬럼은 UTC로 저장
-   **API 요청도 UTC로**: Frontend가 UTC로 변환해서 전송
-   **Backend가 변환 책임**: 유저의 timezone 정보로 표시용 시간 변환
-   **Frontend는 표시만**: 변환된 `displayTime`을 그대로 렌더링

이렇게 하면 전 세계 어디에 있든 각 유저가 자신의 시간대로 정확한 시간을 볼 수 있습니다! 🌏
