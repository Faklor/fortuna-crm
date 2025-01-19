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

export default function WorkersCharts({ workers, ratingPeriod }) {
    const [selectedFilter, setSelectedFilter] = useState('all') // 'all', 'position', 'organization'
    const [selectedValue, setSelectedValue] = useState('all')
    const [positions, setPositions] = useState([])
    const [organizations, setOrganizations] = useState([])

    // Нормализация названия организации
    const normalizeOrganizationName = (name) => {
        return name.trim().toLowerCase();
    }

    // Получаем списки уникальных должностей и организаций
    useEffect(() => {
        setPositions([...new Set(workers.map(w => w.position))])
        
        // Получаем уникальные организации с учетом нормализации
        const uniqueOrgs = [...new Set(workers.map(w => normalizeOrganizationName(w.organization)))]
            .map(normalizedName => {
                const worker = workers.find(w => normalizeOrganizationName(w.organization) === normalizedName);
                return worker.organization;
            });
        setOrganizations(uniqueOrgs);
    }, [workers])

    // Фильтруем работников
    const filteredWorkers = (() => {
        if (selectedFilter === 'all') return workers
        if (selectedFilter === 'position') {
            return selectedValue === 'all' 
                ? workers 
                : workers.filter(w => w.position === selectedValue)
        }
        if (selectedFilter === 'organization') {
            return selectedValue === 'all' 
                ? workers 
                : workers.filter(w => normalizeOrganizationName(w.organization) === normalizeOrganizationName(selectedValue))
        }
        return workers
    })()

    const chartData = {
        labels: filteredWorkers.map(w => w.name),
        datasets: [
            {
                label: 'Рейтинг',
                data: filteredWorkers.map(w => w.rating),
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1,
            }
        ]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Рейтинг сотрудников'
            }
        }
    }

    const getTitle = () => {
        if (selectedFilter === 'all') return 'Общий рейтинг сотрудников'
        if (selectedFilter === 'position') {
            return selectedValue === 'all' 
                ? 'Рейтинг по всем должностям' 
                : `Рейтинг сотрудников: ${selectedValue}`
        }
        if (selectedFilter === 'organization') {
            return selectedValue === 'all' 
                ? 'Рейтинг по всем организациям' 
                : `Рейтинг сотрудников: ${selectedValue}`
        }
        return 'Рейтинг сотрудников'
    }

    return (
        <div className="charts-container">
            <div className="charts-header">
                <h2>{getTitle()}</h2>
                <div className="filter-controls">
                    <select 
                        value={selectedFilter}
                        onChange={(e) => {
                            setSelectedFilter(e.target.value)
                            setSelectedValue('all')
                        }}
                        className="filter-select"
                    >
                        <option value="all">Все сотрудники</option>
                        <option value="position">По должности</option>
                        <option value="organization">По организации</option>
                    </select>

                    {selectedFilter !== 'all' && (
                        <select 
                            value={selectedValue}
                            onChange={(e) => setSelectedValue(e.target.value)}
                            className="value-select"
                        >
                            <option value="all">
                                Все {selectedFilter === 'position' ? 'должности' : 'организации'}
                            </option>
                            {(selectedFilter === 'position' ? positions : organizations).map(value => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
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
