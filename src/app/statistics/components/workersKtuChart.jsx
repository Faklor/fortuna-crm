'use client'
import '../scss/workersKtu.scss'
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

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)

export default function WorkersKtuChart({ workers, ratings, startDate, endDate }) {
    // Форматируем период для заголовка
    const formatPeriod = () => {
        return `${startDate.toLocaleDateString('ru', { month: 'long', year: 'numeric' })} - ${endDate.toLocaleDateString('ru', { month: 'long', year: 'numeric' })}`
    }

    const options = {
        responsive: true,
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
                        const worker = sortedWorkers[context.dataIndex]
                        const value = context.raw || 0
                        let label = `Средний КТУ: ${value.toFixed(2)}`
                        if (worker?.position) {
                            label += `\nДолжность: ${worker.position}`
                        }
                        if (worker?.organization) {
                            label += `\nОрганизация: ${worker.organization}`
                        }
                        return label
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 1.5,
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

    // Подготавливаем данные работников
    const workersWithKtu = workers.map(worker => {
        // Фильтруем рейтинги для работника за указанный период
        const workerRatings = ratings.filter(rating => {
            const ratingDate = new Date(rating.date)
            return rating.workerId === worker._id && 
                   ratingDate >= startDate &&
                   ratingDate <= endDate
        })
        
        // Если есть рейтинги за период, вычисляем средний КТУ
        if (workerRatings.length > 0) {
            const averageKtu = workerRatings.reduce((sum, rating) => sum + rating.ktu, 0) / workerRatings.length
            
            return {
                ...worker,
                ktu: averageKtu,
                ratings: workerRatings, // сохраняем все рейтинги за период
                lastComment: workerRatings[workerRatings.length - 1]?.comment,
                lastRatingDate: workerRatings[workerRatings.length - 1]?.date
            }
        }
        
        return {
            ...worker,
            ktu: 0,
            ratings: [],
            lastComment: null,
            lastRatingDate: null
        }
    })

    // Сортируем работников по КТУ (только тех, у кого есть КТУ за период)
    const sortedWorkers = [...workersWithKtu]
        .filter(worker => worker.ktu > 0)
        .sort((a, b) => b.ktu - a.ktu)

    const data = {
        labels: sortedWorkers.map(worker => worker.name),
        datasets: [
            {
                label: 'КТУ за период',
                data: sortedWorkers.map(worker => worker.ktu || 0),
                backgroundColor: sortedWorkers.map(worker => {
                    const ktu = worker.ktu || 0
                    if (ktu >= 1.1) return 'rgba(75, 192, 192, 0.8)'  // Зеленый
                    if (ktu >= 0.7) return 'rgba(54, 162, 235, 0.8)'  // Синий
                    if (ktu >= 0.3) return 'rgba(255, 206, 86, 0.8)'  // Желтый
                    return 'rgba(255, 99, 132, 0.8)'                  // Красный
                }),
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }
        ]
    }

    return (
        <div className="workers-ktu">
            <div className="chart-container">
                <Bar options={options} data={data} />
            </div>
            <div className="chart-legend">
                <div className="legend-item">
                    <span className="color-box" style={{backgroundColor: 'rgba(75, 192, 192, 0.8)'}}></span>
                    <span>Отличный КТУ (1.1-1.5)</span>
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
            <div className="workers-list">
                <h3>Список сотрудников</h3>
                {/* Группируем работников по организациям */}
                {Object.entries(
                    sortedWorkers.reduce((acc, worker) => {
                        const org = worker.organization || 'Без организации'
                        if (!acc[org]) acc[org] = []
                        acc[org].push(worker)
                        return acc
                    }, {})
                ).map(([org, workers]) => (
                    <div key={org} className="organization-group">
                        <h4>{org}</h4>
                        {workers.map(worker => (
                            <div key={worker._id} className="worker-item">
                                <span className="worker-name">{worker.name}</span>
                                <span className="worker-position">({worker.position})</span>
                                <span className={`worker-ktu ${
                                    worker.ktu >= 1.1 ? 'excellent' :
                                    worker.ktu >= 0.7 ? 'good' :
                                    worker.ktu >= 0.3 ? 'average' :
                                    'low'
                                }`}>
                                    {worker.ktu?.toFixed(2) || 'Н/Д'}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
} 