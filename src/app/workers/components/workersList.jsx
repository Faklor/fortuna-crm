'use client'
import '../scss/workersList.scss'
import { useState, useEffect } from 'react'
import AddWorkerModal from './AddWorkerModal'
import EditWorkerModal from './EditWorkerModal'
import WorkersCharts from './WorkersCharts'
import WorkersTable from './WorkersTable'

export default function WorkersList({visibleWorkers}) {
    const [workers, setWorkers] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('name')
    const [ratingPeriod, setRatingPeriod] = useState('all')
    const [editingWorker, setEditingWorker] = useState(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    useEffect(() => {
        setWorkers(JSON.parse(visibleWorkers))
    }, [visibleWorkers])

    const filteredWorkers = workers
        .filter(worker => 
            worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            worker.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
            worker.organization.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name)
            if (sortBy === 'position') return a.position.localeCompare(b.position)
            if (sortBy === 'organization') return a.organization.localeCompare(b.organization)
            if (sortBy === 'rating') return b.rating - a.rating
            return 0
        })

    const handleRate = async (workerId, type) => {
        try {
            const response = await fetch(`/api/workers/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workerId, type })
            })
            
            if (response.ok) {
                const updatedWorker = await response.json()
                const updatedWorkers = workers.map(worker => 
                    worker._id === workerId ? {
                        ...worker, 
                        totalLikes: updatedWorker.totalLikes,
                        totalDislikes: updatedWorker.totalDislikes,
                        rating: updatedWorker.rating
                    } : worker
                )
                setWorkers(updatedWorkers)
            }
        } catch (error) {
            console.error('Error rating worker:', error)
        }
    }

    const handleDelete = async (workerId) => {
        if (confirm('Вы уверены, что хотите удалить этого работника?')) {
            try {
                const response = await fetch(`/api/workers/${workerId}`, {
                    method: 'DELETE'
                })
                if (response.ok) {
                    setWorkers(workers.filter(w => w._id !== workerId))
                }
            } catch (error) {
                console.error('Error deleting worker:', error)
            }
        }
    }

    return (
        <div className="workers-list">
            <div className="workers-header">
                <h1>Список работников</h1>
                <button
                    className="add-button"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    Добавить работника
                </button>
            </div>

            <div className="workers-filters">
                <input
                    type="text"
                    placeholder="Поиск по имени или должности..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="name">По имени</option>
                    <option value="position">По должности</option>
                    <option value="organization">По организации</option>
                    <option value="rating">По рейтингу</option>
                </select>
                <select 
                    value={ratingPeriod}
                    onChange={(e) => setRatingPeriod(e.target.value)}
                >
                    <option value="all">За все время</option>
                    <option value="month">За месяц</option>
                    <option value="week">За неделю</option>
                </select>
            </div>

            {workers.length > 0 && (
                <>
                    <WorkersCharts 
                        workers={filteredWorkers} 
                        ratingPeriod={ratingPeriod} 
                    />

                    <WorkersTable 
                        workers={filteredWorkers}
                        onEdit={setEditingWorker}
                        onDelete={handleDelete}
                        onRate={handleRate}
                    />
                </>
            )}

            <AddWorkerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={(worker) => setWorkers([...workers, worker])}
            />

            {editingWorker && (
                <EditWorkerModal
                    isOpen={!!editingWorker}
                    onClose={() => setEditingWorker(null)}
                    worker={editingWorker}
                    onUpdate={(updatedWorker) => {
                        setWorkers(workers.map(w => 
                            w._id === updatedWorker._id ? updatedWorker : w
                        ))
                        setEditingWorker(null)
                    }}
                />
            )}
        </div>
    )
}