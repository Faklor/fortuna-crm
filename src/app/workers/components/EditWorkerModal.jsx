'use client'
import { useState, useEffect } from 'react'
import '../scss/workersEdit.scss'

export default function EditWorkerModal({ isOpen, onClose, worker, onUpdate }) {
    const [formData, setFormData] = useState({
        name: worker?.name || '',
        position: worker?.position || '',
        phone: worker?.phone || '',
        email: worker?.email || ''
    })
    const [existingPositions, setExistingPositions] = useState([])
    const [isCustomPosition, setIsCustomPosition] = useState(false)

    // Получаем список существующих должностей при открытии модального окна
    useEffect(() => {
        if (isOpen) {
            fetchPositions()
        }
    }, [isOpen])

    // Обновляем formData при изменении worker
    useEffect(() => {
        if (worker) {
            setFormData({
                name: worker.name,
                position: worker.position,
                phone: worker.phone || '',
                email: worker.email || ''
            })
        }
    }, [worker])

    const fetchPositions = async () => {
        try {
            const response = await fetch('/api/workers/positions')
            if (response.ok) {
                const positions = await response.json()
                setExistingPositions(positions)
            }
        } catch (error) {
            console.error('Error fetching positions:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const response = await fetch(`/api/workers/${worker._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                const updatedWorker = await response.json()
                onUpdate(updatedWorker)
                onClose()
            }
        } catch (error) {
            console.error('Error updating worker:', error)
        }
    }

    if (!isOpen) return null

    return (
        <div className="edit-modal-overlay">
            <div className="edit-modal-content">
                <h2>Редактировать работника</h2>
                <form onSubmit={handleSubmit}>
                    <div className="edit-form-group">
                        <label>ФИО</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="edit-form-group">
                        <label>Должность</label>
                        {!isCustomPosition ? (
                            <div className="edit-position-group">
                                <select
                                    value={formData.position}
                                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                                    required
                                >
                                    <option value="">Выберите должность</option>
                                    {existingPositions.map(position => (
                                        <option key={position} value={position}>
                                            {position}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="toggle-btn"
                                    onClick={() => setIsCustomPosition(true)}
                                >
                                    +
                                </button>
                            </div>
                        ) : (
                            <div className="edit-position-group">
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                                    placeholder="Введите новую должность"
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-btn"
                                    onClick={() => setIsCustomPosition(false)}
                                >
                                    ←
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="edit-form-group">
                        <label>Телефон</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                    <div className="edit-form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div className="edit-form-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="save-btn"
                        >
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
} 