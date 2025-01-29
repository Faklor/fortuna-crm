'use client'
import { useState, useEffect } from 'react'
import anime from 'animejs'
import axios from 'axios'
import '../scss/timelineOperations.scss'

const TimelineOperations = ({ visibleObjects }) => {
    const [selectedObject, setSelectedObject] = useState('')
    const [operations, setOperations] = useState([])
    const [orders, setOrders] = useState([])
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(false)

    const getUnit = (category) => {
        return category === '🔆 Комбайны' || 
               category === '💧 Опрыскиватели' || 
               category === '🚜 Трактора' || 
               category === '📦 Погрущики' ? 'м.ч.' : 'км.'
    }

    const fetchData = async (objectId) => {
        try {
            setLoading(true)
            
            // Запрос операций
            const operationsResponse = await axios.post('/api/operations', { _id: objectId })
            const sortedOperations = operationsResponse.data.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            )
            console.log('Операции:', sortedOperations)
            setOperations(sortedOperations)

            // Запрос выдачи запчастей
            const ordersResponse = await axios.post('/api/orders', { _id: objectId })
            const sortedOrders = ordersResponse.data.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            )
            console.log('Выдача запчастей:', sortedOrders)
            setOrders(sortedOrders)

            // Запрос заявок
            const requestsResponse = await axios.post('/api/historyReqs/findObj', { _id: objectId })
            const sortedRequests = requestsResponse.data.sort((a, b) => 
                new Date(b.dateEnd) - new Date(a.dateEnd)
            )
            console.log('Заявки:', sortedRequests)
            setRequests(sortedRequests)

        } catch (error) {
            console.error('Ошибка загрузки данных:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (selectedObject) {
            fetchData(selectedObject)
        }
    }, [selectedObject])

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

    const getOrderTypeClass = (type) => {
        switch (type) {
            case 'operation':
                return 'order-operation';
            case 'manual':
                return 'order-manual';
            case 'request':
                return 'order-request';
            default:
                return 'order-default';
        }
    };

    const getOrderTypeText = (type) => {
        switch (type) {
            case 'operation':
                return 'По операции';
            case 'manual':
                return 'Ручная выдача';
            case 'request':
                return 'По заявке';
            default:
                return 'Выдача запчастей';
        }
    };

    const getUrgencyClass = (urgency) => {
        switch (urgency) {
            case 'Срочно':
                return 'request-urgent';
            case 'Не срочно':
                return 'request-normal';
            case 'Закрыта':
                return 'request-closed';
            default:
                return 'request-default';
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

    useEffect(() => {
        if (orders.length > 0) {
            // Анимация точек на таймлайне заказов
            anime({
                targets: '.orders-timeline-point',
                opacity: [0, 1],
                translateY: [20, 0],
                delay: anime.stagger(100),
                duration: 800,
                easing: 'easeOutElastic(1, .5)'
            });

            // Анимация линии заказов
            anime({
                targets: '.orders-timeline::after',
                scaleX: [0, 1],
                duration: 1000,
                easing: 'easeOutExpo'
            });

            // Анимация контента заказов
            anime({
                targets: '.orders-timeline-content',
                scale: [0.8, 1],
                opacity: [0, 1],
                delay: anime.stagger(150),
                duration: 800,
                easing: 'easeOutElastic(1, .5)'
            });
        }
    }, [orders]);

    // Группируем объекты по категориям
    const groupedObjects = visibleObjects?.reduce((acc, obj) => {
        const category = obj.catagory || '📦 Другое';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(obj);
        return acc;
    }, {});

    // Сортируем категории
    const sortedCategories = Object.keys(groupedObjects || {}).sort((a, b) => {
        const order = {
            '🚜': 1,  // Трактора
            '🔆': 2,  // Комбайны
            '💧': 3,  // Опрыскиватели
            '📦': 4,  // Погрузчики
            '🏠': 5,  // Здания
            '🚗': 6   // Автомобили
        };
        return (order[a.charAt(0)] || 99) - (order[b.charAt(0)] || 99);
    });

    return (
        <div className="timeline-operations">
            <div className="object-selector">
                <select 
                    value={selectedObject} 
                    onChange={(e) => setSelectedObject(e.target.value)}
                    className="styled-select"
                >
                    <option value="">Выберите объект</option>
                    {sortedCategories.map(category => (
                        <optgroup key={category} label={category}>
                            {groupedObjects[category]
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(obj => (
                                    <option key={obj._id} value={obj._id}>
                                        {obj.name}
                                    </option>
                                ))
                            }
                        </optgroup>
                    ))}
                </select>
            </div>

            {loading && <div className="loading">Загрузка...</div>}

            {/* Операции */}
            {operations.length > 0 && (
                <>
                <h2 className="timeline-title">История опреаций</h2>
                <div className="timeline operations-timeline">
                    {operations.map((operation) => (
                        <div key={operation._id} className="timeline-point">
                            <div className={`timeline-content ${getOperationTypeClass(operation.type)}`}>
                                <h3>{operation.type}</h3>
                                <p>Дата: {new Date(operation.date).toLocaleDateString()}</p>
                                {operation.executors && (
                                    <p>Исполнители: {operation.executors.join(', ')}</p>
                                )}
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
                </>
            )}

            {/* Выдача запчастей */}
            {orders.length > 0 && (
                <>
                    <h2 className="timeline-title">История выдачи запчастей</h2>
                    <div className="timeline orders-timeline">
                        {orders.map((order) => (
                            <div key={order._id} className="timeline-point">
                                <div className={`timeline-content orders-content ${getOrderTypeClass(order.operationType)}`}>
                                    <h3>{getOrderTypeText(order.operationType)}</h3>
                                    <p>Дата: {new Date(order.date).toLocaleDateString()}</p>
                                    <p>Получатель: {order.workerName}</p>
                                    <div className="part-details">
                                        <h4>Информация о запчасти:</h4>
                                        <p>Наименование: {order.part.name}</p>
                                        <p>Категория: {order.part.catagory}</p>
                                        <p>Количество: {order.countPart} {order.description}</p>
                                        {order.part.manufacturer && (
                                            <p>Производитель: {order.part.manufacturer}</p>
                                        )}
                                        {order.part.serialNumber && (
                                            <p>Серийный номер: {order.part.serialNumber}</p>
                                        )}
                                        {order.part.sellNumber && (
                                            <p>Номер продажи: {order.part.sellNumber}</p>
                                        )}
                                        {order.part.sum > 0 && (
                                            <p style={{color: '#FA5C62'}}>Стоимость: {order.part.sum} б.р.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Заявки */}
            {requests.length > 0 && (
                <>
                    <h2 className="timeline-title">История заявок</h2>
                    <div className="timeline requests-timeline">
                        {requests.map((request) => (
                            <div key={request._id} className="timeline-point">
                                <div className={`timeline-content requests-content ${getUrgencyClass(request.urgency)}`}>
                                    <h3>Заявка {request.urgency}</h3>
                                    <p>Дата начала: {new Date(request.dateBegin).toLocaleDateString()}</p>
                                    <p>Дата завершения: {new Date(request.dateEnd).toLocaleDateString()}</p>
                                    <div className="request-parts">
                                        <h4>Запрошенные запчасти:</h4>
                                        <ul>
                                            {request.parts.map((part, index) => (
                                                <li key={part._id || index}>
                                                    <p>Наименование: {part.name}</p>
                                                    <p>Категория: {part.catagory}</p>
                                                    <p>Количество: {part.count} шт.</p>
                                                    {part.manufacturer && (
                                                        <p>Производитель: {part.manufacturer}</p>
                                                    )}
                                                    {part.contact?.name && (
                                                        <p>Контакт: {part.contact.name}</p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default TimelineOperations 