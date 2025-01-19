'use client'
import { useState, useEffect } from 'react'
import '../scss/workersEdit.scss'

export default function EditWorkerModal({ isOpen, onClose, worker, onUpdate }) {
    const [formData, setFormData] = useState({
        name: worker?.name || '',
        position: worker?.position || '',
        phone: worker?.phone || '',
        email: worker?.email || '',
        organization: worker?.organization || ''
    })
    const [existingPositions, setExistingPositions] = useState([])
    const [existingOrganizations, setExistingOrganizations] = useState([])
    const [isCustomPosition, setIsCustomPosition] = useState(false)
    const [isCustomOrganization, setIsCustomOrganization] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchPositions()
            fetchOrganizations()
        }
    }, [isOpen])

    useEffect(() => {
        if (worker) {
            setFormData({
                name: worker.name,
                position: worker.position,
                phone: worker.phone || '',
                email: worker.email || '',
                organization: worker.organization || ''
            })
        }
    }, [worker])

    const fetchPositions = async () => {
        try {
            const response = await fetch('/api/workers/positions')
            if (response.ok) {
                const positions = await response.json()
                setExistingPositions(positions)
                setIsCustomPosition(!positions.includes(worker.position))
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
                setIsCustomOrganization(!organizations.includes(worker.organization))
            }
        } catch (error) {
            console.error('Error fetching organizations:', error)
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
                    <div className="edit-form-group">
                        <label>Организация</label>
                        {!isCustomOrganization ? (
                            <div className="edit-organization-group">
                                <select
                                    value={formData.organization}
                                    onChange={(e) => setFormData({...formData, organization: e.target.value})}
                                    required
                                >
                                    <option value="">Выберите организацию</option>
                                    {existingOrganizations.map(organization => (
                                        <option key={organization} value={organization}>
                                            {organization}
                                        </option>
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
                            <div className="edit-organization-group">
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