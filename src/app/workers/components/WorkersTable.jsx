'use client'

import '../scss/workersTable.scss'
import { useState, useEffect } from 'react'
import RateWorkerModal from './RateWorkerModal'
import RatingHistoryModal from './RatingHistoryModal'
import axios from 'axios'

export default function WorkersTable({ workers, onEdit, onDelete, onRate, periodStart, periodEnd }) {
    const [processedWorkers, setProcessedWorkers] = useState([])
    const [ratingWorker, setRatingWorker] = useState(null)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [selectedWorkerHistory, setSelectedWorkerHistory] = useState(null)

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

    const handleRate = async (workerId, ktu, date, comment) => {
        try {
            await onRate(workerId, ktu, date, comment)
            // Отправляем уведомление в Telegram
            const worker = workers.find(w => w._id === workerId)
           
        } catch (error) {
            console.error('Error in WorkersTable handleRate:', error)
        }
    }

    // Обновляем обработчик для показа истории
    const handleShowHistory = async (worker) => {
        setSelectedWorkerHistory(worker)
        setShowHistoryModal(true)
        
        // Отправляем уведомление в Telegram при просмотре истории
        try {
            
        } catch (error) {
            console.error('Failed to send notification:', error)
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
                                <div className="table-responsive">
                                    <table className="workers-table">
                                        <thead>
                                            <tr>
                                                <th>ФИО</th>
                                                <th>Должность</th>
                                                <th>Телефон</th>
                                                <th>Email</th>
                                                <th>КТУ за период</th>
                                                <th>Последний комментарий</th>
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
                                                                !worker.averageKtu ? 'ktu-base' : 
                                                                worker.averageKtu >= 1.1 ? 'ktu-excellent' : 
                                                                worker.averageKtu >= 0.5 ? 'ktu-good' :
                                                                worker.averageKtu >= 0.1 ? 'ktu-base' : 'ktu-low'
                                                            }`}>
                                                                КТУ: {worker.averageKtu?.toFixed(2) || 1.0}
                                                            </span>
                                                            <button
                                                                className="rate-button"
                                                                onClick={() => setRatingWorker(worker)}
                                                            >
                                                                Установить КТУ
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="comment-cell">
                                                        {worker.periodRatings && worker.periodRatings.length > 0 ? (
                                                            <div className="rating-history">
                                                                <div className="latest-comment">
                                                                    <span className="comment-date">
                                                                        {new Date(worker.periodRatings[worker.periodRatings.length - 1].date)
                                                                            .toLocaleDateString('ru')}:
                                                                    </span>
                                                                    <span className="comment-text">
                                                                        {worker.periodRatings[worker.periodRatings.length - 1].comment}
                                                                    </span>
                                                                </div>
                                                                {worker.periodRatings.length > 1 && (
                                                                    <button 
                                                                        className="show-history-button"
                                                                        onClick={() => handleShowHistory(worker)}
                                                                    >
                                                                        История КТУ
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="no-comments">Нет комментариев</span>
                                                        )}
                                                    </td>
                                                    <td className="actions-cell">
                                                        <button onClick={() => onEdit(worker)}>✏️</button>
                                                        <button onClick={() => onDelete(worker._id)}>🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}

            {ratingWorker && (
                <RateWorkerModal
                    isOpen={!!ratingWorker}
                    onClose={() => setRatingWorker(null)}
                    onRate={handleRate}
                    worker={ratingWorker}
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                />
            )}

            <RatingHistoryModal
                isOpen={showHistoryModal}
                onClose={() => {
                    setShowHistoryModal(false)
                    setSelectedWorkerHistory(null)
                }}
                ratings={selectedWorkerHistory?.periodRatings || []}
                workerName={selectedWorkerHistory?.name}
            />
        </>
    )
} 