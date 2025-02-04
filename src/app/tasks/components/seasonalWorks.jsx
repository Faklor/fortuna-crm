import { useState, useEffect } from 'react'
import '../scss/seasonalWorks.scss'
import axios from 'axios'
import { WORK_TYPES } from '@/app/fields/constants/workTypes'

export default function SeasonalWorks() {
    const [works, setWorks] = useState([])
    const [loading, setLoading] = useState(true)

    // Получаем текущий сезон и год
    const getCurrentSeason = () => {
        const date = new Date()
        const month = date.getMonth()
        const year = date.getFullYear()
        
        if (month >= 2 && month <= 4) return { name: 'Весна', class: 'spring', year }
        if (month >= 5 && month <= 7) return { name: 'Лето', class: 'summer', year }
        if (month >= 8 && month <= 10) return { name: 'Осень', class: 'autumn', year }
        return { name: 'Зима', class: 'winter', year }
    }

    useEffect(() => {
        const fetchWorks = async () => {
            try {
                const response = await axios.get('/api/fields/works/seasonal', {
                    params: {
                        season: getCurrentSeason().class
                    }
                })
                setWorks(response.data)
            } catch (error) {
                console.error('Error fetching seasonal works:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchWorks()
    }, [])

    const getStatusText = (status) => {
        return status === 'planned' ? 'Запланировано' : status
    }

    const currentSeason = getCurrentSeason()

    return (
        <div className="seasonal-works">
            <div className="seasonal-header">
                <h2>Сезонные работы</h2>
                <span className={`season-badge ${currentSeason.class}`}>
                    {`${currentSeason.name} ${currentSeason.year}`}
                </span>
            </div>

            {loading ? (
                <div className="loading">Загрузка...</div>
            ) : works.length > 0 ? (
                <div className="works-list">
                    {works.map((work, index) => (
                        <div 
                            key={index} 
                            className={`work-item ${currentSeason.class}`}
                            data-type={work.type}
                        >
                            <div className="work-header">
                                <div className="work-header__main">
                                    <h3>{work.name}</h3>
                                    <span className="work-type">
                                        {WORK_TYPES[work.type] || work.type}
                                    </span>
                                </div>
                                <div className="work-header__meta">
                                    <span className="field-name">
                                        <i className="fas fa-map-marker-alt"></i> {work.field.name}
                                    </span>
                                    <span className={`status-badge ${work.status}`}>
                                        {getStatusText(work.status)}
                                    </span>
                                </div>
                            </div>
                            <div className="work-details">
                                {work.description && (
                                    <p className="description">{work.description}</p>
                                )}
                                <div className="work-info-grid">
                                    <div className="work-info-item">
                                        <i className="far fa-calendar"></i>
                                        <span>{new Date(work.plannedDate).toLocaleDateString('ru-RU')}</span>
                                    </div>
                                    {work.area && (
                                        <div className="work-info-item">
                                            <i className="fas fa-vector-square"></i>
                                            <span>{work.area.toFixed(2)} га</span>
                                        </div>
                                    )}
                                </div>
                                {(work.workers?.length > 0 || work.equipment?.length > 0) && (
                                    <div className="work-resources">
                                        {work.workers?.length > 0 && (
                                            <div className="work-resources__group">
                                                <div className="work-resources__title">
                                                    <i className="fas fa-users"></i> Работники
                                                </div>
                                                <div className="work-resources__items">
                                                    {work.workers.map(w => w.name).join(', ')}
                                                </div>
                                            </div>
                                        )}
                                        {work.equipment?.length > 0 && (
                                            <div className="work-resources__group">
                                                <div className="work-resources__title">
                                                    <i className="fas fa-tractor"></i> Техника
                                                </div>
                                                <div className="work-resources__items">
                                                    {work.equipment.map(e => e.name).join(', ')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-works">
                    <i className="far fa-calendar-times"></i>
                    <p>Нет запланированных сезонных работ</p>
                </div>
            )}
        </div>
    )
} 