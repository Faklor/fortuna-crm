'use client'

import '../scss/workersTable.scss'
import { useState, useEffect } from 'react'
import RateWorkerModal from './RateWorkerModal'

export default function WorkersTable({ workers, onEdit, onDelete, onRate, periodStart, periodEnd }) {
    const [processedWorkers, setProcessedWorkers] = useState([])
    const [ratingWorker, setRatingWorker] = useState(null)

    // Функция расчета среднего КТУ
    const calculateAverageKTU = (ratings) => {
        if (!ratings || ratings.length === 0) return 0
        return ratings.reduce((sum, rating) => sum + rating.ktu, 0) / ratings.length
    }

    // Обработка работников при изменении props
    useEffect(() => {
        processWorkersData(workers)
    }, [workers])

    // Выносим обработку данных в отдельную функцию
    const processWorkersData = (workersData) => {
        const processed = workersData.map(worker => {
            // Фильтруем рейтинги за текущий период
            const periodRatings = worker.ratings?.filter(rating => {
                const ratingDate = new Date(rating.date)
                return ratingDate >= periodStart && ratingDate <= periodEnd
            }) || []

            // Рассчитываем средний КТУ за период
            const averageKtu = calculateAverageKTU(periodRatings)

            return {
                ...worker,
                periodRatings,
                averageKtu
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

    const handleRate = async (workerId, ktu, date) => {
        try {
            await onRate(workerId, ktu, date)
        } catch (error) {
            console.error('Error in WorkersTable handleRate:', error)
        }
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
                                            <th>КТУ за период</th>
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
                                                        <span className={`ktu-value ${
                                                            !worker.averageKtu ? 'ktu-min' : 
                                                            worker.averageKtu >= 1.8 ? 'ktu-max' : 
                                                            worker.averageKtu >= 1.5 ? 'ktu-high' :
                                                            worker.averageKtu >= 1.0 ? 'ktu-mid' : 'ktu-low'
                                                        }`}>
                                                            КТУ: {worker.averageKtu?.toFixed(2) || 0}
                                                        </span>
                                                        <button
                                                            className="rate-button"
                                                            onClick={() => setRatingWorker(worker)}
                                                        >
                                                            Установить КТУ
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
                disabledDates={ratingWorker?.periodRatings?.map(rating => new Date(rating.date)) || []}
            />
        </>
    )
} 