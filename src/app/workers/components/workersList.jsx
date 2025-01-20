'use client'
import '../scss/workersList.scss'
import { useState, useEffect } from 'react'
import WorkersTable from './WorkersTable'
import WorkersCharts from './WorkersCharts'
import AddWorkerModal from './AddWorkerModal'
import EditWorkerModal from './EditWorkerModal'
import DatePicker from 'react-datepicker'
import { registerLocale } from 'react-datepicker'
import ru from 'date-fns/locale/ru'
import "react-datepicker/dist/react-datepicker.css"

// Регистрируем русскую локаль
registerLocale('ru', ru)

export default function WorkersList({ visibleWorkers, initialStartDate, initialEndDate }) {
    const [workers, setWorkers] = useState([])
    const [editingWorker, setEditingWorker] = useState(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [startDate, setStartDate] = useState(new Date(initialStartDate))
    const [endDate, setEndDate] = useState(new Date(initialEndDate))
    const [processedWorkers, setProcessedWorkers] = useState([])

    useEffect(() => {
        const parsedWorkers = JSON.parse(visibleWorkers)
        setWorkers(parsedWorkers)
        processWorkersData(parsedWorkers, startDate, endDate)
    }, [visibleWorkers, startDate, endDate])

    const processWorkersData = (workersData, start, end) => {
        const processed = workersData.map(worker => {
            const periodRatings = worker.ratings.filter(rating => {
                const ratingDate = new Date(rating.date)
                return ratingDate >= start && ratingDate <= end
            })

            const periodLikes = periodRatings.filter(r => r.type === 'like').length
            const periodDislikes = periodRatings.filter(r => r.type === 'dislike').length

            return {
                ...worker,
                periodLikes,
                periodDislikes,
                periodRating: periodLikes - periodDislikes
            }
        })

        setProcessedWorkers(processed)
    }

    const handlePeriodChange = (dates) => {
        const [start, end] = dates
        if (start) {
            // Устанавливаем дату на первое число выбранного месяца
            const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1)
            setStartDate(startOfMonth)
        }
        if (end) {
            // Устанавливаем дату на первое число следующего месяца минус 1 день
            const endOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0)
            setEndDate(endOfMonth)
        }
        if (start && end) {
            const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1)
            const endOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0)
            processWorkersData(workers, startOfMonth, endOfMonth)
        }
    }

    const loadWorkers = async () => {
        try {
            const response = await fetch('/api/workers/with-ratings')
            if (response.ok) {
                const data = await response.json()
                setWorkers(data)
            }
        } catch (error) {
            console.error('Error loading workers:', error)
        }
    }

    const handleAddWorker = async (workerData) => {
        try {
            const response = await fetch('/api/workers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workerData)
            })
            if (response.ok) {
                await loadWorkers()
                setShowAddForm(false)
            }
        } catch (error) {
            console.error('Error adding worker:', error)
        }
    }

    const handleEditWorker = async (workerData) => {
        try {
            const response = await fetch(`/api/workers/${workerData._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workerData)
            })
            if (response.ok) {
                await loadWorkers()
                setEditingWorker(null)
            }
        } catch (error) {
            console.error('Error editing worker:', error)
        }
    }

    const handleDeleteWorker = async (workerId) => {
        try {
            const response = await fetch(`/api/workers/${workerId}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                await loadWorkers()
            }
        } catch (error) {
            console.error('Error deleting worker:', error)
        }
    }

    const handleRate = async (workerId, type, date) => {
        try {
            const response = await fetch('/api/workers/rate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ workerId, type, date })
            })

            if (response.ok) {
                // После успешной оценки обновляем данные
                await loadWorkers()
            }
        } catch (error) {
            console.error('Error rating worker:', error)
        }
    }

    return (
        <div className="workers-list">
            <div className="workers-header">
                <div className="header-content">
                    <h1>Список сотрудников</h1>
                    <div className="workers-controls">
                        <div className="period-selector">
                            <span>Период:</span>
                            <DatePicker
                                selected={startDate}
                                onChange={handlePeriodChange}
                                startDate={startDate}
                                endDate={endDate}
                                selectsRange
                                locale="ru"
                                dateFormat="MMMM yyyy"
                                showMonthYearPicker
                                className="date-picker"
                            />
                        </div>
                        <button onClick={() => setShowAddForm(true)}>
                            Добавить сотрудника
                        </button>
                    </div>
                </div>
            </div>

            <WorkersCharts 
                workers={processedWorkers}
                periodStart={startDate}
                periodEnd={endDate}
            />
            
            <WorkersTable 
                workers={processedWorkers}
                onEdit={setEditingWorker}
                onDelete={handleDeleteWorker}
                onRate={handleRate}
                periodStart={startDate}
                periodEnd={endDate}
            />

            {showAddForm && (
                <AddWorkerModal
                    isOpen={showAddForm}
                    onClose={() => setShowAddForm(false)}
                    onAdd={handleAddWorker}
                />
            )}

            {editingWorker && (
                <EditWorkerModal
                    isOpen={!!editingWorker}
                    worker={editingWorker}
                    onClose={() => setEditingWorker(null)}
                    onUpdate={handleEditWorker}
                />
            )}
        </div>
    )
}