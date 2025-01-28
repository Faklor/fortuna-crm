'use client'
import { useState, useEffect } from 'react'
import anime from 'animejs'
import '../scss/timelineOperations.scss'

const TimelineOperations = ({ visibleObjects }) => {
    const [selectedObject, setSelectedObject] = useState('')
    const [operations, setOperations] = useState([])

    const getUnit = (category) => {
        return category === '🔆 Комбайны' || 
               category === '💧 Опрыскиватели' || 
               category === '🚜 Трактора' || 
               category === '📦 Погрущики' ? 'м.ч.' : 'км.'
    }

    const fetchOperations = async (objectId) => {
        try {
            const response = await fetch('/api/operations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ _id: objectId }),
            })
            const data = await response.json()
            const sortedOperations = data.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            )
            setOperations(sortedOperations)
        } catch (error) {
            console.error('Error fetching operations:', error)
        }
    }

    const handleObjectChange = (e) => {
        setSelectedObject(e.target.value)
        fetchOperations(e.target.value)
    }

    const renderUsedParts = (parts) => {
        if (!parts || parts.length === 0) return null;
        
        return (
            <div className="used-parts">
                <p>Использованные запчасти:</p>
                <ul>
                    {parts.map((part, index) => (
                        <li key={part._id || index}>
                            {part.name} - {part.count} шт.
                            {part.sum > 0 && ` (${part.sum} руб.)`}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const selectedObjectData = visibleObjects.find(obj => obj._id === selectedObject);

    const getOperationTypeClass = (type) => {
        switch (type) {
            case 'Ремонт':
                return 'operation-repair';
            case 'Навигация':
                return 'operation-navigation';
            case 'Технический Осмотр':
                return 'operation-inspection';
            case 'Техническое обслуживание':
                return 'operation-maintenance';
            default:
                return '';
        }
    };

    useEffect(() => {
        if (operations.length > 0) {
            // Анимация точек на таймлайне
            anime({
                targets: '.timeline-point',
                opacity: [0, 1],
                translateY: [20, 0],
                delay: anime.stagger(100), // Задержка между анимациями каждой точки
                duration: 800,
                easing: 'easeOutElastic(1, .5)'
            });

            // Анимация линии
            anime({
                targets: '.timeline::after',
                scaleX: [0, 1],
                duration: 1000,
                easing: 'easeOutExpo'
            });

            // Анимация контента
            anime({
                targets: '.timeline-content',
                scale: [0.8, 1],
                opacity: [0, 1],
                delay: anime.stagger(150),
                duration: 800,
                easing: 'easeOutElastic(1, .5)'
            });
        }
    }, [operations]);

    return (
        <div className="timeline-operations">
            <div className="object-selector">
                <select 
                    value={selectedObject} 
                    onChange={handleObjectChange}
                >
                    <option value="">Выберите объект</option>
                    {visibleObjects.map((obj) => (
                        <option key={obj._id} value={obj._id}>
                            {obj.name || obj._id}
                        </option>
                    ))}
                </select>
            </div>

            <div className="timeline">
                {operations.map((operation) => (
                    <div key={operation._id} className="timeline-point">
                        <div className={`timeline-content ${getOperationTypeClass(operation.type)}`}>
                            <h3>{operation.type}</h3>
                            <p>Дата: {operation.date}</p>
                            <p>Исполнители: {operation.executors.join(', ')}</p>
                            {operation.description && (
                                <p>Описание: {operation.description}</p>
                            )}
                            {operation.periodMotor && (
                                <p>Наработка: {operation.periodMotor} {selectedObjectData && getUnit(selectedObjectData.category)}</p>
                            )}
                            {renderUsedParts(operation.usedParts)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TimelineOperations 