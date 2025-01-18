'use client'
import { useState, useEffect } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
)

export default function StatisticsPage({
    visibleParts,
    visibleWorkers,
    visibleObjects,
    visibleRequisition,
    visibleHistoryReq,
    visibleOrders,
    visibleOperations
}) {
    // Парсим JSON данные
    const parts = JSON.parse(visibleParts)
    const workers = JSON.parse(visibleWorkers)
    const objects = JSON.parse(visibleObjects)
    const operations = JSON.parse(visibleOperations)
    const historyReq = JSON.parse(visibleHistoryReq)

    // Статистика по операциям
    const operationsStats = {
        'Ремонт': operations.filter(op => op.type === 'Ремонт').length,
        'Технический Осмотр': operations.filter(op => op.type === 'Технический Осмотр').length,
        'Техническое обслуживание': operations.filter(op => op.type === 'Техническое обслуживание').length,
        'Навигация': operations.filter(op => op.type === 'Навигация').length,
    }

    // Данные для графика операций
    const operationsChartData = {
        labels: Object.keys(operationsStats),
        datasets: [{
            label: 'Количество операций по типам',
            data: Object.values(operationsStats),
            backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
            ],
            borderWidth: 1,
        }]
    }

    // Статистика по запчастям
    const partsStats = historyReq.reduce((acc, req) => {
        if (!acc[req.objectID]) {
            acc[req.objectID] = {
                count: 0,
                parts: []
            }
        }
        acc[req.objectID].count++
        acc[req.objectID].parts.push(...req.parts)
        return acc
    }, {})

    return (
        <div className="statistics-container p-4">
            <h1 className="text-2xl font-bold mb-6">Статистика</h1>
            
            {/* Общая информация */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="stat-card p-4 bg-blue-100 rounded-lg">
                    <h3>Всего техники</h3>
                    <p className="text-2xl font-bold">{objects.length}</p>
                </div>
                <div className="stat-card p-4 bg-green-100 rounded-lg">
                    <h3>Всего работников</h3>
                    <p className="text-2xl font-bold">{workers.length}</p>
                </div>
                <div className="stat-card p-4 bg-yellow-100 rounded-lg">
                    <h3>Всего запчастей</h3>
                    <p className="text-2xl font-bold">{parts.length}</p>
                </div>
                <div className="stat-card p-4 bg-red-100 rounded-lg">
                    <h3>Всего операций</h3>
                    <p className="text-2xl font-bold">{operations.length}</p>
                </div>
            </div>

            {/* График операций */}
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Распределение операций</h2>
                <div className="h-[400px]">
                    <Bar 
                        data={operationsChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                        }}
                    />
                </div>
            </div>

            {/* Таблица топ-5 объектов по количеству операций */}
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Топ-5 объектов по обслуживанию</h2>
                <table className="w-full border-collapse border">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2">Объект</th>
                            <th className="border p-2">Количество операций</th>
                            <th className="border p-2">Количество запчастей</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(partsStats)
                            .sort((a, b) => b[1].count - a[1].count)
                            .slice(0, 5)
                            .map(([objectId, stats]) => {
                                const object = objects.find(obj => obj._id === objectId)
                                return (
                                    <tr key={objectId}>
                                        <td className="border p-2">{object?.name || 'Неизвестный объект'}</td>
                                        <td className="border p-2">{stats.count}</td>
                                        <td className="border p-2">{stats.parts.length}</td>
                                    </tr>
                                )
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}