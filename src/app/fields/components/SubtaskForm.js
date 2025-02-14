import React, { useState, useEffect } from 'react';
import WialonControl from './WialonControl';
import * as turf from '@turf/turf';
import axios from 'axios';

export default function SubtaskForm({ 
    onSubmit, 
    onCancel, 
    workArea,
    maxArea,
    onWialonTrackSelect,
    preselectedWorkers = [],
    preselectedEquipment = []
}) {
    const [formData, setFormData] = useState({
        plannedDate: new Date().toISOString().split('T')[0],
        workers: preselectedWorkers.map(w => w._id),
        equipment: preselectedEquipment.map(e => e._id),
        area: '',
        tracks: []
    });

    const [workers, setWorkers] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [showWialonControl, setShowWialonControl] = useState(false);
    const [tracks, setTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Добавим функцию сортировки оборудования
    const sortEquipment = (equipment) => {
        if (!Array.isArray(equipment)) {
            console.error('Equipment is not an array:', equipment);
            return [];
        }

        // Определяем порядок категорий
        const categoryOrder = {
            '🚜 Трактора': 1,  // Тракторы
            '🚛 Грузовики': 2,  // Грузовики
            '🚃 Прицепы': 3,  // Прицепы
            '🛠️ Оборудование': 4,  // Оборудование
            '🌾 Другое': 5   // Другое
        };

        return [...equipment].sort((a, b) => {
            // Получаем первый эмодзи из категории или присваиваем последний приоритет
            const getCategoryPriority = (item) => {
                const emoji = item?.catagory?.split(' ')[0] || '🌾';
                return categoryOrder[emoji] || 999;
            };

            const priorityA = getCategoryPriority(a);
            const priorityB = getCategoryPriority(b);

            // Сначала сортируем по категории
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // Если категории одинаковые, сортируем по имени
            return (a?.name || '').localeCompare(b?.name || '');
        });
    };

    // Загружаем полный список работников и техники
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                
                const [workersRes, techesRes] = await Promise.all([
                    axios.get('/api/workers'),
                    axios.get('/api/teches')
                ]);
                
                // Устанавливаем работников
                if (Array.isArray(workersRes.data)) {
                    setWorkers(workersRes.data);
                } else {
                    console.error('Workers data is not valid:', workersRes.data);
                    setWorkers([]);
                }
                
                // Устанавливаем технику
                const techArray = techesRes.data.tech || [];
                if (Array.isArray(techArray)) {
                    const sortedEquipment = techArray.sort((a, b) => {
                        const catA = a.catagory || '🌾 Другое';
                        const catB = b.catagory || '🌾 Другое';
                        return catA.localeCompare(catB);
                    });
                    setEquipment(sortedEquipment);
                } else {
                    console.error('Tech array is not valid:', techArray);
                    setEquipment([]);
                }

                // Устанавливаем предвыбранные значения
                setFormData(prev => ({
                    ...prev,
                    workers: preselectedWorkers.map(w => w._id),
                    equipment: preselectedEquipment.map(e => e._id)
                }));
            } catch (error) {
                console.error('Error loading data:', error);
                setWorkers([]);
                setEquipment([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [preselectedWorkers, preselectedEquipment]);

    // Расчет площади при изменении треков или оборудования
    useEffect(() => {
        if (tracks.length > 0) {
            calculateArea();
        }
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

           
        }
    };

    const handleWialonTrackSelect = (newTracks) => {
        setTracks(newTracks);
        setFormData(prev => ({
            ...prev,
            tracks: newTracks
        }));
        if (typeof onWialonTrackSelect === 'function') {
            onWialonTrackSelect(newTracks);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Получаем полные данные о работниках и технике
        const selectedWorkers = workers.filter(w => formData.workers.includes(w._id));
        const selectedEquipment = equipment.filter(e => formData.equipment.includes(e._id));

        const subtaskData = {
            ...formData,
            // Сохраняем полные объекты вместо просто ID
            workers: selectedWorkers.map(worker => ({
                _id: worker._id,
                name: worker.name || worker.properties?.Name || 'Без имени'
            })),
            equipment: selectedEquipment.map(tech => ({
                _id: tech._id,
                name: tech.name,
                category: tech.catagory || '🌾 Другое',
                captureWidth: tech.captureWidth
            })),
            area: formData.area || null,
            tracks: tracks
        };

        try {
            await onSubmit(subtaskData);
        } catch (error) {
            console.error('Error submitting subtask:', error);
        }
    };

    // В рендере группируем оборудование по категориям
    const renderEquipmentOptions = () => {
        // Группируем оборудование по категориям
        const groupedEquipment = equipment.reduce((acc, tech) => {
            const category = tech.catagory || '🌾 Другое';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(tech);
            return acc;
        }, {});

        // Сортируем категории по приоритету
        const categoryOrder = {
            '🚜': 1, // Тракторы
            '🚛': 2, // Грузовики
            '🚃': 3, // Прицепы
            '🌾': 999 // Другое
        };

        return Object.entries(groupedEquipment)
            .sort((a, b) => {
                const priorityA = categoryOrder[a[0].split(' ')[0]] || 999;
                const priorityB = categoryOrder[b[0].split(' ')[0]] || 999;
                return priorityA - priorityB;
            })
            .map(([category, items]) => (
                <optgroup key={category} label={category}>
                    {items.map(tech => (
                        <option key={tech._id} value={tech._id}>
                            {tech.name}
                            {tech.captureWidth ? ` (${tech.captureWidth}м)` : ''}
                        </option>
                    ))}
                </optgroup>
            ));
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
                <label>Работники (предвыбраны из основной работы):</label>
                <select
                    multiple
                    value={formData.workers}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        workers: Array.from(e.target.selectedOptions, option => option.value)
                    }))}
                >
                    {workers.map(worker => (
                        <option 
                            key={worker._id} 
                            value={worker._id}
                        >
                            {worker.name || worker.properties?.Name || 'Без имени'}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group equipment-group">
                <label>Объекты* (предвыбраны из основной работы):</label>
                {isLoading ? (
                    <div>Загрузка объектов...</div>
                ) : (
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
                                {tech.name}
                                {tech.captureWidth ? ` (${tech.captureWidth}м)` : ''}
                            </option>
                        ))}
                    </select>
                )}
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
                        isSubtaskMode={true}
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