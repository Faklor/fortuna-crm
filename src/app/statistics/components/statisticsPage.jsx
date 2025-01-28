'use client'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { wialonDateToTimestamp } from '@/utils/wialon'
import '../scss/statistics.scss'
import TimelineOperations from './timelineOperations'

export default function StatisticsPage({
    visibleParts,
    visibleWorkers,
    visibleObjects,
    visibleRequisition,
    visibleHistoryReq,
    visibleOrders,
    visibleOperations
}) {
    const [wialonData, setWialonData] = useState({
        sid: null,
        units: [],
        drivers: []
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Выносим логику загрузки данных в отдельную функцию
    const fetchWialonData = useCallback(async (existingSid = null) => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Используем существующий SID или получаем новый
            let sid = existingSid;
            if (!sid) {
                const authResponse = await axios.get('/api/wialon/auth');
                if (!authResponse.data.success) {
                    throw new Error('Failed to authenticate with Wialon');
                }
                sid = authResponse.data.data.sid;
            }

            // Параллельные запросы для ускорения загрузки
            const [unitsResponse, driversResponse] = await Promise.all([
                axios.get(`/api/wialon/units?sid=${sid}`),
                axios.get(`/api/wialon/drivers?sid=${sid}`)
            ]);

            if (!unitsResponse.data.success) {
                throw new Error('Failed to fetch units');
            }

            const units = unitsResponse.data.units;
            const drivers = driversResponse.data.drivers;
            const unitsWithDrivers = units.filter(u => u.prms?.avl_driver?.v);
           
            setWialonData(prev => ({
                sid,
                units,
                drivers: driversResponse.data.success ? driversResponse.data.drivers : []
            }));

            setLastUpdate(new Date());
            return true;

        } catch (error) {
            console.error('❌ Error fetching Wialon data:', error);
            // Если ошибка связана с авторизацией, сбрасываем SID
            if (error.message.includes('auth') || error.response?.status === 401) {
                setWialonData(prev => ({ ...prev, sid: null }));
            }
            setError(error.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Эффект для начальной загрузки данных
    useEffect(() => {
        fetchWialonData();
    }, [fetchWialonData]);

    // Эффект для периодического обновления
    useEffect(() => {
        let intervalId;

        const startPolling = async () => {
            if (wialonData.sid) {
                intervalId = setInterval(async () => {
                    const success = await fetchWialonData(wialonData.sid);
                    if (!success) {
                        clearInterval(intervalId);
                    }
                }, 30000); // Обновление каждые 30 секунд
            }
        };

        startPolling();

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [wialonData.sid, fetchWialonData]);

    // Добавляем функцию для получения треков
    const fetchUnitTrips = async (unitId) => {
        try {
            // Получаем текущую дату
            const currentDate = new Date();
            
            // Устанавливаем начало текущего дня (00:00:00)
            const startDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate()
            );
            startDate.setHours(0, 0, 0, 0);

            // Устанавливаем конец текущего дня (23:59:59)
            const endDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate()
            );
            endDate.setHours(23, 59, 59, 999);

            // Преобразуем в UNIX timestamp (секунды)
            const dateFrom = Math.floor(startDate.getTime() / 1000);
            const dateTo = Math.floor(endDate.getTime() / 1000);

            // Форматируем дату в 24-часовом формате
            const formatDate = (date) => {
                return date.toLocaleString('ru-RU', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
            };

            const response = await axios.get('/api/wialon/trips', {
                params: {
                    sid: wialonData.sid,
                    unitId: unitId,
                    dateFrom: dateFrom,
                    dateTo: dateTo
                }
            });
           

            return {
                ...response.data,
                period: {
                    from: formatDate(startDate),
                    to: formatDate(endDate)
                }
            };
        } catch (error) {
            console.error('Error fetching tracks:', error);
            return null;
        }
    };

    // Добавляем обработчик клика по карточке ТС
    const handleUnitClick = async (unitId) => {
        const tripsData = await fetchUnitTrips(unitId);
    };

    const renderStatistics = (units) => {
        const onlineUnits = units.filter(unit => unit.netconn);
        const offlineUnits = units.filter(unit => !unit.netconn);
        
        // Проверяем наличие водителя через датчики
        const unitsWithDriver = units.filter(unit => {
            const driverSensor = Object.values(unit.sens || {}).find(s => s.t === "driver");
            if (!driverSensor) return false;
            
            const hasAssignedDriver = unit.prms?.avl_driver?.v && unit.prms.avl_driver.v !== "0";
            return hasAssignedDriver;
        });

        const unitsWithoutDriver = units.filter(unit => {
            const driverSensor = Object.values(unit.sens || {}).find(s => s.t === "driver");
            return !driverSensor || !unit.prms?.avl_driver?.v || unit.prms.avl_driver.v === "0";
        });

        // Функция для поиска имени водителя по коду
        const findDriverNameByCode = (driverCode) => {
            const driver = wialonData.drivers.find(d => d.code === driverCode);
            return driver ? driver.name : driverCode;
        };

        return (
            <>
                <div className="units-statistics">
                    <div className="stat-item">
                        <span>Всего ТС:</span>
                        <span>{units.length}</span>
                    </div>
                    <div className="stat-item online">
                        <span>На связи:</span>
                        <span>{onlineUnits.length}</span>
                    </div>
                    <div className="stat-item offline">
                        <span>Не на связи:</span>
                        <span>{offlineUnits.length}</span>
                    </div>
                </div>
                <div className="units-statistics">
                    <div className="stat-item with-driver">
                        <span>С водителем:</span>
                        <span>{unitsWithDriver.length}</span>
                    </div>
                    <div className="stat-item without-driver">
                        <span>Без водителя:</span>
                        <span>{unitsWithoutDriver.length}</span>
                    </div>
                </div>

                {/* Добавляем списки объектов */}
                <div className="units-lists">
                    <div className="units-list with-driver">
                        <h4>Объекты с водителем:</h4>
                        <div className="list-content">
                            {unitsWithDriver.map(unit => (
                                <div key={unit.id} className="list-item">
                                    <span className={unit.netconn ? 'online' : 'offline'}>●</span>
                                    <span className="name">{unit.nm}</span>
                                    <span className="driver">
                                        {findDriverNameByCode(unit.prms?.avl_driver?.v)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="units-list without-driver">
                        <h4>Объекты без водителя:</h4>
                        <div className="list-content">
                            {unitsWithoutDriver.map(unit => (
                                <div key={unit.id} className="list-item">
                                    <span className={unit.netconn ? 'online' : 'offline'}>●</span>
                                    <span className="name">{unit.nm}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderVehicleInfo = (pflds) => {
        if (!pflds) return null;
        const fields = {
            brand: pflds[3]?.v || 'Н/Д',
            model: pflds[2]?.v || 'Н/Д',
            year: pflds[4]?.v || 'Н/Д',
            color: pflds[5]?.v || 'Н/Д',
            type: pflds[6]?.v || 'Н/Д',
            engine: pflds[7]?.v || 'Н/Д',
            capacity: pflds[8]?.v || 'Н/Д',
            weight: pflds[9]?.v || 'Н/Д',
            axles: pflds[10]?.v || 'Н/Д'
        };
        
        return (
            <div className="vehicle-info">
                <h4>Характеристики ТС:</h4>
                <div className="info-grid">
                    <div className="info-item">
                        <span>Марка/Модель:</span>
                        <span>{fields.brand} {fields.model}</span>
                    </div>
                    <div className="info-item">
                        <span>Год выпуска:</span>
                        <span>{fields.year}</span>
                    </div>
                    <div className="info-item">
                        <span>Тип/Цвет:</span>
                        <span>{fields.type} / {fields.color}</span>
                    </div>
                    <div className="info-item">
                        <span>Объем двигателя:</span>
                        <span>{fields.engine} см³</span>
                    </div>
                    <div className="info-item">
                        <span>Грузоподъемность:</span>
                        <span>{fields.capacity} т</span>
                    </div>
                    <div className="info-item">
                        <span>Полная масса:</span>
                        <span>{fields.weight} т</span>
                    </div>
                    <div className="info-item">
                        <span>Количество осей:</span>
                        <span>{fields.axles}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderSensors = (sens) => {
        if (!sens) return null;
        return (
            <div className="sensors-info">
                <h4>Датчики:</h4>
                <div className="info-grid">
                    {Object.values(sens).map(sensor => (
                        <div key={sensor.id} className="info-item">
                            <span>{sensor.n}:</span>
                            <span>{sensor.m ? `(${sensor.m})` : ''}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderLastPosition = (pos, lmsg) => {
        if (!pos) return null;
        return (
            <div className="position-info">
                <h4>Последняя позиция:</h4>
                <div className="info-grid">
                    <div className="info-item">
                        <span>Координаты:</span>
                        <span>{pos.y}, {pos.x}</span>
                    </div>
                    <div className="info-item">
                        <span>Скорость:</span>
                        <span>{pos.s} км/ч</span>
                    </div>
                    <div className="info-item">
                        <span>Высота:</span>
                        <span>{pos.z} м</span>
                    </div>
                    {lmsg && (
                        <>
                            <div className="info-item">
                                <span>Внешнее питание:</span>
                                <span>{lmsg.p?.pwr_ext || 'Н/Д'} В</span>
                            </div>
                            <div className="info-item">
                                <span>Внутреннее питание:</span>
                                <span>{lmsg.p?.pwr_int || 'Н/Д'} В</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="statistics">
            <div className="statistics-container">
                <div className="header-container">
                    
                    <h1>Мониторинг транспорта</h1>
                    <div className="update-info">
                        {isLoading ? (
                            <span className="loading-indicator">Обновление...</span>
                        ) : (
                            <span className="last-update">
                                Последнее обновление: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Н/Д'}
                            </span>
                        )}
                        <button 
                            className="refresh-button"
                            onClick={() => fetchWialonData(wialonData.sid)}
                            disabled={isLoading}
                        >
                            Обновить
                        </button>
                    </div>
                </div>
                
                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                    </div>
                )}

                {/* Добавляем компонент временной линии */}
                <TimelineOperations visibleObjects={JSON.parse(visibleObjects)} />

                {wialonData.units.length > 0 && (
                    <>
                        {renderStatistics(wialonData.units)}
                        <div className="units-grid">
                            {wialonData.units.map((unit) => (
                                <div key={unit.id} className="stat-card" onClick={() => handleUnitClick(unit.id)}>
                                    <div className="card-header">
                                        <h3>{unit.nm}</h3>
                                        <span className={`status ${unit.netconn ? 'online' : 'offline'}`}>
                                            {unit.netconn ? 'На связи' : 'Не на связи'}
                                        </span>
                                    </div>
                                    
                                    {renderVehicleInfo(unit.pflds)}
                                    {renderLastPosition(unit.pos, unit.lmsg)}
                                    {renderSensors(unit.sens)}
                                    
                                    <div className="card-footer">
                                        <span>ID: {unit.id}</span>
                                        <span>Последнее обновление: {
                                            unit.mu ? new Date(unit.mu * 1000).toLocaleString() : 'Н/Д'
                                        }</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {!wialonData.units.length && !error && (
                    <div className="loading">
                        Загрузка данных...
                    </div>
                )}
            </div>
        </div>
    );
}