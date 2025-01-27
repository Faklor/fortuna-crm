'use client'
import { useState, useEffect } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import RatingHistoryModal from './RatingHistoryModal'
import '../scss/workersCharts.scss'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)

export default function WorkersCharts({ workers, periodStart, periodEnd }) {
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [selectedWorker, setSelectedWorker] = useState(null)

    // Форматируем период для заголовка
    const formatPeriod = () => {
        const start = new Date(periodStart)
        const end = new Date(periodEnd)
        return `${start.toLocaleDateString('ru', { month: 'long', year: 'numeric' })} - ${end.toLocaleDateString('ru', { month: 'long', year: 'numeric' })}`
    }

    const handleChartClick = (event, elements) => {
        if (elements.length > 0) {
            const index = elements[0].index
            const worker = sortedWorkers[index]
            setSelectedWorker(worker)
            setShowHistoryModal(true)
        }
    }

    const options = {
        responsive: true,
        onClick: handleChartClick, // Добавляем обработчик клика
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `КТУ сотрудников за ${formatPeriod()}`
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const worker = workers[context.dataIndex];
                        const value = context.raw || 0;
                        let label = `КТУ: ${value.toFixed(2)}`;
                        
                        // Добавляем последний комментарий, если он есть
                        if (worker.periodRatings && worker.periodRatings.length > 0) {
                            const lastRating = worker.periodRatings[worker.periodRatings.length - 1];
                            label += `\nПоследний комментарий: ${lastRating.comment}`;
                            label += `\nДата: ${new Date(lastRating.date).toLocaleDateString('ru')}`;
                        }
                        
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 1.3,
                ticks: {
                    stepSize: 0.1
                },
                title: {
                    display: true,
                    text: 'КТУ'
                }
            }
        }
    }

    // Сортируем работников по КТУ для графика
    const sortedWorkers = [...workers].sort((a, b) => (b.averageKtu || 0) - (a.averageKtu || 0))

    const data = {
        labels: sortedWorkers.map(worker => worker.name),
        datasets: [
            {
                label: 'КТУ за период',
                data: sortedWorkers.map(worker => worker.averageKtu || 0),
                backgroundColor: sortedWorkers.map(worker => {
                    const ktu = worker.averageKtu || 0
                    if (ktu >= 1.1) return 'rgba(75, 192, 192, 0.8)'
                    if (ktu >= 0.7) return 'rgba(54, 162, 235, 0.8)'
                    if (ktu >= 0.3) return 'rgba(255, 206, 86, 0.8)'
                    return 'rgba(255, 99, 132, 0.8)'
                }),
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }
        ],
    }

    return (
        <div className="workers-charts">
            <div className="chart-container">
                <Bar options={options} data={data} />
            </div>
            <div className="chart-legend">
                <div className="legend-item">
                    <span className="color-box" style={{backgroundColor: 'rgba(75, 192, 192, 0.8)'}}></span>
                    <span>Отличный КТУ (1.1-1.3)</span>
                </div>
                <div className="legend-item">
                    <span className="color-box" style={{backgroundColor: 'rgba(54, 162, 235, 0.8)'}}></span>
                    <span>Хороший КТУ (0.7-1.09)</span>
                </div>
                <div className="legend-item">
                    <span className="color-box" style={{backgroundColor: 'rgba(255, 206, 86, 0.8)'}}></span>
                    <span>Базовый КТУ (0.3-0.69)</span>
                </div>
                <div className="legend-item">
                    <span className="color-box" style={{backgroundColor: 'rgba(255, 99, 132, 0.8)'}}></span>
                    <span>Низкий КТУ (менее 0.3)</span>
                </div>
            </div>

            {/* Добавляем модальное окно истории */}
            <RatingHistoryModal
                isOpen={showHistoryModal}
                onClose={() => {
                    setShowHistoryModal(false)
                    setSelectedWorker(null)
                }}
                ratings={selectedWorker?.periodRatings || []}
                workerName={selectedWorker?.name}
            />
        </div>
    )
} 
