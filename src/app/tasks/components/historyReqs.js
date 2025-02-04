import axios from "axios"
import { useState, useEffect } from "react"
import DatePicker, { registerLocale } from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import ru from 'date-fns/locale/ru'
import '../scss/historyReqs.scss'
import Image from 'next/image'

// Регистрируем русскую локаль
registerLocale('ru', ru)

export default function HistoryReqs({ visibleHistoryReq }){
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [history, setHistory] = useState([])
    const [allDates, setAllDates] = useState([])
    const [showConfirmDelete, setShowConfirmDelete] = useState(null) // для модального окна подтверждения

    useEffect(() => {
        // Получаем все даты из существующих заявок
        const historyReqs = visibleHistoryReq
        const dates = historyReqs.map(req => new Date(req.dateEnd))
        setAllDates(dates)
        
        // Получаем заявки за текущую дату
        filterHistoryByDate(selectedDate)
    }, [visibleHistoryReq])

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
        const message = `
<b>🗑️ Заявка удалена из архива</b>

📅 Дата создания: ${deletedReq.dateBegin}
📅 Дата завершения: ${deletedReq.dateEnd}
🏢 Объект: ${deletedReq.obj.name}
👨‍🔧 Исполнитель: ${deletedReq.workerName}

<b>Удаленные запчасти:</b>
${deletedReq.parts.map(part => `• ${part.countReq} ${part.description} ${part.name}`).join('\n')}
`
        try {
            await axios.post('/api/telegram/sendNotification', { message, type: 'requests' })
        } catch (error) {
            console.error('Failed to send deletion notification:', error)
        }
    }

    // Функция удаления заявки из архива
    const deleteHistoryReq = async (reqId) => {
        try {
            // Находим заявку перед удалением для уведомления
            const reqToDelete = history.find(req => req._id === reqId)
            
            // Отправляем запрос на удаление
            await axios.post('/api/historyReqs/delete', { _id: reqId })
            
            // Отправляем уведомление
            if (reqToDelete) {
                await sendDeletionNotification(reqToDelete)
            }

            // Обновляем локальное состояние
            const updatedHistory = history.filter(req => req._id !== reqId)
            setHistory(updatedHistory)
            
            // Обновляем даты
            const historyReqs = visibleHistoryReq.filter(req => req._id !== reqId)
            const dates = historyReqs.map(req => new Date(req.dateEnd))
            setAllDates(dates)
        } catch (error) {
            console.error('Error deleting history request:', error)
        }
    }
    

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
                history.map((item, index) => (
                    <div className="history-item" key={index}>
                        <div className="history-item-header">
                            <div className="header-left">
                                <h3>Заявка #{item._id.$oid}</h3>
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
                                    <span className="worker-name">👨‍🔧 {item.workerName}</span>
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
                                    {item.obj.catagory}
                                    <div className="object-title">
                                        <h4>{item.obj.name}</h4>
                                        <span className="organization">{item.obj.organization}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="parts-list">
                                <h4>Запчасти:</h4>
                                {item.parts.map((part, idx) => (
                                    <div className="part-item" key={idx}>
                                        <div className="part-header">
                                            <span className="part-name">{part.name}</span>
                                            <span className="part-category">{part.catagory}</span>
                                        </div>
                                        <div className="part-details">
                                            {part.manufacturer && (
                                                <span className="manufacturer">{part.manufacturer}</span>
                                            )}
                                            {part.sellNumber && (
                                                <span className="sell-number">Артикул: {part.sellNumber}</span>
                                            )}
                                            <div className="part-count">
                                                <span>Количество: {part.count}</span>
                                                {part.sum > 0 && (
                                                    <span className="sum">Сумма: {part.sum} руб.</span>
                                                )}
                                            </div>
                                            {part.contact.name && (
                                                <span className="contact">Поставщик: {part.contact.name}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))
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