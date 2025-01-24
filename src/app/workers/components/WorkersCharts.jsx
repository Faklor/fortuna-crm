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
    // Форматируем период для заголовка
    const formatPeriod = () => {
        const start = new Date(periodStart)
        const end = new Date(periodEnd)
        return `${start.toLocaleDateString('ru', { month: 'long', year: 'numeric' })} - ${end.toLocaleDateString('ru', { month: 'long', year: 'numeric' })}`
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
                        const value = context.raw || 0
                        return `КТУ: ${value.toFixed(2)}`
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 2,
                ticks: {
                    stepSize: 0.2
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
                    if (ktu >= 1.8) return 'rgba(75, 192, 192, 0.8)' // Зеленый для высокого КТУ (1.8-2.0)
                    if (ktu >= 1.5) return 'rgba(54, 162, 235, 0.8)' // Синий для хорошего КТУ (1.5-1.79)
                    if (ktu >= 1.0) return 'rgba(255, 206, 86, 0.8)' // Желтый для среднего КТУ (1.0-1.49)
                    return 'rgba(255, 99, 132, 0.8)' // Красный для низкого КТУ (<1.0)
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
                    <span>Высокий КТУ (1.8-2.0)</span>
                </div>
                <div className="legend-item">
                    <span className="color-box" style={{backgroundColor: 'rgba(54, 162, 235, 0.8)'}}></span>
                    <span>Хороший КТУ (1.5-1.79)</span>
                </div>
                <div className="legend-item">
                    <span className="color-box" style={{backgroundColor: 'rgba(255, 206, 86, 0.8)'}}></span>
                    <span>Средний КТУ (1.0-1.49)</span>
                </div>
                <div className="legend-item">
                    <span className="color-box" style={{backgroundColor: 'rgba(255, 99, 132, 0.8)'}}></span>
                    <span>Низкий КТУ (менее 1.0)</span>
                </div>
            </div>
        </div>
    )
} 
