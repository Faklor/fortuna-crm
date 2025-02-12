import axios from "axios"
import { useState, useEffect } from "react"
import DatePicker, { registerLocale } from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import ru from 'date-fns/locale/ru'
import '../scss/historyReqs.scss'
import Image from 'next/image'
import { useSession } from 'next-auth/react'

// Регистрируем русскую локаль
registerLocale('ru', ru)

export default function HistoryReqs({ visibleHistoryReq }){
    const { data: session } = useSession()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [history, setHistory] = useState([])
    const [allDates, setAllDates] = useState([])
    const [showConfirmDelete, setShowConfirmDelete] = useState(null) // для модального окна подтверждения
    const [objects, setObjects] = useState({}) // Для хранения данных объектов
    const [parts, setParts] = useState({}) // Для хранения данных запчастей

    // Получение данных объекта
    async function getObjectData(objId) {
        try {
            const response = await axios.post('/api/teches/object', { _id: objId })
            return response.data
        } catch (error) {
            console.error('Error fetching object data:', error)
            return null
        }
    }

    // Получение данных запчастей
    async function getPartsData(partsIds) {
        try {
            const response = await axios.post('/api/parts/optionParts', { partsArr: partsIds })
            return response.data
        } catch (error) {
            console.error('Error fetching parts data:', error)
            return []
        }
    }

    useEffect(() => {
        const historyReqs = visibleHistoryReq
        const dates = historyReqs.map(req => new Date(req.dateEnd))
        setAllDates(dates)
        filterHistoryByDate(selectedDate)
    }, [visibleHistoryReq])

    // Загрузка дополнительных данных для заявок
    useEffect(() => {
        const loadAdditionalData = async () => {
            const objectIds = [...new Set(history.map(req => req.obj))]
            const partsIds = [...new Set(history.flatMap(req => 
                req.parts.map(part => part._id)
            ))]

            // Загружаем данные объектов
            const objectsData = {}
            for (const objId of objectIds) {
                const objData = await getObjectData(objId)
                if (objData) {
                    objectsData[objId] = objData
                }
            }
            setObjects(objectsData)

            // Загружаем данные запчастей
            const partsData = await getPartsData(partsIds)
            const partsMap = partsData.reduce((acc, part) => {
                acc[part._id] = part
                return acc
            }, {})
            setParts(partsMap)
        }

        if (history.length > 0) {
            loadAdditionalData()
        }
    }, [history])

    // Фильтруем заявки по выбранной дате
    const filterHistoryByDate = (date) => {
        const historyReqs = visibleHistoryReq
        const filteredHistory = historyReqs.filter(req => {
            const reqDate = new Date(req.dateEnd)
            return reqDate.getDate() === date.getDate() &&
                   reqDate.getMonth() === date.getMonth() &&
                   reqDate.getFullYear() === date.getFullYear()
        })
        setHistory(filteredHistory)
    }

    const handleDateChange = (date) => {
        setSelectedDate(date)
        filterHistoryByDate(date)
    }

    // Подсвечиваем даты с заявками
    const highlightWithOrders = (date) => {
        return allDates.some(d => 
            d.getDate() === date.getDate() &&
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
        )
    }

    // Функция отправки уведомления об удалении
    const sendDeletionNotification = async (deletedReq) => {
        try {
            const objectData = objects[deletedReq.obj] || {};
            const urgencyTypes = {
                'НЕ СРОЧНАЯ': '🟢',
                'СРЕДНЕЙ СРОЧНОСТИ': '🟡',
                'СРОЧНАЯ': '🔴'
            };

            const partsInfo = deletedReq.parts.map(part => {
                const partData = parts[part._id] || {};
                return `• ${part.countReq} ${part.description} - ${partData.name || 'Не найдено'}`;
            }).join('\n');

            const message = `<b>❌ Заявка удалена из архива</b>

🆔 ID заявки: ${deletedReq._id}
👤 Удалил: ${session?.user?.name || 'Неизвестный пользователь'}

📅 Дата создания: ${deletedReq.dateBegin}
📅 Дата завершения: ${deletedReq.dateEnd}
❌ Удалил: ${session?.user?.name || 'Неизвестно'} (${session?.user?.role || 'Неизвестно'})

🏢 Объект: ${objectData.name || 'Не найдено'}

📦 Запчасти:
${partsInfo}`;

            const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM;

            const response = await axios.post('/api/telegram/sendNotification', { 
                message,
                chat_id: chatId,
                message_thread_id: 4
            });

            if (!response.data.success) {
                throw new Error('Failed to send notification');
            }
        } catch (error) {
            console.error('Failed to send deletion notification:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        }
    };

    // Функция удаления заявки из архива
    const deleteHistoryReq = async (reqId) => {
        try {
            // Находим заявку перед удалением для уведомления
            const reqToDelete = history.find(req => req._id === reqId);
            
            // Отправляем запрос на удаление
            await axios.post('/api/historyReqs/delete', { _id: reqId });
            
            // Отправляем уведомление после успешного удаления
            if (reqToDelete) {
                await sendDeletionNotification(reqToDelete);
            }

            // Обновляем локальное состояние
            const updatedHistory = history.filter(req => req._id !== reqId);
            setHistory(updatedHistory);
            
            // Обновляем даты
            const historyReqs = visibleHistoryReq.filter(req => req._id !== reqId);
            const dates = historyReqs.map(req => new Date(req.dateEnd));
            setAllDates(dates);
        } catch (error) {
            console.error('Error deleting history request:', error);
        }
    };
    

    return <div className="history-container">
        <div className="history-header">
            <h2>Архив заявок</h2>
            <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="dd.MM.yyyy"
                locale="ru"
                highlightDates={allDates}
                dayClassName={date =>
                    highlightWithOrders(date) ? "has-orders" : undefined
                }
                calendarClassName="custom-calendar"
                className="date-picker"
                
                toggleCalendarOnIconClick={true}
            />
        </div>

        <div className="history-content">
            {history.length !== 0 ? (
                history.map((item, index) => {
                    const objectData = objects[item.obj] || {}
                    return (
                        <div className="history-item" key={index}>
                            <div className="history-item-header">
                                <div className="header-left">
                                    <h3>Заявка #{item._id}</h3>
                                    <span className={`status ${item.urgency.toLowerCase()}`}>
                                        {item.urgency}
                                    </span>
                                </div>
                                <div className="header-right">
                                    <div className="date-info">
                                        <div className="date-range">
                                            <span>С {item.dateBegin}</span>
                                            <span>По {item.dateEnd}</span>
                                        </div>
                                        <span className="creator-info">
                                            👤 Выполнил: {item.createdBy?.username} ({item.createdBy?.role})
                                        </span>
                                    </div>
                                    <button 
                                        className="delete-btn"
                                        onClick={() => setShowConfirmDelete(item._id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            
                            <div className="history-item-details">
                                <div className="object-info">
                                    <div className="object-header">
                                        <div className="object-title">
                                            <h4>{objectData.name || 'Загрузка...'}</h4>
                                            <span className="organization">
                                                {objectData.organization || ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="parts-list">
                                    <h4>Запчасти:</h4>
                                    {item.parts.map((part, idx) => {
                                        const partData = parts[part._id] || {}
                                        return (
                                            <div className="part-item" key={idx}>
                                                <div className="part-header">
                                                    <span className="part-name">
                                                        {partData.name || 'Загрузка...'}
                                                    </span>
                                                </div>
                                                <div className="part-details">
                                                    <div className="part-count">
                                                        <span>Количество: {part.countReq} {part.description}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )
                })
            ) : (
                <div className="no-history">
                    <p>По данной дате заявок нет</p>
                </div>
            )}
        </div>

        {/* Модальное окно подтверждения удаления */}
        {showConfirmDelete && (
            <div className="delete-modal">
                <div className="delete-modal-content">
                    <h3>Подтверждение удаления</h3>
                    <p>Вы уверены, что хотите удалить эту заявку из архива?</p>
                    <div className="delete-modal-buttons">
                        <button 
                            className="confirm-delete"
                            onClick={() => {
                                deleteHistoryReq(showConfirmDelete);
                                setShowConfirmDelete(null);
                            }}
                        >
                            Удалить
                        </button>
                        <button 
                            className="cancel-delete"
                            onClick={() => setShowConfirmDelete(null)}
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
}