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

        // Находим прицеп с шириной захвата
        const trailer = equipment
            .filter(tech => formData.equipment.includes(tech._id))
            .find(tech => tech.catagory?.includes('🚃 Прицепы') && tech.captureWidth);

        if (!trailer) return;

        // Считаем только для рабочих сегментов
        const workingSegments = tracks.filter(segment => 
            Array.isArray(segment) && segment[0]?.isWorking
        );

        let totalLength = 0;
        workingSegments.forEach(segment => {
            const line = turf.lineString(segment.map(point => [point.lon, point.lat]));
            totalLength += turf.length(line, { units: 'meters' });
        });

        // Расчет площади: длина * ширина захвата / 10000 (для перевода в га)
        const areaHectares = (totalLength * trailer.captureWidth) / 10000;
        
        setFormData(prev => ({
            ...prev,
            area: areaHectares.toFixed(2)
        }));
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