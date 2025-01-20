'use client'
import { useState, useEffect } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import ru from 'date-fns/locale/ru'  // Импортируем русскую локаль
import '../scss/rateWorkerModal.scss'

// Регистрируем русскую локаль
registerLocale('ru', ru)

export default function RateWorkerModal({ isOpen, onClose, onRate, worker, disabledDates }) {
    const [selectedDate, setSelectedDate] = useState(null)
    const [rateType, setRateType] = useState('like') // Добавляем состояние для типа оценки
    const [existingRating, setExistingRating] = useState(null)

    // При каждом открытии модального окна устанавливаем текущую дату
    useEffect(() => {
        if (isOpen) {
            const now = new Date()
            const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
            setSelectedDate(localDate)
            setRateType('like') // Сбрасываем тип оценки при открытии
            checkExistingRating(localDate)
        }
    }, [isOpen])

    const checkExistingRating = (date) => {
        // Преобразуем disabledDates в массив объектов Date
        const disabledDateObjects = disabledDates?.map(d => new Date(d)) || []
        
        const exists = disabledDateObjects.find(disabledDate => {
            return date.getFullYear() === disabledDate.getFullYear() &&
                   date.getMonth() === disabledDate.getMonth() &&
                   date.getDate() === disabledDate.getDate()
        })
        setExistingRating(exists ? true : false)
    }

    const handleDateChange = (date) => {
        setSelectedDate(date)
        checkExistingRating(date)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const response = await fetch('/api/workers/rate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    workerId: worker._id,
                    type: rateType,
                    date: selectedDate
                })
            })

            if (response.ok) {
                onClose()
                window.location.reload() // Временно используем перезагрузку страницы
            }
        } catch (error) {
            console.error('Error submitting rating:', error)
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
                <h2>Оценить сотрудника</h2>
                <p>Сотрудник: {worker?.name}</p>
                
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

                    {!existingRating ? (
                        <>
                            <div className="rate-buttons">
                                <button
                                    type="button"
                                    className={`rate-btn ${rateType === 'like' ? 'active' : ''}`}
                                    onClick={() => setRateType('like')}
                                >
                                    👍 Лайк
                                </button>
                                <button
                                    type="button"
                                    className={`rate-btn ${rateType === 'dislike' ? 'active' : ''}`}
                                    onClick={() => setRateType('dislike')}
                                >
                                    👎 Дизлайк
                                </button>
                            </div>

                            <div className="modal-actions">
                                <button type="submit">
                                    {rateType === 'like' ? 'Поставить лайк' : 'Поставить дизлайк'}
                                </button>
                                <button type="button" onClick={onClose}>Отмена</button>
                            </div>
                        </>
                    ) : (
                        <div className="modal-actions">
                            <button 
                                type="button" 
                                className="delete-rating-btn"
                                onClick={handleDeleteRating}
                            >
                                Отменить оценку
                            </button>
                            <button type="button" onClick={onClose}>Закрыть</button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
} 