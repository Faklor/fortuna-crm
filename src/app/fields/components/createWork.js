'use client'
import { useState, useEffect, useMemo } from 'react';
import '../scss/createWork.scss';
import * as turf from '@turf/turf';
import axios from 'axios';
import { WORK_TYPES } from '../constants/workTypes';

// Определяем функцию вне компонента
const handleProcessingAreaUpdate = (setWorkData, coordinates) => {
    
    setWorkData(prev => ({
        ...prev,
        processingArea: {
            type: 'Polygon',
            coordinates: [coordinates]
        }
    }));
};

function CreateWork({ 
    onClose, 
    onSave, 
    processingArea,
    isDrawingProcessingArea, 
    setIsDrawingProcessingArea,
    selectedField,
    fieldArea,
    subFields
}) {
    const [workData, setWorkData] = useState({
        name: '',
        type: '',
        fieldId: selectedField?._id || '',
        plannedDate: '',
        description: '',
        processingArea: processingArea,
        area: 0,
        useFullField: false,
        useSubField: false,
        selectedSubFieldId: '',
        workers: [],
        equipment: []
    });

    const [workers, setWorkers] = useState([]);
    const [equipment, setEquipment] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [workersRes, equipmentRes] = await Promise.all([
                    axios.get('/api/workers'),
                    axios.get('/api/teches')
                ]);
                
                setWorkers(Array.isArray(workersRes.data) ? workersRes.data : []);
                setEquipment(Array.isArray(equipmentRes.data.tech) ? equipmentRes.data.tech : []);
            } catch (error) {
                console.error('Error loading workers and equipment:', error);
                setWorkers([]);
                setEquipment([]);
            }
        };
        loadData();
        
    }, []);

    const handleAreaSelectionChange = (type) => {
        setWorkData(prev => ({
            ...prev,
            useFullField: type === 'full',
            useSubField: type === 'subfield',
            area: type === 'full' ? fieldArea : 
                  type === 'subfield' ? 0 : 
                  (processingArea?.area || 0),
            processingArea: type === 'custom' ? processingArea : null,
            selectedSubFieldId: type === 'subfield' ? prev.selectedSubFieldId : ''
        }));
        
        if (type !== 'custom') {
            setIsDrawingProcessingArea(false);
        }
    };

    const calculateArea = (processingArea, isSubField = false) => {
        if (!processingArea || !processingArea.coordinates) return 0;
        
        try {
            // Проверяем и нормализуем координаты
            let coordinates = processingArea.coordinates[0];
            
            // Для ручного выделения: needsSwap = coordinates[0][0] > 90
            // Для подполей: needsSwap = coordinates[0][0] < 90
            const needsSwap = isSubField 
                ? Math.abs(coordinates[0][0]) < 90
                : Math.abs(coordinates[0][0]) > 90;
            
            // Если нужно, меняем порядок координат
            if (needsSwap) {
                coordinates = coordinates.map(coord => [coord[1], coord[0]]);
            }

            // Создаем полигон с правильными координатами
            const geojsonPolygon = {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Polygon",
                    coordinates: [coordinates]
                }
            };
            
            const areaInSquareMeters = turf.area(geojsonPolygon);
            // Округляем до 2 знаков после запятой
            return Math.round((areaInSquareMeters / 10000) * 100) / 100;
        } catch (error) {
            console.error('Error calculating area:', error);
            console.error('Coordinates that caused error:', processingArea.coordinates);
            return 0;
        }
    };

    const handleSubFieldSelect = (subFieldId) => {
        const selectedSubField = subFields.find(sf => sf._id === subFieldId);
        if (selectedSubField) {
            // Создаем правильную структуру для расчета площади
            const processingAreaData = {
                type: 'Polygon',
                coordinates: [selectedSubField.coordinates]
            };
            
            const area = calculateArea(processingAreaData, true);
            
            setWorkData(prev => ({
                ...prev,
                selectedSubFieldId: subFieldId,
                area: area,
                processingArea: processingAreaData
            }));
        }
    };

    useEffect(() => {
        if (processingArea) {
            const area = calculateArea(processingArea, false);
            setWorkData(prev => ({
                ...prev,
                processingArea: processingArea,
                area: area
            }));
        }
    }, [processingArea]);

    useEffect(() => {
        setWorkData(prev => ({
            ...prev,
            fieldId: selectedField?._id || ''
        }));
    }, [selectedField]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!workData.useFullField && !workData.useSubField && !workData.processingArea) {
            alert('Необходимо выбрать область обработки');
            return;
        }

        try {
            const dataToSave = {
                ...workData,
                processingArea: {
                    type: 'Polygon',
                    coordinates: workData.useFullField ? [[]] : 
                               workData.processingArea.coordinates
                },
                area: workData.useFullField ? fieldArea : workData.area
            };

            onSave(dataToSave);
        } catch (error) {
            console.error('Error preparing work data:', error);
            alert('Ошибка при подготовке данных работы');
        }
    };

    // Сортировка работников по алфавиту
    const sortedWorkers = useMemo(() => {
        if (!Array.isArray(workers)) return [];
        
        return [...workers].sort((a, b) => {
            const nameA = (a.name || a.properties?.Name || 'Без имени').toLowerCase();
            const nameB = (b.name || b.properties?.Name || 'Без имени').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [workers]);

    // Сортировка техники по категории и имени
    const sortedEquipment = useMemo(() => {
        if (!Array.isArray(equipment)) return [];
        
        return [...equipment].sort((a, b) => {
            // Сначала сортируем по категории
            const categoryA = (a.catagory || '').toLowerCase();
            const categoryB = (b.catagory || '').toLowerCase();
            
            if (categoryA !== categoryB) {
                return categoryA.localeCompare(categoryB);
            }
            
            // Если категории одинаковые, сортируем по имени
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [equipment]);

    return (
        <>
        <div className="create-work-overlay" />
        <div className="create-work-modal">
            <div className="create-work-content">
                <h2>Создание работы</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Название работы:</label>
                        <input
                            type="text"
                            value={workData.name}
                            onChange={(e) => setWorkData({ ...workData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Тип работы:</label>
                        <select
                            value={workData.type}
                            onChange={(e) => setWorkData({ ...workData, type: e.target.value })}
                            required
                        >
                            <option value="">Выберите тип работы</option>
                            {Object.entries(WORK_TYPES).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Планируемая дата:</label>
                        <input
                            type="date"
                            value={workData.plannedDate}
                            onChange={(e) => setWorkData({ ...workData, plannedDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Описание:</label>
                        <textarea
                            value={workData.description}
                            onChange={(e) => setWorkData({ ...workData, description: e.target.value })}
                        />
                    </div>

                    <div className="form-group area-selection">
                        <label>Территория обработки:</label>
                        <div className="area-selection-controls">
                            <button
                                type="button"
                                className={`area-btn ${!workData.useFullField && !workData.useSubField ? 'active' : ''}`}
                                onClick={() => handleAreaSelectionChange('custom')}
                            >
                                Выбрать зону
                            </button>
                            <button
                                type="button"
                                className={`area-btn ${workData.useFullField ? 'active' : ''}`}
                                onClick={() => handleAreaSelectionChange('full')}
                            >
                                Всё поле
                            </button>
                            <button
                                type="button"
                                className={`area-btn ${workData.useSubField ? 'active' : ''}`}
                                onClick={() => handleAreaSelectionChange('subfield')}
                            >
                                По подполю
                            </button>
                        </div>
                        
                        {!workData.useFullField && !workData.useSubField && (
                            <button 
                                type="button"
                                onClick={() => setIsDrawingProcessingArea(true)}
                                className={workData.processingArea ? 'area-selected' : ''}
                            >
                                {workData.processingArea ? 'Область выделена ✓' : 'Выделить территорию обработки'}
                            </button>
                        )}

                        {workData.useSubField && (
                            <div className="form-group">
                                <label>Выберите подполе:</label>
                                <select
                                    value={workData.selectedSubFieldId}
                                    onChange={(e) => handleSubFieldSelect(e.target.value)}
                                    required={workData.useSubField}
                                >
                                    <option value="">Выберите подполе</option>
                                    {subFields
                                        .filter(subField => subField.properties.parentId === selectedField._id)
                                        .map(subField => (
                                            <option key={subField._id} value={subField._id}>
                                                {subField.properties.Name || `Подполе ${subField._id}`}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        )}

                        {(workData.processingArea || workData.useFullField || workData.selectedSubFieldId) && (
                            <div className="form-group">
                                <label>Площадь обработки:</label>
                                <span>{workData.area} га</span>
                            </div>
                        )}
                    </div>

                    <div className="form-group workers-group multiple-select-hint">
                        <label>Работники:</label>
                        <select
                            multiple
                            value={workData.workers || []}
                            onChange={(e) => setWorkData({
                                ...workData,
                                workers: Array.from(e.target.selectedOptions, option => option.value)
                            })}
                        >
                            {sortedWorkers.map(worker => (
                                <option key={worker._id} value={worker._id}>
                                    {worker.name || worker.properties?.Name || 'Без имени'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group equipment-group multiple-select-hint">
                        <label>Объекты:</label>
                        <select
                            multiple
                            value={workData.equipment || []}
                            onChange={(e) => setWorkData({
                                ...workData,
                                equipment: Array.from(e.target.selectedOptions, option => option.value)
                            })}
                        >
                            {sortedEquipment.map(tech => (
                                <option key={tech._id} value={tech._id}>
                                    {tech.catagory ? `${tech.catagory.split(' ')[0]}` : ''} {tech.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="button-group">
                        <button type="submit">Сохранить</button>
                        <button type="button" onClick={onClose}>Отмена</button>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
}

// Экспортируем функцию и компонент
export { handleProcessingAreaUpdate };
export default CreateWork; 