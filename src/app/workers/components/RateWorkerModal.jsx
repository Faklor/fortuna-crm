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
    const [ktuValue, setKtuValue] = useState(1) // Значение КТУ по умолчанию
    const [existingRating, setExistingRating] = useState(null)

    // При каждом открытии модального окна устанавливаем текущую дату
    useEffect(() => {
        if (isOpen) {
            const now = new Date()
            const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
            setSelectedDate(localDate)
            setKtuValue(1)
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
                    ktu: parseFloat(ktuValue),
                    date: selectedDate
                })
            })

            if (response.ok) {
                onClose()
                window.location.reload() // Временно используем перезагрузку страницы
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
                            <div className="form-group">
                                <label>КТУ (от 0 до 2):</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="2"
                                    step="0.1"
                                    value={ktuValue}
                                    onChange={(e) => setKtuValue(e.target.value)}
                                    className="ktu-input"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="submit">Установить КТУ</button>
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