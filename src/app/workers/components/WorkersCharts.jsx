'use client'
import { useState } from 'react'
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

export default function WorkersCharts({ workers, ratingPeriod }) {
    const [selectedPosition, setSelectedPosition] = useState('all') // 'all' или конкретная должность

    // Получаем список уникальных должностей
    const positions = [...new Set(workers.map(w => w.position))]

    // Фильтруем работников по выбранной должности
    const filteredWorkers = selectedPosition === 'all' 
        ? workers 
        : workers.filter(w => w.position === selectedPosition)

    // Данные для диаграммы
    const chartData = {
        labels: filteredWorkers.map(w => w.name),
        datasets: [{
            label: selectedPosition === 'all' 
                ? 'Общий рейтинг сотрудников' 
                : `Рейтинг: ${selectedPosition}`,
            data: filteredWorkers.map(w => w.rating),
            backgroundColor: filteredWorkers.map(w => 
                w.rating >= 0 ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 99, 132, 0.5)'
            ),
            borderColor: filteredWorkers.map(w => 
                w.rating >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
            ),
            borderWidth: 1,
        }]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        }
    }

    return (
        <div className="charts-container">
            <div className="charts-header">
                <h2>
                    {selectedPosition === 'all' 
                        ? 'Общий рейтинг сотрудников' 
                        : `Рейтинг сотрудников: ${selectedPosition}`}
                </h2>
                <select 
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                >
                    <option value="all">Все сотрудники</option>
                    {positions.map(position => (
                        <option key={position} value={position}>
                            {position}
                        </option>
                    ))}
                </select>
            </div>
            <div className="chart-wrapper">
                <Bar 
                    data={chartData}
                    options={chartOptions}
                />
            </div>
        </div>
    )
} 