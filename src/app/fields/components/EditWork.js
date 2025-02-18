'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { WORK_TYPES } from '../constants/workTypes'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import '../scss/editWork.scss'

export default function EditWork({ work, onClose, onUpdate }) {
    const [editedWork, setEditedWork] = useState({
        name: work.name,
        type: work.type,
        plannedDate: new Date(work.plannedDate),
        description: work.description || '',
        workers: work.workers || [],
        equipment: work.equipment || [],
        status: work.status,
        completedDate: work.completedDate
    })
    const [workers, setWorkers] = useState([])
    const [equipment, setEquipment] = useState([])

    useEffect(() => {
        // Загрузка списка работников и техники
        const fetchData = async () => {
            try {
                const [workersResponse, techResponse] = await Promise.all([
                    axios.get('/api/workers'),
                    axios.get('/api/teches')
                ])
                setWorkers(workersResponse.data)
                setEquipment(techResponse.data.tech)
            } catch (error) {
                console.error('Error loading data:', error)
            }
        }
        fetchData()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const response = await axios.put(`/api/fields/works/update/${work._id}`, editedWork)
            if (response.data.success) {
                onUpdate(response.data.work)
                onClose()
            }
        } catch (error) {
            console.error('Error updating work:', error)
        }
    }

    return (
        <div className="edit-work-modal">
            <div className="modal-content">
                <h3>Редактировать работу</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Название:</label>
                        <input
                            type="text"
                            value={editedWork.name}
                            onChange={(e) => setEditedWork(prev => ({
                                ...prev,
                                name: e.target.value
                            }))}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Тип работы:</label>
                        <select
                            value={editedWork.type}
                            onChange={(e) => setEditedWork(prev => ({
                                ...prev,
                                type: e.target.value
                            }))}
                            required
                        >
                            {Object.entries(WORK_TYPES).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Дата:</label>
                        <DatePicker
                            selected={editedWork.plannedDate}
                            onChange={(date) => setEditedWork(prev => ({
                                ...prev,
                                plannedDate: date
                            }))}
                            dateFormat="dd.MM.yyyy"
                            locale="ru"
                        />
                    </div>

                    <div className="form-group">
                        <label>Описание:</label>
                        <textarea
                            value={editedWork.description}
                            onChange={(e) => setEditedWork(prev => ({
                                ...prev,
                                description: e.target.value
                            }))}
                        />
                    </div>

                    <div className="form-group">
                        <label>Работники:</label>
                        <select
                            multiple
                            value={editedWork.workers.map(w => w._id)}
                            onChange={(e) => {
                                const selectedWorkers = Array.from(e.target.selectedOptions, option => {
                                    const worker = workers.find(w => w._id === option.value)
                                    return {
                                        _id: worker._id,
                                        name: worker.name || worker.properties?.Name
                                    }
                                })
                                setEditedWork(prev => ({
                                    ...prev,
                                    workers: selectedWorkers
                                }))
                            }}
                        >
                            {workers.map(worker => (
                                <option key={worker._id} value={worker._id}>
                                    {worker.name || worker.properties?.Name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Техника:</label>
                        <select
                            multiple
                            value={editedWork.equipment.map(e => e._id)}
                            onChange={(e) => {
                                const selectedEquipment = Array.from(e.target.selectedOptions, option => {
                                    const tech = equipment.find(t => t._id === option.value)
                                    return {
                                        _id: tech._id,
                                        name: tech.name,
                                        category: tech.category,
                                        captureWidth: tech.captureWidth
                                    }
                                })
                                setEditedWork(prev => ({
                                    ...prev,
                                    equipment: selectedEquipment
                                }))
                            }}
                        >
                            {equipment.map(tech => (
                                <option key={tech._id} value={tech._id}>
                                    {tech.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-actions">
                        <button type="submit">Сохранить</button>
                        <button type="button" onClick={onClose}>Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    )
} 