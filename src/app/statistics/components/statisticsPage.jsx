'use client'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { wialonDateToTimestamp } from '@/utils/wialon'
import '../scss/statistics.scss'
import TimelineOperations from './timelineOperations'
import StatisticsCharts from './statisticsCharts'

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


    return (
        <div className="statistics">
            <div className="statistics-container">

                <h1>Выборка по объекту</h1>
                {/* Добавляем компонент временной линии */}
                <TimelineOperations visibleObjects={JSON.parse(visibleObjects)} />

                {/* Добавляем компонент с графиками */}
                <StatisticsCharts 
                    operations={JSON.parse(visibleOperations)}
                    orders={JSON.parse(visibleOrders)}
                    requests={JSON.parse(visibleHistoryReq)}
                    parts={JSON.parse(visibleParts)}
                    objects={JSON.parse(visibleObjects)}
                />

                <div className="header-container">
                    
                    <h1>Данные из Wialon</h1>
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

               

                {wialonData.units.length > 0 && (
                    <>
                        {renderStatistics(wialonData.units)}
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