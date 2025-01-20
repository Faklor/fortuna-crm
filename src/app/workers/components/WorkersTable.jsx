'use client'

import '../scss/workersTable.scss'
import { useState, useEffect } from 'react'
import RateWorkerModal from './RateWorkerModal'

export default function WorkersTable({ workers, onEdit, onDelete, onRate, periodStart, periodEnd }) {
    const [processedWorkers, setProcessedWorkers] = useState([])
    const [ratingWorker, setRatingWorker] = useState(null)

    // Обработка работников при изменении props
    useEffect(() => {
        processWorkersData(workers)
    }, [workers])

    // Выносим обработку данных в отдельную функцию
    const processWorkersData = (workersData) => {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const processed = workersData.map(worker => {
            const monthlyRatings = worker.ratings?.filter(rating => {
                const ratingDate = new Date(rating.date)
                return ratingDate >= startOfMonth && ratingDate <= endOfMonth
            }) || []

            const monthlyLikes = monthlyRatings.filter(r => r.type === 'like').length
            const monthlyDislikes = monthlyRatings.filter(r => r.type === 'dislike').length

            return {
                ...worker,
                monthlyLikes,
                monthlyDislikes,
                monthlyRating: monthlyLikes - monthlyDislikes
            }
        })

        setProcessedWorkers(processed)
    }

    // Сначала группируем по организации
    const groupedByOrganization = workers.reduce((acc, worker) => {
        const key = worker.organization || 'Без организации'
        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(worker)
        return acc
    }, {})

    // Внутри каждой организации группируем по должности
    Object.keys(groupedByOrganization).forEach(org => {
        groupedByOrganization[org] = groupedByOrganization[org].reduce((acc, worker) => {
            const key = worker.position || 'Без должности'
            if (!acc[key]) {
                acc[key] = []
            }
            acc[key].push(worker)
            return acc
        }, {})

        // Сортируем работников по алфавиту внутри каждой должности
        Object.keys(groupedByOrganization[org]).forEach(position => {
            groupedByOrganization[org][position].sort((a, b) => a.name.localeCompare(b.name))
        })
    })

    // Сортируем организации по алфавиту
    const sortedOrganizations = Object.keys(groupedByOrganization).sort((a, b) => a.localeCompare(b))

    const handleRate = async (workerId, type, date) => {
        try {
            await onRate(workerId, type, date)
        } catch (error) {
            console.error('Error in WorkersTable handleRate:', error)
        }
    }

    // Форматируем период для отображения
    const formatPeriod = () => {
        const start = new Date(periodStart)
        const end = new Date(periodEnd)
        return `${start.toLocaleDateString('ru', { month: 'long', year: 'numeric' })} - ${end.toLocaleDateString('ru', { month: 'long', year: 'numeric' })}`
    }

    return (
        <>
            {sortedOrganizations.map(org => {
                const totalWorkers = Object.values(groupedByOrganization[org])
                    .reduce((total, positions) => total + positions.length, 0);
                    
                return (
                    <div key={org} className="organization-section">
                        <h2 className="organization-title">
                            {org}
                            <span className="worker-count">
                                {totalWorkers} сотрудник{totalWorkers > 1 ? (totalWorkers < 5 ? 'а' : 'ов') : ''}
                            </span>
                        </h2>
                        {Object.keys(groupedByOrganization[org]).sort().map(position => (
                            <div key={`${org}-${position}`} className="position-section">
                                <h3 className="position-title">
                                    {position}
                                    <span className="worker-count">
                                        {groupedByOrganization[org][position].length} сотрудник
                                        {groupedByOrganization[org][position].length > 1 ? 
                                            (groupedByOrganization[org][position].length < 5 ? 'а' : 'ов') : ''}
                                    </span>
                                </h3>
                                <table className="workers-table">
                                    <thead>
                                        <tr>
                                            <th>ФИО</th>
                                            <th>Должность</th>
                                            <th>Телефон</th>
                                            <th>Email</th>
                                            <th>Рейтинг за период</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedByOrganization[org][position].map(worker => (
                                            <tr key={worker._id}>
                                                <td>{worker.name}</td>
                                                <td>{worker.position}</td>
                                                <td>{worker.phone}</td>
                                                <td>{worker.email}</td>
                                                <td>
                                                    <div className="rating-cell">
                                                        <span>
                                                            {worker.periodRating} 
                                                            (👍 {worker.periodLikes} / 
                                                            👎 {worker.periodDislikes})
                                                        </span>
                                                        <button
                                                            className="rate-button"
                                                            onClick={() => setRatingWorker(worker)}
                                                        >
                                                            Оценить
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button onClick={() => onEdit(worker)}>Редактировать</button>
                                                    <button onClick={() => onDelete(worker._id)}>Удалить</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                );
            })}

            <RateWorkerModal
                isOpen={!!ratingWorker}
                onClose={() => setRatingWorker(null)}
                onRate={handleRate}
                worker={ratingWorker}
                disabledDates={ratingWorker?.ratings?.map(rating => new Date(rating.date)) || []}
            />
        </>
    )
} 