'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DatePicker, { registerLocale } from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import ru from 'date-fns/locale/ru'  // Импортируем русскую локаль
import '../scss/rateWorkerModal.scss'

// Регистрируем русскую локаль
registerLocale('ru', ru)

export default function RateWorkerModal({ isOpen, onClose, onRate, worker, disabledDates }) {
    const { data: session } = useSession()
    const [selectedDate, setSelectedDate] = useState(null)
    const [ktuValue, setKtuValue] = useState(1.0)  // Базовое значение
    const [comment, setComment] = useState('')      // Добавляем состояние для комментария
    const [existingRating, setExistingRating] = useState(null)
    const [ratingInfo, setRatingInfo] = useState(null)

    // При каждом открытии модального окна устанавливаем текущую дату
    useEffect(() => {
        if (isOpen) {
            const now = new Date()
            const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
            setSelectedDate(localDate)
            setKtuValue(1.0)
            checkExistingRating(localDate)
        }
    }, [isOpen])

    const checkExistingRating = async (date) => {
        try {
            const response = await fetch(`/api/workers/rating?workerId=${worker._id}&date=${date.toISOString()}`)
            const data = await response.json()
            
            if (data.rating) {
                setExistingRating(true)
                setRatingInfo(data.rating)
                setKtuValue(data.rating.ktu)
                setComment(data.rating.comment)
            } else {
                setExistingRating(false)
                setRatingInfo(null)
                setKtuValue(1.0)
                setComment('')
            }
        } catch (error) {
            console.error('Error checking rating:', error)
        }
    }

    const handleDateChange = (date) => {
        setSelectedDate(date)
        checkExistingRating(date)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const response = await fetch('/api/workers/rating', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    workerId: worker._id,
                    ktu: parseFloat(ktuValue),
                    date: selectedDate,
                    comment: comment,
                    createdBy: session?.user?.login || session?.user?.email
                })
            })

            if (response.ok) {
                onClose()
                window.location.reload()
            }
        } catch (error) {
            console.error('Error submitting KTU:', error)
        }
    }

    const handleDeleteRating = async () => {
        try {
            const response = await fetch('/api/workers/rate', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    workerId: worker._id,
                    date: selectedDate
                })
            })
            
            if (response.ok) {
                onClose()
                window.location.reload()
            }
        } catch (error) {
            console.error('Error deleting rating:', error)
        }
    }

    // Проверяем, есть ли уже оценка на выбранную дату
    const isDateDisabled = (date) => {
        // Преобразуем disabledDates в массив объектов Date
        const disabledDateObjects = disabledDates?.map(d => new Date(d)) || []
        
        return disabledDateObjects.some(disabledDate => {
            return date.getFullYear() === disabledDate.getFullYear() &&
                   date.getMonth() === disabledDate.getMonth() &&
                   date.getDate() === disabledDate.getDate()
        })
    }

    if (!isOpen || !selectedDate) return null

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Установить КТУ сотрудника</h2>
                <p>Сотрудник: {worker?.name}</p>
                
                {existingRating && ratingInfo && (
                    <div className="rating-info">
                        <p>КТУ установлен пользователем: {ratingInfo.createdBy || 'Неизвестно'}</p>
                        <p>Дата установки: {new Date(ratingInfo.date).toLocaleDateString('ru-RU')}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Выберите дату:</label>
                        <DatePicker
                            selected={selectedDate}
                            onChange={handleDateChange}
                            dateFormat="dd.MM.yyyy"
                            locale="ru"  // Устанавливаем русскую локаль
                            highlightDates={disabledDates?.map(d => new Date(d))}
                            dayClassName={date =>
                                isDateDisabled(date) ? "rated-date" : undefined
                            }
                            calendarClassName="custom-calendar"
                        />
                    </div>

                    <div className="form-group">
                        <label>КТУ (от 0.1 до 2.0):</label>
                        <input
                            type="number"
                            min="0.1"
                            max="2.0"
                            step="0.1"
                            value={ktuValue}
                            onChange={(e) => setKtuValue(e.target.value)}
                            className="ktu-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Комментарий:</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Прокомментируйте"
                            required
                            className="comment-input"
                        />
                    </div>

                    {!existingRating ? (
                        <div className="modal-actions">
                            <button type="submit">Установить КТУ</button>
                            <button type="button" onClick={onClose}>Отмена</button>
                        </div>
                    ) : (
                        <div className="modal-actions">
                            <button 
                                type="button" 
                                className="delete-rating-btn"
                                onClick={handleDeleteRating}
                            >
                                Удалить КТУ
                            </button>
                            <button type="button" onClick={onClose}>Закрыть</button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
} 