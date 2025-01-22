'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../scss/wialonControl.scss';

export default function WialonControl({ onSelectTrack, onClose }) {
    const [sid, setSid] = useState(null);
    const [units, setUnits] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0]; // Формат YYYY-MM-DD
    });

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

    // Функция загрузки треков
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

            if (response.data.success) {
                setTracks(response.data.tracks);
                onSelectTrack(response.data.tracks);
            }
        } catch (error) {
            console.error('Ошибка загрузки треков:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
        </div>
    );
} 