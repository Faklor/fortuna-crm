'use client'
import { useState, useEffect } from 'react'
import '../scss/workerAdd.scss'

export default function AddWorkerModal({ isOpen, onClose, onAdd }) {
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        phone: '',
        email: ''
    })
    const [existingPositions, setExistingPositions] = useState([])
    const [isCustomPosition, setIsCustomPosition] = useState(false)

    // Получаем список существующих должностей при открытии модального окна
    useEffect(() => {
        if (isOpen) {
            fetchPositions()
        }
    }, [isOpen])

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
            const response = await fetch('/api/workers/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                const newWorker = await response.json()
                onAdd(newWorker)
                onClose()
                setFormData({ name: '', position: '', phone: '', email: '' })
                setIsCustomPosition(false)
            }
        } catch (error) {
            console.error('Error adding worker:', error)
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Добавить работника</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>ФИО</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Должность</label>
                        {!isCustomPosition ? (
                            <div className="position-group">
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
                            <div className="position-group">
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
                    <div className="form-group">
                        <label>Телефон</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                        >
                            Добавить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
} 