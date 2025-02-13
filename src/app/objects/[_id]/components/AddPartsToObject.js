"use client"

import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import axios from 'axios'
import Image from 'next/image'
import '../scss/addPartsToObject.scss'

const formatDateForInput = (date) => {
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16) // Формат "YYYY-MM-DDThh:mm"
}

export default function AddPartsToObject({ 
    objectId, 
    objectName,
    onClose,
    onSuccess 
}) {
    const { data: session } = useSession()
    const [parts, setParts] = useState([])
    const [workers, setWorkers] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedParts, setSelectedParts] = useState([])
    const [partValues, setPartValues] = useState({})
    const [selectedDes, setSelectedDes] = useState({})
    const [selectedWorker, setSelectedWorker] = useState('')
    const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()))
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    
    const des = ['шт.', 'л.', 'см.', 'м.']

    // Загрузка запчастей и работников
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [partsResponse, workersResponse] = await Promise.all([
                    axios.get('/api/parts'),
                    axios.get('/api/workers')
                ])
                setParts(partsResponse.data)
                setWorkers(workersResponse.data)
            } catch (error) {
                setError('Ошибка при загрузке данных')
                console.error('Error fetching data:', error)
            }
        }
        fetchData()
    }, [])

    // Фильтрация запчастей по поиску
    const filteredParts = parts.filter(part => 
        part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Обработчики изменений
    const handleCheckboxChange = (partId) => {
        setSelectedParts(prev => {
            if (prev.includes(partId)) {
                return prev.filter(id => id !== partId)
            }
            return [...prev, partId]
        })
    }

    const handleNumberInputChange = (partId, value) => {
        // Находим запчасть
        const part = parts.find(p => p._id === partId)
        
        // Проверяем, что значение пустое или в допустимом диапазоне
        if (value === '' || (Number(value) >= 0 && Number(value) <= part.count)) {
            setPartValues(prev => ({
                ...prev,
                [partId]: value
            }))
        }
    }

    const handleSelectChange = (partId, value) => {
        setSelectedDes(prev => ({
            ...prev,
            [partId]: value
        }))
    }

    // Сохранение
    const handleSave = async () => {
        if (!selectedWorker) {
            setError('Выберите работника')
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            const partsToAdd = selectedParts.map(partId => {
                const partInfo = parts.find(p => p._id === partId)
                return {
                    partId,
                    count: partValues[partId] || 0,
                    description: selectedDes[partId] || 'шт.',
                    partInfo: {
                        _id: partInfo._id,
                        name: partInfo.name,
                        catagory: partInfo.catagory,
                        manufacturer: partInfo.manufacturer || '',
                        sellNumber: partInfo.sellNumber || '',
                        serialNumber: partInfo.serialNumber || '',
                        contact: partInfo.contact || {},
                        sum: partInfo.sum || 0
                    }
                }
            })

            const response = await axios.post('/api/teches/object/addParts', {
                objectId,
                parts: partsToAdd,
                workerName: selectedWorker,
                date: new Date(selectedDate).toISOString()
            })

            if (response.data.success) {
                const partsInfo = response.data.updatedParts.map(part => {
                    const selectedPart = partsToAdd.find(p => p.partId === part._id.toString())
                    return `• ${selectedPart.count} ${selectedPart.description} - ${part.name} (Остаток: ${part.count} шт.)`
                }).join('\n')

                const message = `🔧 <b>Выдача запчастей</b>

🏢 Объект: ${objectName}
👨‍🔧 Работник: ${selectedWorker}
📅 Дата: ${new Date(selectedDate).toLocaleString('ru-RU')}
👤 Выдал: ${session?.user?.name || 'Неизвестный пользователь'}

📦 Выданные запчасти:
${partsInfo}`

                await axios.post('/api/telegram/sendNotification', {
                    message,
                    chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM,
                    message_thread_id: 30,
                    parse_mode: 'HTML'
                })

                onSuccess?.()
                onClose()
            } else {
                setError(response.data.error || 'Ошибка при выдаче запчастей')
            }
        } catch (error) {
            console.error('Error saving parts:', error)
            setError('Ошибка при выдаче запчастей')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="add-parts-modal">
            <div className="add-parts-content">
                <div className="add-parts-header">
                    <h2>Выдача запчастей: {objectName}</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="worker-date-section">
                    <select
                        value={selectedWorker}
                        onChange={(e) => setSelectedWorker(e.target.value)}
                        className="worker-select"
                    >
                        <option value="">Выберите работника</option>
                        {workers.map((worker) => (
                            <option key={worker._id} value={worker.name}>
                                {worker.name}
                            </option>
                        ))}
                    </select>

                    <input
                        type="datetime-local"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-input"
                    />
                </div>

                <div className="search-container">
                    <input 
                        type="text"
                        placeholder="🔍 Поиск запчастей..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button 
                            className="clear-search"
                            onClick={() => setSearchQuery('')}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="parts-grid">
                    {filteredParts.map((part) => (
                        <div key={part._id} className="part-card">
                            <div className="part-header">
                                <input 
                                    type="checkbox"
                                    checked={selectedParts.includes(part._id)}
                                    onChange={() => handleCheckboxChange(part._id)}
                                />
                                <div className="part-info">
                                    <p className="part-name">{part.name}</p>
                                    <p className="part-manufacturer">{part.manufacturer}</p>
                                    <p className="part-stock">На складе: {part.count} шт.</p>
                                </div>
                            </div>
                            
                            {selectedParts.includes(part._id) && (
                                <div className="part-details">
                                    <input 
                                        type="number"
                                        min="0"
                                        max={part.count}
                                        placeholder="Количество"
                                        value={partValues[part._id] || ''}
                                        onChange={(e) => handleNumberInputChange(part._id, e.target.value)}
                                    />
                                    <select
                                        value={selectedDes[part._id] || ''}
                                        onChange={(e) => handleSelectChange(part._id, e.target.value)}
                                    >
                                        <option value="">Ед. изм.</option>
                                        {des.map((unit) => (
                                            <option key={unit} value={unit}>
                                                {unit}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="add-parts-footer">
                    <button 
                        className="save-button"
                        onClick={handleSave}
                        disabled={isLoading || selectedParts.length === 0}
                    >
                        {isLoading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button 
                        className="cancel-button"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    )
} 