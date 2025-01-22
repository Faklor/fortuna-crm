'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../scss/wialonControl.scss';

export default function WialonControl({ onSelectTrack, onClose, fields }) {
    const [sid, setSid] = useState(null);
    const [units, setUnits] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // Формат YYYY-MM-DD
    });

    //console.log(fields);
    // Добавляем функцию проверки точки в полигоне
    const isPointInPolygon = (point, polygon) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];
            
            const intersect = ((yi > point[1]) !== (yj > point[1]))
                && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    // Авторизация в Wialon при монтировании компонента
    useEffect(() => {
        const authenticate = async () => {
            try {
                const response = await axios.get('/api/wialon/auth');
                if (response.data.success) {
                    setSid(response.data.data.sid);
                }
            } catch (error) {
                console.error('Ошибка авторизации Wialon:', error);
            }
        };
        authenticate();
    }, []);

    // Загрузка списка объектов после получения sid
    useEffect(() => {
        const loadUnits = async () => {
            if (!sid) return;
            try {
                const response = await axios.get(`/api/wialon/units?sid=${sid}`);
                if (response.data.success) {
                    setUnits(response.data.units);
                }
            } catch (error) {
                console.error('Ошибка загрузки объектов:', error);
            }
        };
        loadUnits();
    }, [sid]);

    // Загрузка треков при выборе объекта и даты
    const handleUnitSelect = async (unit) => {
        setSelectedUnit(unit);
        await loadTracks(unit.id, selectedDate);
    };

    // Загрузка треков при изменении даты
    const handleDateChange = async (date) => {
        setSelectedDate(date);
        if (selectedUnit) {
            await loadTracks(selectedUnit.id, date);
        }
    };

    // Модифицируем функцию загрузки треков
    const loadTracks = async (unitId, date) => {
        setIsLoading(true);
        try {
            const selectedDateTime = new Date(date);
            const startOfDay = Math.floor(selectedDateTime.setHours(0, 0, 0, 0) / 1000);
            const endOfDay = Math.floor(selectedDateTime.setHours(23, 59, 59, 999) / 1000);
            
            const response = await axios.get('/api/wialon/trips', {
                params: {
                    sid,
                    unitId,
                    dateFrom: startOfDay,
                    dateTo: endOfDay
                }
            });

            if (response.data.success && Array.isArray(response.data.tracks)) { 
                // Каждый элемент в tracks уже является точкой
                const pointsWithIntersections = response.data.tracks.map(point => {
                    // Проверяем каждое поле
                    const intersectingFields = fields.filter(field => 
                        isPointInPolygon(
                            [point.lon, point.lat], 
                            field.coordinates[0]
                        )
                    );

                    return {
                        ...point,
                        intersectsField: intersectingFields.length > 0,
                        intersectingFields
                    };
                });

                // Проверяем, есть ли хотя бы одна точка внутри какого-либо поля
                const hasIntersections = pointsWithIntersections.some(point => point.intersectsField);
                
                if (hasIntersections) {
                    // Находим все уникальные поля, с которыми есть пересечения
                    const allIntersectingFields = new Set();
                    pointsWithIntersections.forEach(point => {
                        if (point.intersectingFields) {
                            point.intersectingFields.forEach(field => {
                                allIntersectingFields.add(field._id);
                            });
                        }
                    });

                    // Выводим сообщение о пересечении
                    setDialog({
                        isOpen: true,
                        type: 'alert',
                        title: 'Обнаружено пересечение с полями',
                        message: `Трек пересекает ${allIntersectingFields.size} поле(й)`,
                        onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
                    });
                }
                
                setTracks(pointsWithIntersections);
                onSelectTrack(pointsWithIntersections);
            } else {
                console.warn('No tracks data in response:', response.data);
                setTracks([]);
                onSelectTrack([]);
            }
        } catch (error) {
            console.error('Ошибка загрузки треков:', error);
            setTracks([]);
            onSelectTrack([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Добавляем состояние для диалогового окна
    const [dialog, setDialog] = useState({
        isOpen: false,
        type: 'alert',
        title: '',
        message: '',
        onConfirm: () => {}
    });

    return (
        <div className="wialon-control">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>Объекты Wialon</h3>
                <button 
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '5px',
                        color: '#666'
                    }}
                >
                    ×
                </button>
            </div>

            <div className="date-selector">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="date-input"
                />
            </div>

            <div className="units-list">
                {units.map(unit => (
                    <div 
                        key={unit.id}
                        className={`unit-item ${selectedUnit?.id === unit.id ? 'selected' : ''}`}
                        onClick={() => handleUnitSelect(unit)}
                    >
                        {unit.nm}
                    </div>
                ))}
            </div>
            {isLoading && <div className="loading">Загрузка треков...</div>}

            {/* Добавляем диалоговое окно */}
            {dialog.isOpen && (
                <div className="dialog-overlay">
                    <div className="dialog-content">
                        <h4>{dialog.title}</h4>
                        <p>{dialog.message}</p>
                        <button onClick={dialog.onConfirm}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
} 