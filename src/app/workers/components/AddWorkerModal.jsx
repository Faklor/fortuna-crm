'use client'
import { useState, useEffect } from 'react'
import '../scss/workerAdd.scss'

export default function AddWorkerModal({ isOpen, onClose, onAdd }) {
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        phone: '',
        email: '',
        organization: ''
    })
    const [existingPositions, setExistingPositions] = useState([])
    const [existingOrganizations, setExistingOrganizations] = useState([])
    const [isCustomPosition, setIsCustomPosition] = useState(false)
    const [isCustomOrganization, setIsCustomOrganization] = useState(false)

    // Получаем список существующих должностей и организаций при открытии модального окна
    useEffect(() => {
        if (isOpen) {
            fetchPositions()
            fetchOrganizations()
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

    const fetchOrganizations = async () => {
        try {
            const response = await fetch('/api/workers/organizations')
            if (response.ok) {
                const organizations = await response.json()
                setExistingOrganizations(organizations)
            }
        } catch (error) {
            console.error('Error fetching organizations:', error)
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
                setFormData({ name: '', position: '', phone: '', email: '', organization: '' })
                setIsCustomPosition(false)
                setIsCustomOrganization(false)
                // Обновляем страницу после добавления
                window.location.reload()
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
                            <div className="select-group">
                                <select
                                    value={formData.position}
                                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                                    required
                                >
                                    <option value="">Выберите должность</option>
                                    {existingPositions.map(pos => (
                                        <option key={pos} value={pos}>{pos}</option>
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
                            <div className="input-group">
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
                        <label>Организация</label>
                        {!isCustomOrganization ? (
                            <div className="select-group">
                                <select
                                    value={formData.organization}
                                    onChange={(e) => setFormData({...formData, organization: e.target.value})}
                                    required
                                >
                                    <option value="">Выберите организацию</option>
                                    {existingOrganizations.map(org => (
                                        <option key={org} value={org}>{org}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="toggle-btn"
                                    onClick={() => setIsCustomOrganization(true)}
                                >
                                    +
                                </button>
                            </div>
                        ) : (
                            <div className="input-group">
                                <input
                                    type="text"
                                    value={formData.organization}
                                    onChange={(e) => setFormData({...formData, organization: e.target.value})}
                                    placeholder="Введите новую организацию"
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-btn"
                                    onClick={() => setIsCustomOrganization(false)}
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