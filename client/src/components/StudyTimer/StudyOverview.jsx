import { useEffect, useRef, useState } from 'preact/hooks';
import { Chart } from 'frappe-charts/dist/frappe-charts.min.esm';
import { fetchStudyStats } from '../../utils/api';
import './StudyOverview.scss';

export const StudyOverview = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [days, setDays] = useState(14);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const stats = await fetchStudyStats(days);
            
            // 최근 날짜들 생성 (데이터가 없는 날도 표시하기 위함)
            const labels = [];
            const values = [];
            const now = new Date();
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                // 표시용 라벨 (MM-DD)
                labels.push(dateStr.substring(5));
                
                // 초 단위를 시간 단위로 변환 (소수점 1자리)
                const hours = stats[dateStr] ? parseFloat((stats[dateStr] / 3600).toFixed(1)) : 0;
                values.push(hours);
            }

            const data = {
                labels: labels,
                datasets: [
                    {
                        name: "공부 시간 (시간)",
                        type: "bar",
                        values: values
                    }
                ]
            };

            if (chartInstance.current) {
                chartInstance.current.update(data);
            } else if (chartRef.current) {
                chartInstance.current = new Chart(chartRef.current, {
                    title: "일자별 공부 시간",
                    data: data,
                    type: 'bar',
                    height: 300,
                    colors: ['#4caf50'],
                    axisOptions: {
                        xAxisMode: 'tick',
                        yAxisMode: 'span',
                        xIsSeries: 1
                    },
                    barOptions: {
                        spaceRatio: 0.5
                    },
                    tooltipOptions: {
                        formatTooltipY: d => d + ' hrs'
                    }
                });
            }
        } catch (err) {
            console.error('Failed to load chart data:', err);
            setError('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [days]);

    return (
        <div className="study-overview">
            <div className="study-overview__header">
                <h3 className="study-overview__title">공부 통계</h3>
                <select 
                    className="study-overview__select" 
                    value={days} 
                    onChange={(e) => setDays(parseInt(e.target.value))}
                >
                    <option value={7}>최근 7일</option>
                    <option value={14}>최근 14일</option>
                </select>
            </div>

            {loading && !chartInstance.current ? (
                <div className="study-overview__loading">로딩 중...</div>
            ) : error ? (
                <div className="study-overview__error">{error}</div>
            ) : (
                <div className="study-overview__chart-container">
                    <div ref={chartRef}></div>
                </div>
            )}
        </div>
    );
};

