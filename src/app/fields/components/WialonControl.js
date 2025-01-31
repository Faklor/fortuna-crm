'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../scss/wialonControl.scss';
import * as turf from '@turf/turf';

export default function WialonControl({ onSelectTrack, onClose, workArea }) {
    const [sid, setSid] = useState(null);
    const [units, setUnits] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // Формат YYYY-MM-DD
    });
    const [workSegments, setWorkSegments] = useState([]);
    const [isMarkingMode, setIsMarkingMode] = useState(false);

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

    const analyzeTrackSegments = (tracks) => {
        if (!tracks || tracks.length < 2) return tracks;

        const segments = [];
        let currentSegment = [];
        let lastDirection = null;
        const DIRECTION_THRESHOLD = 15; // градусов
        const MIN_SPEED = 5; // км/ч
        const MAX_SPEED = 15; // км/ч
        const MIN_SEGMENT_LENGTH = 5; // минимальная длина сегмента в точках

        for (let i = 2; i < tracks.length; i++) {
            const point0 = tracks[i - 2];
            const point1 = tracks[i - 1];
            const point2 = tracks[i];

            // Вычисляем направление движения
            const currentDirection = turf.bearing(
                turf.point([point1.lon, point1.lat]),
                turf.point([point2.lon, point2.lat])
            );

            // Нормализуем направление в диапазоне 0-360
            const normalizedDirection = (currentDirection + 360) % 360;

            // Проверяем скорость
            const speed = point2.speed || 0;
            const isSpeedInRange = speed >= MIN_SPEED && speed <= MAX_SPEED;

            // Проверяем изменение направления
            const directionChange = lastDirection !== null ? 
                Math.abs(normalizedDirection - lastDirection) : 0;
            const isDirectionSteady = directionChange <= DIRECTION_THRESHOLD;

            // Определяем, является ли точка частью рабочего сегмента
            const isWorkingPoint = isSpeedInRange && isDirectionSteady;

            if (currentSegment.length === 0) {
                currentSegment.push({
                    ...point2,
                    isWorking: isWorkingPoint
                });
            } else if (currentSegment[0].isWorking === isWorkingPoint) {
                currentSegment.push({
                    ...point2,
                    isWorking: isWorkingPoint
                });
            } else {
                // Проверяем длину сегмента перед добавлением
                if (currentSegment.length >= MIN_SEGMENT_LENGTH) {
                    segments.push([...currentSegment]);
                } else {
                    // Если сегмент слишком короткий, присоединяем его к предыдущему
                    if (segments.length > 0) {
                        segments[segments.length - 1].push(...currentSegment);
                    } else {
                        segments.push([...currentSegment]);
                    }
                }
                currentSegment = [{
                    ...point2,
                    isWorking: isWorkingPoint
                }];
            }

            lastDirection = normalizedDirection;
        }

        // Добавляем последний сегмент
        if (currentSegment.length >= MIN_SEGMENT_LENGTH) {
            segments.push(currentSegment);
        } else if (segments.length > 0) {
            segments[segments.length - 1].push(...currentSegment);
        }

        return segments;
    };

    const calculateTurnAngle = (point1, point2, point0) => {
        if (!point0) return 0;
        
        const bearing1 = turf.bearing(
            turf.point(point0),
            turf.point(point1)
        );
        const bearing2 = turf.bearing(
            turf.point(point1),
            turf.point(point2)
        );
        
        let angle = Math.abs(bearing2 - bearing1);
        if (angle > 180) angle = 360 - angle;
        return angle;
    };

    const isWorkingCondition = (speed, turnAngle) => {
        // Примерные условия для определения рабочего режима:
        // 1. Скорость в рабочем диапазоне (например, 5-15 км/ч)
        // 2. Нет резких поворотов (угол < 45 градусов)
        return speed >= 5 && speed <= 15 && turnAngle < 45;
    };

    // Добавляем ручное управление сегментами
    const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(null);

    const toggleSegmentType = (segmentIndex) => {
        const newSegments = workSegments.map((segment, index) => {
            if (index === segmentIndex) {
                return segment.map(point => ({
                    ...point,
                    isWorking: !point.isWorking
                }));
            }
            return segment;
        });
        setWorkSegments(newSegments);
        // Передаем обновленные сегменты наверх
        onSelectTrack(newSegments);
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
                let tracks = response.data.tracks;
                
                // Если есть рабочая зона, фильтруем точки
                if (workArea && workArea.coordinates) {
                    const workPolygon = turf.polygon(workArea.coordinates);
                    
                    // Фильтруем точки, которые находятся внутри рабочей зоны
                    tracks = tracks.filter(point => {
                        const pt = turf.point([point.lon, point.lat]);
                        return turf.booleanPointInPolygon(pt, workPolygon);
                    });

                    // Добавляем флаг для точек внутри зоны
                    tracks = tracks.map(point => ({
                        ...point,
                        isInWorkArea: true
                    }));
                }

                // Анализируем треки и разбиваем на сегменты
                const segments = analyzeTrackSegments(tracks);
                setWorkSegments(segments);
                onSelectTrack(segments);
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

    const handleTrackSelect = (tracks) => {
        // Если есть зона работы, фильтруем точки
        if (workArea) {
            const filteredTracks = tracks.map(track => ({
                ...track,
                intersectsWork: isPointInWorkArea([track.lon, track.lat], workArea.coordinates[0])
            }));
            onSelectTrack(filteredTracks);
        } else {
            onSelectTrack(tracks);
        }
    };

    const isPointInWorkArea = (point, polygonCoords) => {
        const pt = point([point[0], point[1]]);
        const poly = turf.polygon([polygonCoords]);
        return turf.booleanPointInPolygon(pt, poly);
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

            <div className="segment-controls">
                <button 
                    onClick={() => setIsMarkingMode(!isMarkingMode)}
                    className={`mode-btn ${isMarkingMode ? 'active' : ''}`}
                >
                    {isMarkingMode ? 'Завершить разметку' : 'Разметить сегменты'}
                </button>
                
                {isMarkingMode && workSegments.length > 0 && (
                    <div className="segments-list">
                        {workSegments.map((segment, index) => (
                            <div 
                                key={index}
                                className={`segment-item ${segment[0].isWorking ? 'working' : 'non-working'}`}
                                onClick={() => toggleSegmentType(index)}
                            >
                                Сегмент {index + 1}: 
                                {segment[0].isWorking ? ' Рабочий' : ' Нерабочий'}
                            </div>
                        ))}
                    </div>
                )}
            </div>

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