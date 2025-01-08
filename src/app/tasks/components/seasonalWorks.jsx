import { useState, useEffect } from 'react'
import '../scss/seasonalWorks.scss'
import axios from 'axios'

export default function SeasonalWorks() {
    const [works, setWorks] = useState([])
    const [loading, setLoading] = useState(true)

    // Получаем текущий сезон
    const getCurrentSeason = () => {
        const month = new Date().getMonth()
        if (month >= 2 && month <= 4) return 'Весна'
        if (month >= 5 && month <= 7) return 'Лето'
        if (month >= 8 && month <= 10) return 'Осень'
        return 'Зима'
    }

    // Получаем класс для сезона
    const getSeasonClass = () => {
        const month = new Date().getMonth()
        if (month >= 2 && month <= 4) return 'spring'
        if (month >= 5 && month <= 7) return 'summer'
        if (month >= 8 && month <= 10) return 'autumn'
        return 'winter'
    }

    useEffect(() => {
        const fetchWorks = async () => {
            try {
                const response = await axios.get('/api/fields/works/seasonal', {
                    params: {
                        season: getSeasonClass()
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
        return status === 'planned' ? 'Запланировано' : status;
    }

    return (
        <div className="seasonal-works">
            <div className="seasonal-header">
                <h2>Сезонные работы</h2>
                <span className={`season-badge ${getSeasonClass()}`}>{getCurrentSeason()}</span>
            </div>

            {loading ? (
                <div className="loading">Загрузка...</div>
            ) : works.length > 0 ? (
                <div className="works-list">
                    {works.map((work, index) => (
                        <div key={index} className={`work-item ${getSeasonClass()}`}>
                            <div className="work-header">
                                <h3>{work.name}</h3>
                                <span className="field-name">{work.field.name}</span>
                                <span className="status-badge">
                                    {getStatusText(work.status)}
                                </span>
                            </div>
                            <div className="work-details">
                                <p className="description">{work.description}</p>
                                <div className="work-meta">
                                    <span className="date">
                                        Начало: {new Date(work.plannedDate).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>
                                {work.workers && work.workers.length > 0 && (
                                    <div className="assigned">
                                        Работники: {work.workers.map(w => w.name).join(', ')}
                                    </div>
                                )}
                                {work.equipment && work.equipment.length > 0 && (
                                    <div className="equipment">
                                        Техника: {work.equipment.map(e => e.name).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-works">
                    <p>Нет активных сезонных работ</p>
                </div>
            )}
        </div>
    )
} 