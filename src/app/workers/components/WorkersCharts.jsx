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
                display: false,
               
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    }

    const data = {
        labels: workers.map(worker => worker.name),
        datasets: [
            {
                label: 'Рейтинг',
                data: workers.map(worker => worker.periodRating || 0),
                backgroundColor: 'rgba(53, 162, 235, 0.8)',
            },
        ],
    }

    return (
        <div className="workers-charts">
            <h2>Рейтинг сотрудников за {formatPeriod()}</h2>
            <div className="chart-container">
                <Bar options={options} data={data} />
            </div>
        </div>
    )
} 
