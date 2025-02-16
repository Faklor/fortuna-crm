'use client'
import { useState, useEffect, useMemo} from 'react';
import '../scss/createWork.scss';
import * as turf from '@turf/turf';
import axios from 'axios';
import { WORK_TYPES } from '../constants/workTypes';
import WialonControl from './WialonControl';
import { useSession } from 'next-auth/react';


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
    subFields,
    onWialonTrackSelect
}) {
    const { data: session } = useSession();

    const [workData, setWorkData] = useState({
        name: '',
        type: '',
        fieldId: selectedField?._id || '',
        plannedDate: new Date().toISOString().split('T')[0],
        description: '',
        processingArea: processingArea,
        area: 0,
        useFullField: false,
        useSubField: false,
        selectedSubFieldId: '',
        workers: [],
        equipment: [],
        useWialon: false,
        sendNotification: true
    });

    const [workers, setWorkers] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [showWialonControl, setShowWialonControl] = useState(false);

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
            useWialon: type === 'wialon',
            area: type === 'full' ? fieldArea : 
                  type === 'subfield' ? 0 : 
                  (processingArea?.area || 0),
            processingArea: type === 'custom' ? processingArea : null,
            selectedSubFieldId: type === 'subfield' ? prev.selectedSubFieldId : '',
        }));
        
        if (type === 'wialon') {
            setShowWialonControl(true);
            onWialonTrackSelect && onWialonTrackSelect([]);
        } else {
            setShowWialonControl(false);
            setIsDrawingProcessingArea(false);
            onWialonTrackSelect && onWialonTrackSelect([]);
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
                processingArea: processingAreaData,
                areaSelectionType: selectedSubField.properties?.Name || 'Без названия'
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
            // Получаем полную информацию о выбранных работниках и технике
            const selectedWorkers = workData.workers.map(workerId => {
                const worker = sortedWorkers.find(w => w._id === workerId);
                return {
                    _id: workerId,
                    name: worker?.name || worker?.properties?.Name || 'Без имени'
                };
            });

            const selectedEquipment = workData.equipment.map(equipId => {
                const equip = sortedEquipment.find(e => e._id === equipId);
                return {
                    _id: equipId,
                    name: equip?.name || '',
                    category: equip?.catagory || '',
                    captureWidth: equip?.captureWidth || null
                };
            });

            const dataToSave = {
                ...workData,
                processingArea: {
                    type: 'Polygon',
                    coordinates: workData.useFullField ? [[]] : 
                                workData.processingArea.coordinates
                },
                area: workData.useFullField ? fieldArea : workData.area,
                workers: selectedWorkers,
                equipment: selectedEquipment
            };

            // Отправляем уведомление только если включен чекбокс
            if (workData.sendNotification) {
                const message = `<b>🌱 Новая работа создана</b>

👤 Создал: <code>${session?.user?.name || 'Система'}</code>
📅 Планируемая дата: ${workData.plannedDate}
🏢 Поле: ${selectedField?.properties?.Name || 'Без названия'}
📋 Название: ${workData.name}
🔧 Тип: ${WORK_TYPES[workData.type] || workData.type}
📏 Площадь: ${dataToSave.area} га

${workData.description ? `<b>Описание:</b>\n${workData.description}\n` : ''}
${selectedWorkers.length > 0 ? `\n<b>Работники:</b>\n${selectedWorkers.map(w => `• ${w.name}`).join('\n')}` : ''}
${selectedEquipment.length > 0 ? `\n<b>Техника:</b>\n${selectedEquipment.map(e => `• ${e.name} (${e.category})`).join('\n')}` : ''}`;

                await axios.post('/api/telegram/sendNotification', { 
                    message,
                    chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM,
                    message_thread_id: 39,
                    parse_mode: 'HTML'
                });
            }

            // Сохраняем работу
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

    // Модифицируем обработчик для треков Wialon
    const handleWialonTrackSelect = (tracks) => {
        if (!tracks || tracks.length === 0) {
            onWialonTrackSelect && onWialonTrackSelect([]);
            return;
        }

        onWialonTrackSelect && onWialonTrackSelect(tracks);

        // Фильтруем только точки, которые пересекаются с выбранным полем
        const fieldTracks = tracks.filter(point => 
            point.intersectingFields?.some(field => field._id === selectedField._id)
        );

        if (fieldTracks.length > 0) {
            // Создаем область обработки из трека
            const processingAreaFromTrack = {
                type: 'Polygon',
                coordinates: [fieldTracks.map(point => [point.lon, point.lat])]
            };

            const area = calculateArea(processingAreaFromTrack);
            
            setWorkData(prev => ({
                ...prev,
                processingArea: processingAreaFromTrack,
                area: area
            }));
        }
    };

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
                                className={`area-btn ${!workData.useFullField && !workData.useSubField && !workData.useWialon ? 'active' : ''}`}
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
                            <button
                                type="button"
                                className={`area-btn ${workData.useWialon ? 'active' : ''}`}
                                onClick={() => handleAreaSelectionChange('wialon')}
                            >
                                По Wialon
                            </button>
                        </div>
                        
                        {!workData.useFullField && !workData.useSubField && !workData.useWialon && (
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

                    {showWialonControl && (
                        <WialonControl 
                            onSelectTrack={handleWialonTrackSelect}
                            onClose={() => {
                                setShowWialonControl(false);
                                onWialonTrackSelect && onWialonTrackSelect([]);
                            }}
                            fields={[selectedField]}
                        />
                    )}

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

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input 
                                type="checkbox"
                                checked={workData.sendNotification}
                                onChange={(e) => setWorkData(prev => ({
                                    ...prev,
                                    sendNotification: e.target.checked
                                }))}
                            />
                            Отправить уведомление в Telegram
                        </label>
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