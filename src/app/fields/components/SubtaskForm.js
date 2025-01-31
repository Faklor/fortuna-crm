import React, { useState, useEffect } from 'react';
import WialonControl from './WialonControl';
import * as turf from '@turf/turf';
import axios from 'axios';

export default function SubtaskForm({ onSubmit, onCancel, maxArea, workArea, onWialonTrackSelect }) {
    const [formData, setFormData] = useState({
        plannedDate: new Date().toISOString().split('T')[0],
        workers: [],
        equipment: [],
        processingArea: null,
        area: ''
    });
    const [showWialonControl, setShowWialonControl] = useState(false);
    const [useWialon, setUseWialon] = useState(false);
    const [workers, setWorkers] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [tracks, setTracks] = useState([]);

    // Загрузка работников и техники
    useEffect(() => {
        const loadData = async () => {
            try {
                const [workersRes, equipmentRes] = await Promise.all([
                    axios.get('/api/workers'),
                    axios.get('/api/teches')
                ]);
                setWorkers(workersRes.data || []);
                setEquipment(equipmentRes.data.tech || []);
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            }
        };
        loadData();
    }, []);

    // Расчет площади при изменении треков или оборудования
    useEffect(() => {
        calculateArea();
    }, [tracks, formData.equipment]);

    const calculateArea = () => {
        if (!tracks.length || !formData.equipment.length) return;

        const trailer = equipment
            .filter(tech => formData.equipment.includes(tech._id))
            .find(tech => tech.catagory?.includes('🚃 Прицепы') && tech.captureWidth);

        if (!trailer) return;

        const workingSegments = tracks.filter(segment => 
            Array.isArray(segment) && segment[0]?.isWorking
        );

        let totalLength = 0;
        let has3DData = false;

        workingSegments.forEach(segment => {
            if (segment.length < 2) return;

            // Создаем массив координат с учетом высоты
            const coordinates = segment
                .map(point => {
                    if (!point || 
                        typeof point.lon === 'undefined' || 
                        typeof point.lat === 'undefined') {
                        return null;
                    }
                    // Проверяем наличие высоты
                    if (point.altitude) {
                        has3DData = true;
                        return [point.lon, point.lat, point.altitude];
                    }
                    return [point.lon, point.lat];
                })
                .filter(coord => coord !== null);

            if (coordinates.length >= 2) {
                try {
                    let length;
                    if (coordinates[0].length === 3) {
                        // Если есть данные о высоте, используем 3D расчет
                        const points = coordinates.map(coord => 
                            turf.point([coord[0], coord[1]], { elevation: coord[2] })
                        );
                        
                        // Считаем длину с учетом рельефа
                        length = 0;
                        for (let i = 1; i < points.length; i++) {
                            const from = points[i - 1];
                            const to = points[i];
                            
                            // Расстояние по горизонтали
                            const horizontalDist = turf.distance(from, to, { units: 'meters' });
                            
                            // Разница высот
                            const heightDiff = Math.abs(
                                from.properties.elevation - to.properties.elevation
                            );
                            
                            // Теорема Пифагора для расчета реального расстояния
                            const realDist = Math.sqrt(
                                Math.pow(horizontalDist, 2) + Math.pow(heightDiff, 2)
                            );
                            
                            length += realDist;
                        }
                    } else {
                        // Если нет данных о высоте, считаем по плоскости
                        const line = turf.lineString(coordinates);
                        length = turf.length(line, { units: 'meters' });
                    }
                    
                    totalLength += length;
                } catch (error) {
                    console.error('Ошибка расчета длины сегмента:', error);
                }
            }
        });

        if (totalLength > 0) {
            const areaHectares = (totalLength * trailer.captureWidth) / 10000;
            
            setFormData(prev => ({
                ...prev,
                area: areaHectares.toFixed(2)
            }));

            // Добавляем информацию о типе расчета
            console.log(`Площадь рассчитана ${has3DData ? 
                'с учетом рельефа' : 
                'по плоскости'}`);
        }
    };

    const handleWialonTrackSelect = (newTracks) => {
        setTracks(newTracks);
        if (typeof onWialonTrackSelect === 'function') {
            onWialonTrackSelect(newTracks);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.plannedDate) {
            alert('Укажите дату выполнения');
            return;
        }
        if (formData.equipment.length === 0) {
            alert('Выберите хотя бы один объект');
            return;
        }
        if (parseFloat(formData.area) > maxArea) {
            alert(`Площадь не может превышать ${maxArea} га`);
            return;
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="subtask-form">
            <div className="form-group">
                <label htmlFor="plannedDate">Дата выполнения*:</label>
                <input
                    type="date"
                    id="plannedDate"
                    name="plannedDate"
                    value={formData.plannedDate}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        plannedDate: e.target.value
                    }))}
                    required
                />
            </div>

            <div className="form-group workers-group">
                <label>Работники:</label>
                <select
                    multiple
                    value={formData.workers}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        workers: Array.from(e.target.selectedOptions, option => option.value)
                    }))}
                >
                    {workers.map(worker => (
                        <option key={worker._id} value={worker._id}>
                            {worker.name || worker.properties?.Name || 'Без имени'}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group equipment-group">
                <label>Объекты*:</label>
                <select
                    multiple
                    value={formData.equipment}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        equipment: Array.from(e.target.selectedOptions, option => option.value)
                    }))}
                    required
                >
                    {equipment.map(tech => (
                        <option key={tech._id} value={tech._id}>
                            {tech.catagory ? `${tech.catagory.split(' ')[0]}` : ''} {tech.name}
                            {tech.captureWidth ? ` (${tech.captureWidth}м)` : ''}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group area-selection">
                <label>Территория обработки:</label>
                <div className="area-selection-controls">
                    <button
                        type="button"
                        onClick={() => setShowWialonControl(true)}
                    >
                        Выбрать из Wialon
                    </button>
                </div>

                {showWialonControl && (
                    <WialonControl 
                        onSelectTrack={handleWialonTrackSelect}
                        onClose={() => setShowWialonControl(false)}
                        workArea={workArea}
                    />
                )}

                {formData.area && (
                    <div className="calculated-area">
                        <label>Расчетная площадь:</label>
                        <span>{formData.area} га</span>
                    </div>
                )}
            </div>

            <div className="form-actions">
                <button type="submit">Создать</button>
                <button type="button" onClick={onCancel}>Отмена</button>
            </div>
        </form>
    );
} 