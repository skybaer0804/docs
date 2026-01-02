import { useEffect, useRef, useState } from 'preact/hooks';
import ApexCharts from 'apexcharts';
import { fetchStudyStats } from '../../utils/api';
import { useTheme } from '../../contexts/ThemeContext';
import './StudyOverview.scss';

export const StudyOverview = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const { theme } = useTheme();
    const [days, setDays] = useState(14);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const stats = await fetchStudyStats(days);

            const labels = [];
            const values = [];

            // 현재 시간을 기준으로 오늘 날짜의 00:00:00을 구함
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 과거부터 현재까지 순차적으로 14일(또는 7일) 데이터셋 생성
            for (let i = days - 1; i >= 0; i--) {
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() - i);

                const year = targetDate.getFullYear();
                const month = String(targetDate.getMonth() + 1).padStart(2, '0');
                const day = String(targetDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                // 라벨은 MM-DD 형식
                labels.push(`${month}-${day}`);

                // 데이터 가공: 초 -> 분 변환 후 분 미만 절삭(Math.floor)
                const totalSeconds = stats[dateStr] || 0;
                const minutes = Math.floor(totalSeconds / 60);
                values.push(minutes);
            }

            const options = {
                chart: {
                    type: 'bar',
                    height: 350,
                    toolbar: { show: false },
                    animations: { enabled: true },
                    background: 'transparent',
                    foreColor: theme === 'dark' ? '#b0b0b0' : '#333'
                },
                series: [{
                    name: '공부 시간 (분)',
                    data: values
                }],
                xaxis: {
                    categories: labels,
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    title: {
                        text: '분 (min)',
                        style: { color: theme === 'dark' ? '#b0b0b0' : '#333' }
                    },
                    min: 0,
                    labels: {
                        formatter: (val) => Math.floor(val),
                        style: { colors: theme === 'dark' ? '#b0b0b0' : '#333' }
                    }
                },
                fill: {
                    opacity: 1,
                    colors: ['#4caf50']
                },
                dataLabels: { enabled: false },
                grid: {
                    borderColor: theme === 'dark' ? '#333' : '#e0e0e0',
                    strokeDashArray: 4
                },
                tooltip: {
                    theme: theme,
                    y: {
                        formatter: (val) => val + ' min'
                    }
                },
                theme: {
                    mode: theme
                },
                plotOptions: {
                    bar: {
                        borderRadius: 4,
                        columnWidth: '60%'
                    }
                }
            };

            if (chartInstance.current) {
                chartInstance.current.updateOptions(options);
            } else if (chartRef.current) {
                chartInstance.current = new ApexCharts(chartRef.current, options);
                chartInstance.current.render();
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
    }, [days, theme]);

    useEffect(() => {
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, []);

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

            <div className="study-overview__chart-container">
                {loading && !chartInstance.current && (
                    <div className="study-overview__loading">데이터 분석 중...</div>
                )}
                {error && <div className="study-overview__error">{error}</div>}
                <div ref={chartRef} className="study-overview__chart-render"></div>
            </div>
        </div>
    );
};
