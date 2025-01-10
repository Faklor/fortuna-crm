'use client'
import { useState, useEffect } from 'react';
import '../scss/createWork.scss';
import * as turf from '@turf/turf';
import axios from 'axios';

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
    fieldArea
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

    const handleAreaSelectionChange = (useFullField) => {
        setWorkData(prev => ({
            ...prev,
            useFullField,
            area: useFullField ? fieldArea : (processingArea?.area || 0),
            processingArea: useFullField ? null : processingArea
        }));
        
        if (useFullField) {
            setIsDrawingProcessingArea(false);
        }
    };

    const calculateArea = (processingArea) => {
        if (!processingArea || !processingArea.coordinates) return 0;
        
        try {
            const geojsonPolygon = {
                type: "Feature",
                properties: {},
                geometry: processingArea
            };
            
            const areaInSquareMeters = turf.area(geojsonPolygon);
            return Math.round((areaInSquareMeters / 10000) * 100) / 100;
        } catch (error) {
            console.error('Error calculating area:', error);
            return 0;
        }
    };

    useEffect(() => {
        if (processingArea) {
            const area = calculateArea(processingArea);
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
        
        if (!workData.useFullField && !workData.processingArea) {
            alert('Необходимо выделить область обработки или выбрать всё поле');
            return;
        }

        try {
            const dataToSave = {
                ...workData,
                processingArea: {
                    type: 'Polygon',
                    coordinates: workData.useFullField ? [[]] : workData.processingArea.coordinates
                },
                area: workData.useFullField ? fieldArea : workData.area
            };

            onSave(dataToSave);
        } catch (error) {
            console.error('Error preparing work data:', error);
            alert('Ошибка при подготовке данных работы');
        }
    };

    return (
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
                            <option value="organic_fertilizing">Внесение органических удобрений</option>
                            <option value="mineral_fertilizing">Внесение минеральных удобрений</option>
                            <option value="harrowing">Боронование</option>
                            <option value="deep_loosening">Глубокое рыхление</option>
                            <option value="disking">Дискование</option>
                            <option value="cultivation">Культивация</option>
                            <option value="peeling">Лущение</option>
                            <option value="plowing">Вспашка</option>
                            <option value="rolling">Прокатывание</option>
                            <option value="seeding">Посев</option>
                            <option value="planting">Посадка</option>
                            <option value="chemical_treatment">Хим. обработка</option>
                            <option value="spraying">Опрыскивание</option>
                            <option value="harvesting">Уборка</option>
                            <option value="chiseling">Чизелевание</option>
                            <option value="stone_separation">Сепарация камней</option>
                            <option value="ridge_cutting">Нарезка гребней</option>
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
                                className={`area-btn ${!workData.useFullField ? 'active' : ''}`}
                                onClick={() => handleAreaSelectionChange(false)}
                            >
                                Выбрать зону
                            </button>
                            <button
                                type="button"
                                className={`area-btn ${workData.useFullField ? 'active' : ''}`}
                                onClick={() => handleAreaSelectionChange(true)}
                            >
                                Всё поле
                            </button>
                        </div>
                        
                        {!workData.useFullField && (
                            <button 
                                type="button"
                                onClick={() => setIsDrawingProcessingArea(true)}
                                className={workData.processingArea ? 'area-selected' : ''}
                            >
                                {workData.processingArea ? 'Область выделена ✓' : 'Выделить территорию обработки'}
                            </button>
                        )}

                        {workData.processingArea && (
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
                            {Array.isArray(workers) && workers.map(worker => (
                                <option key={worker._id} value={worker._id}>
                                    {worker.name || worker.properties?.Name || 'Без имени'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group equipment-group multiple-select-hint">
                        <label>Техника:</label>
                        <select
                            multiple
                            value={workData.equipment || []}
                            onChange={(e) => setWorkData({
                                ...workData,
                                equipment: Array.from(e.target.selectedOptions, option => option.value)
                            })}
                        >
                            {Array.isArray(equipment) && equipment.map(tech => (
                                <option key={tech._id} value={tech._id}>
                                    {tech.catagory ? `${tech.catagory}` : ''} {tech.name}
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
    );
}

// Экспортируем функцию и компонент
export { handleProcessingAreaUpdate };
export default CreateWork; 