'use client'
import '../scss/workersList.scss'
import { useState, useEffect } from 'react'
import WorkersTable from './WorkersTable'
import WorkersCharts from './WorkersCharts'
import AddWorkerModal from './AddWorkerModal'
import EditWorkerModal from './EditWorkerModal'
import SearchWorkers from './SearchWorkers'
import DatePicker from 'react-datepicker'
import { registerLocale } from 'react-datepicker'
import ru from 'date-fns/locale/ru'
import "react-datepicker/dist/react-datepicker.css"

// Регистрируем русскую локаль
registerLocale('ru', ru)

export default function WorkersList({ visibleWorkers, initialStartDate, initialEndDate }) {
    const [workers, setWorkers] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [editingWorker, setEditingWorker] = useState(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [startDate, setStartDate] = useState(new Date(initialStartDate))
    const [endDate, setEndDate] = useState(new Date(initialEndDate))
    const [processedWorkers, setProcessedWorkers] = useState([])

    // Добавляем функцию расчета среднего КТУ
    const calculateAverageKTU = (ratings) => {
        if (!ratings || ratings.length === 0) return 0
        return ratings.reduce((sum, rating) => sum + rating.ktu, 0) / ratings.length
    }

    useEffect(() => {
        const parsedWorkers = JSON.parse(visibleWorkers)
        setWorkers(parsedWorkers)
        processWorkersData(parsedWorkers, startDate, endDate)
    }, [visibleWorkers, startDate, endDate])

    const processWorkersData = (workersData, start, end) => {
        const processed = workersData.map(worker => {
            const periodRatings = worker.ratings?.filter(rating => {
                const ratingDate = new Date(rating.date)
                return ratingDate >= start && ratingDate <= end
            }) || []

            const averageKtu = calculateAverageKTU(periodRatings)

            return {
                ...worker,
                periodRatings,
                averageKtu
            }
        })

        setProcessedWorkers(processed)
    }

    const handleStartDateChange = (date) => {
        if (date) {
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
            setStartDate(startOfMonth)
        }
    }

    const handleEndDateChange = (date) => {
        if (date) {
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
            setEndDate(endOfMonth)
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

    const handleSearch = (query) => {
        setSearchQuery(query)
    }

    // Фильтруем работников только для отображения
    const getFilteredWorkers = () => {
        if (!searchQuery.trim()) return processedWorkers

        const searchLower = searchQuery.toLowerCase()
        return processedWorkers.filter(worker => 
            worker.name.toLowerCase().includes(searchLower) ||
            worker.position.toLowerCase().includes(searchLower) ||
            worker.organization.toLowerCase().includes(searchLower)
        )
    }

    return (
        <div className="workers-list">
            <div className="workers-header">
                <div className="header-content">
                    <h1>Список сотрудников</h1>
                    <div className="workers-controls">
                        <div className="period-selector">
                            <span>С:</span>
                            <DatePicker
                                selected={startDate}
                                onChange={handleStartDateChange}
                                locale="ru"
                                dateFormat="MMMM yyyy"
                                showMonthYearPicker
                                className="date-picker"
                            />
                            <span>По:</span>
                            <DatePicker
                                selected={endDate}
                                onChange={handleEndDateChange}
                                locale="ru"
                                dateFormat="MMMM yyyy"
                                showMonthYearPicker
                                className="date-picker"
                                minDate={startDate} // Нельзя выбрать дату раньше начальной
                            />
                        </div>
                        <button onClick={() => setShowAddForm(true)}>
                            Добавить сотрудника
                        </button>
                    </div>
                </div>
                <SearchWorkers onSearch={handleSearch} />
            </div>

            <WorkersCharts 
                workers={getFilteredWorkers()}
                periodStart={startDate}
                periodEnd={endDate}
            />
            
            <WorkersTable 
                workers={getFilteredWorkers()}
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