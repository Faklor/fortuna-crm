import { useState, useEffect } from 'react'
import '../scss/editReq.scss'
import Image from 'next/image'
import axios from 'axios'
import { useSession } from "next-auth/react"

export default function EditReq({ 
    _id, 
    dateBegin, 
    urgency, 
    requests, 
    setArrActive, 
    arrActive, 
    objects: initialObjects,
    setErr,
    onClose
}) {
    const { data: session } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [editedRequests, setEditedRequests] = useState(requests)
    const [editedUrgency, setEditedUrgency] = useState(urgency)
    const [allObjects, setAllObjects] = useState([])
    const [allParts, setAllParts] = useState([])
    const [categorizedObjects, setCategorizedObjects] = useState({})
    const urgencyTypes = ['НЕ СРОЧНАЯ', 'СРЕДНЕЙ СРОЧНОСТИ', 'СРОЧНАЯ']
    const des = ['шт.', 'л.', 'см.', 'м.']

    // Загрузка всех объектов и запчастей
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Получаем все объекты
                const objectsResponse = await axios.get('/api/teches')
                const objects = objectsResponse.data

                // Группируем объекты по категориям
                const categorized = objects.reduce((acc, obj) => {
                    const category = obj.catagory || 'Без категории';
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category].push(obj);
                    return acc;
                }, {});

                // Сортируем объекты в каждой категории по имени
                Object.keys(categorized).forEach(category => {
                    categorized[category].sort((a, b) => a.name.localeCompare(b.name));
                });

                setCategorizedObjects(categorized)
                setAllObjects(objects)

                // Получаем все запчасти
                const partsResponse = await axios.get('/api/parts')
                setAllParts(partsResponse.data)
            } catch (error) {
                console.error('Error fetching data:', error)
                setErr('Ошибка при загрузке данных')
            }
        }
        fetchData()
    }, [])

    // Изменение объекта для запроса
    const handleObjectChange = (requestIndex, newObjectId) => {
        setEditedRequests(prev => {
            const newRequests = [...prev]
            newRequests[requestIndex] = {
                ...newRequests[requestIndex],
                obj: newObjectId,
                parts: [] // Сбрасываем запчасти при смене объекта
            }
            return newRequests
        })
    }

    // Добавление нового объекта
    const addNewObject = () => {
        if (allObjects && allObjects.length > 0) {
            setEditedRequests(prev => [...prev, {
                obj: allObjects[0]._id,
                parts: []
            }])
        }
    }

    // Удаление объекта
    const removeObject = (index) => {
        setEditedRequests(prev => prev.filter((_, i) => i !== index))
    }

    // Добавление запчасти к объекту
    const addPartToObject = (requestIndex, part) => {
        setEditedRequests(prev => {
            const newRequests = [...prev]
            const request = newRequests[requestIndex]
            if (!request.parts.some(p => p._id === part._id)) {
                request.parts.push({
                    _id: part._id,
                    countReq: 1,
                    description: 'шт.',
                    name: part.name
                })
            }
            return newRequests
        })
    }

    // Удаление запчасти
    const removePart = (requestIndex, partIndex) => {
        setEditedRequests(prev => {
            const newRequests = [...prev]
            newRequests[requestIndex].parts.splice(partIndex, 1)
            return newRequests
        })
    }

    // Изменение количества запчасти
    const handlePartCountChange = (requestIndex, partIndex, newCount) => {
        setEditedRequests(prev => {
            const newRequests = [...prev]
            newRequests[requestIndex].parts[partIndex].countReq = parseInt(newCount) || 0
            return newRequests
        })
    }

    // Изменение единицы измерения
    const handleDescriptionChange = (requestIndex, partIndex, newDescription) => {
        setEditedRequests(prev => {
            const newRequests = [...prev]
            newRequests[requestIndex].parts[partIndex].description = newDescription
            return newRequests
        })
    }

    // Функция для отправки уведомления об изменении
    const sendEditNotification = async (oldData, newData) => {
        try {
            const urgencyTypes = {
                'НЕ СРОЧНАЯ': '🟢',
                'СРЕДНЕЙ СРОЧНОСТИ': '🟡',
                'СРОЧНАЯ': '🔴'
            }

            const changesInfo = []
            
            // Проверяем изменение срочности
            if (oldData.urgency !== newData.urgency) {
                changesInfo.push(`⚡ Срочность: ${urgencyTypes[oldData.urgency]} ${oldData.urgency} ➡️ ${urgencyTypes[newData.urgency]} ${newData.urgency}`)
            }

            // Проверяем изменения в запчастях
            newData.requests.forEach((newReq, reqIndex) => {
                const oldReq = oldData.requests[reqIndex]
                const object = objects[newReq.obj]

                const partChanges = newReq.parts.map((newPart, partIndex) => {
                    const oldPart = oldReq.parts[partIndex]
                    if (newPart.countReq !== oldPart.countReq) {
                        return `• ${oldPart.countReq} ➡️ ${newPart.countReq} ${newPart.description} - ${newPart.name}`
                    }
                    return null
                }).filter(Boolean)

                if (partChanges.length > 0) {
                    changesInfo.push(`\n🏢 Объект: ${object?.name || 'Не указан'}\n${partChanges.join('\n')}`)
                }
            })

            if (changesInfo.length === 0) {
                return // Если изменений нет, не отправляем уведомление
            }

            const message = `<b>✏️ Заявка отредактирована</b>

🆔 ID заявки: ${_id}
👤 Отредактировал: ${session?.user?.name || 'Неизвестный пользователь'}
📧 Email: ${session?.user?.email || 'Не указан'}

📅 Дата создания: ${dateBegin}

Изменения:
${changesInfo.join('\n')}`;

            const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM;
            
            const response = await axios.post('/api/telegram/sendNotification', {
                message,
                chat_id: chatId,
                message_thread_id: 4
            })

            if (!response.data.success) {
                throw new Error('Failed to send notification')
            }
        } catch (error) {
            console.error('Failed to send edit notification:', error)
        }
    }

    // Функция сохранения изменений
    const handleSave = async () => {
        try {
            setIsLoading(true)
            const oldData = { requests, urgency }
            const newData = { requests: editedRequests, urgency: editedUrgency }

            const response = await axios.post('/api/requisition/editReq', {
                _id,
                requests: editedRequests,
                urgency: editedUrgency
            })

            // Обновляем состояние в родительском компоненте
            setArrActive(arrActive.map(req => 
                req._id === _id 
                    ? { ...req, requests: editedRequests, urgency: editedUrgency }
                    : req
            ))

            // Отправляем уведомление об изменениях
            await sendEditNotification(oldData, newData)

            onClose()
        } catch (error) {
            console.error('Error saving changes:', error)
            setErr('Ошибка при сохранении изменений')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="edit-req-modal">
            <div className="edit-req-content">
                <div className="edit-req-header">
                    <h2>Редактирование заявки #{_id}</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="edit-req-body">
                    <div className="urgency-section">
                        <label>Срочность:</label>
                        <select 
                            value={editedUrgency}
                            onChange={(e) => setEditedUrgency(e.target.value)}
                        >
                            {urgencyTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div className="requests-section">
                        {editedRequests.map((request, requestIndex) => (
                            <div key={requestIndex} className="request-item">
                                <div className="request-header">
                                    <select 
                                        value={request.obj}
                                        onChange={(e) => handleObjectChange(requestIndex, e.target.value)}
                                    >
                                        {Object.entries(categorizedObjects).map(([category, categoryObjects]) => (
                                            <optgroup key={category} label={category}>
                                                {categoryObjects.map((obj) => (
                                                    <option key={obj._id} value={obj._id}>
                                                        {obj.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                    {editedRequests.length > 1 && (
                                        <button 
                                            className="remove-object-btn"
                                            onClick={() => removeObject(requestIndex)}
                                        >
                                            Удалить объект
                                        </button>
                                    )}
                                </div>

                                <div className="parts-section">
                                    <div className="parts-list">
                                        {request.parts.map((part, partIndex) => (
                                            <div key={partIndex} className="part-item">
                                                <span className="part-name">{part.name}</span>
                                                <div className="part-controls">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={part.countReq}
                                                        onChange={(e) => handlePartCountChange(requestIndex, partIndex, e.target.value)}
                                                    />
                                                    <select
                                                        value={part.description}
                                                        onChange={(e) => handleDescriptionChange(requestIndex, partIndex, e.target.value)}
                                                    >
                                                        {des.map(d => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                    </select>
                                                    <button 
                                                        className="remove-part-btn"
                                                        onClick={() => removePart(requestIndex, partIndex)}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="add-part-section">
                                        <select
                                            onChange={(e) => {
                                                const part = allParts.find(p => p._id === e.target.value)
                                                if (part) addPartToObject(requestIndex, part)
                                            }}
                                            value=""
                                        >
                                            <option value="">Добавить запчасть</option>
                                            {allParts.map(part => (
                                                <option key={part._id} value={part._id}>
                                                    {part.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button 
                            className="add-object-btn"
                            onClick={addNewObject}
                        >
                            + Добавить объект
                        </button>
                    </div>
                </div>

                <div className="edit-req-footer">
                    <button 
                        className="save-button"
                        onClick={handleSave}
                        disabled={isLoading}
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