'use client'
import '../scss/showFields.scss'
import axios from 'axios'
import { useState, useEffect, useMemo } from 'react'
import { area, polygon } from '@turf/turf'
import * as turf from '@turf/turf'
import CreateWork from './createWork'
import '../scss/fieldWorks.scss'

export default function ShowField({
    setShowFieldVisible, 
    selectedField,
    isDrawingMode,
    onDrawingModeChange,
    subFieldsVersion,
    onSubFieldSelect,
    selectedSubField,
    subFields,
    setSubFields,
    isEditingMainField,
    setIsEditingMainField,
    isEditingSubField,
    setIsEditingSubField,
    editingSubFieldId,
    setEditingSubFieldId,
    isDrawingProcessingArea,
    setIsDrawingProcessingArea,
    processingArea,
    setProcessingArea,
    onWorkStatusUpdate,
    onWorkSelect
}) {
    
    const [field, setField] = useState(null)
    const [fieldArea, setFieldArea] = useState(0)
    const [totalArea, setTotalArea] = useState(0)
    const [isExpanded, setIsExpanded] = useState(false)
    const [startY, setStartY] = useState(0)
    const [isEditingProperties, setIsEditingProperties] = useState(false)
    const [editedProperties, setEditedProperties] = useState({
        Name: '',
        descriptio: '',
        timestamp: '',
        begin: '',
        end: '',
        altitudeMo: '',
        tessellate: -1,
        extrude: 0,
        visibility: -1,
        drawOrder: null,
        icon: '',
        seasons: []
    })
    const [editingSubField, setEditingSubField] = useState(null);
    const [editingSubFieldName, setEditingSubFieldName] = useState('');
    const [currentSeason, setCurrentSeason] = useState({
        year: new Date().getFullYear(),
        crop: '',
        variety: '',
        yield: '',
        sowingDate: '',
        harvestDate: ''
    });
    const [existingCrops, setExistingCrops] = useState([]);
    const [showCropSuggestions, setShowCropSuggestions] = useState(false);
    const [isCreateWorkModalOpen, setIsCreateWorkModalOpen] = useState(false);
    const [fieldWorks, setFieldWorks] = useState([]);
    const [selectedWork, setSelectedWork] = useState(null);
    const [archiveDateRange, setArchiveDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [archiveWorks, setArchiveWorks] = useState([]);

    const calculateAreaInHectares = (coordinates) => {
        try {
            if (!coordinates || coordinates.length < 3) {
                
                return 0;
            }

            // Преобразуем координаты в формат GeoJSON
            let polygonCoords = [...coordinates];
            
            // Проверяем и меняем местами координаты если нужно
            if (Math.abs(polygonCoords[0][0]) < 90) {
                polygonCoords = polygonCoords.map(coord => [coord[1], coord[0]]);
            }

            // Замыкаем полигон если нужно
            if (JSON.stringify(polygonCoords[0]) !== JSON.stringify(polygonCoords[polygonCoords.length - 1])) {
                polygonCoords.push(polygonCoords[0]);
            }

            // Создаем полигон с учетом сферической поверхности Земли
            const geojsonPolygon = {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Polygon",
                    coordinates: [polygonCoords]
                }
            };

            // Используем turf.area с учетом сферической поверхности
            const areaInSquareMeters = turf.area(geojsonPolygon);
            const areaInHectares = areaInSquareMeters / 10000;

            return Math.round(areaInHectares * 100) / 100;
        } catch (error) {
            console.error('Error calculating area:', error);
            console.error('Coordinates that caused error:', coordinates);
            return 0;
        }
    };

    const getField = async (_id) => {
        return await axios.post('/api/fields/getField', {_id:_id})
    }

    // const getSubFields = async (parentId) => {
    //     try {
    //         const response = await axios.get('/api/fields/subFields/get');
    //         if (response.data.success) {
    //             // Фильтруем подполя, относящиеся к текущему полю
    //             return response.data.subFields.filter(
    //                 subField => subField.properties.parentId === parentId
    //             );
    //         }
    //         return [];
    //     } catch (error) {
    //         console.error('Error loading subfields:', error);
    //         return [];
    //     }
    // }

    useEffect(() => {
        if (selectedField) {
            getField(selectedField)
            .then(res => {
                setField(res.data.properties);
                setEditedProperties(res.data.properties);
                
                // Загружаем данные текущего сезона
                const currentYear = new Date().getFullYear();
                const currentSeasonData = res.data.properties.seasons?.find(s => s.year === currentYear) || {
                    year: currentYear,
                    crop: '',
                    variety: '',
                    yield: '',
                    sowingDate: '',
                    harvestDate: ''
                };
                
                // Устанавливаем данные текущего сезона
                setCurrentSeason({
                    year: currentYear,
                    crop: currentSeasonData.crop || '',
                    variety: currentSeasonData.variety || '',
                    yield: currentSeasonData.yield || '',
                    sowingDate: currentSeasonData.sowingDate ? new Date(currentSeasonData.sowingDate).toISOString().split('T')[0] : '',
                    harvestDate: currentSeasonData.harvestDate ? new Date(currentSeasonData.harvestDate).toISOString().split('T')[0] : ''
                });
                
                setField({
                    ...res.data,
                    _id: res.data._id
                });

                // Расчет площади
                const coords = res.data.coordinates[0];
                const needsSwap = Math.abs(coords[0][0]) < 90;
                const normalizedCoords = needsSwap 
                    ? coords.map(point => [point[1], point[0]])
                    : coords;
                const mainFieldArea = calculateAreaInHectares(normalizedCoords);
                setFieldArea(mainFieldArea);
                setField(res.data);
            })
        }
    }, [selectedField]);

    // Отдельный useEffect для подполей
    useEffect(() => {
        if (subFields.length > 0) {
            const filteredSubFields = subFields.filter(
                subField => subField.properties.parentId === selectedField
            );
            
            const totalSubFieldsArea = filteredSubFields.reduce((sum, subField) => {
                const coords = subField.coordinates;
                const subFieldArea = calculateAreaInHectares(coords);
                
                // Пропускаем подполя с некорректной площадью без вывода ошибки
                if (fieldArea > 0 && subFieldArea > fieldArea) {
                    return sum;
                }

                return sum + subFieldArea;
            }, 0);

            setTotalArea(totalSubFieldsArea);
        } else {
            setTotalArea(0);
        }
    }, [subFields, selectedField, fieldArea]);

    const handleTouchStart = (e) => {   
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        if (!startY) return;
        
        const currentY = e.touches[0].clientY;
        const diff = startY - currentY;

        if (Math.abs(diff) > 50) {
            setIsExpanded(diff > 0);
            setStartY(0);
        }
    };

    const handleTouchEnd = () => {
        setStartY(0);
    };

    const handleDeleteSubField = async (subFieldId) => {
        // Добавляем подтверждение
        if (!window.confirm('Вы уверены, что хотите удалить это подполе?')) {
            return; // Если пользователь нажал "Отмена"
        }

        try {
            await axios.delete(`/api/fields/subFields/delete`, {
                data: { _id: subFieldId }
            });
            
            // Обновляем состояние в родительском компоненте
            setSubFields(prev => prev.filter(field => field._id !== subFieldId));
            
        } catch (error) {
            console.error('Ошибка при удалении подполя:', error);
            // Здесь можно добавить обработку ошибки, например показ уведомления
        }
    };

    const handlePropertyChange = (key, value) => {
        setEditedProperties(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSaveProperties = async () => {
        try {
            // Создаем новый сезон или обновляем существующий
            const updatedSeasons = editedProperties.seasons || [];
            const currentYear = new Date().getFullYear();
            
            const seasonIndex = updatedSeasons.findIndex(s => s.year === currentYear);
            if (seasonIndex !== -1) {
                updatedSeasons[seasonIndex] = {
                    ...updatedSeasons[seasonIndex],
                    ...currentSeason
                };
            } else {
                updatedSeasons.push({
                    ...currentSeason,
                    year: currentYear
                });
            }

            const response = await axios.post('/api/fields/update', {
                _id: selectedField,
                properties: {
                    ...editedProperties,
                    seasons: updatedSeasons
                }
            });

            if (response.data.success) {
                // Обновляем состояние, сохраняя структуру объекта field
                setField(prev => ({
                    ...prev,
                    properties: response.data.data.properties
                }));
                setEditedProperties(response.data.data.properties);
                setIsEditingProperties(false);
                // НЕ закрываем окно просмотра поля
                // setShowFieldVisible(false); - убираем эту строку если она есть
            }
        } catch (error) {
            console.error('Error updating field properties:', error);
            alert('Ошибка при обновлении свойств поля');
        }
    };

    const handleEditSubField = (subField) => {
        setEditingSubField(subField);
        setEditingSubFieldName(subField.properties.Name || '');
        
        const currentYear = new Date().getFullYear();
        const currentSeasonData = subField.properties.seasons?.find(s => s.year === currentYear) || {
            year: currentYear,
            crop: '',
            variety: '',
            yield: '',
            sowingDate: '',
            harvestDate: ''
        };

        setCurrentSeason({
            year: currentYear,
            crop: currentSeasonData.crop || '',
            variety: currentSeasonData.variety || '',
            yield: currentSeasonData.yield || '',
            sowingDate: currentSeasonData.sowingDate ? new Date(currentSeasonData.sowingDate).toISOString().split('T')[0] : '',
            harvestDate: currentSeasonData.harvestDate ? new Date(currentSeasonData.harvestDate).toISOString().split('T')[0] : ''
        });
    };

    const handleSaveSubField = async () => {
        try {
            const currentYear = new Date().getFullYear();
            const updatedSeasons = editingSubField.properties.seasons || [];
            const seasonIndex = updatedSeasons.findIndex(s => s.year === currentYear);
            
            if (seasonIndex !== -1) {
                updatedSeasons[seasonIndex] = {
                    ...updatedSeasons[seasonIndex],
                    ...currentSeason
                };
            } else {
                updatedSeasons.push({
                    ...currentSeason,
                    year: currentYear
                });
            }

            const response = await axios.post('/api/fields/subFields/update', {
                _id: editingSubField._id,
                properties: {
                    ...editingSubField.properties,
                    Name: editingSubFieldName,
                    seasons: updatedSeasons
                }
            });

            if (response.data.success) {
                setSubFields(prev => prev.map(field => 
                    field._id === editingSubField._id 
                        ? { 
                            ...field, 
                            properties: { 
                                ...field.properties, 
                                Name: editingSubFieldName,
                                seasons: updatedSeasons
                            } 
                        }
                        : field
                ));
                setEditingSubField(null);
            }
        } catch (error) {
            console.error('Error updating subfield:', error);
            alert('Ошибка при обновлении подполя');
        }
    };

    const handleEditSubFieldBoundaries = (subFieldId) => {
        setIsEditingSubField(true);
        setEditingSubFieldId(subFieldId);
    };

    useEffect(() => {
        const loadExistingCrops = async () => {
            try {
                const response = await axios.get('/api/fields/get');
                if (response.data.success) {
                    // Собираем все уникальные культуры из всех полей и сезонов
                    const crops = new Set();
                    response.data.fields.forEach(field => {
                        field.properties.seasons?.forEach(season => {
                            if (season.crop) crops.add(season.crop);
                        });
                    });
                    setExistingCrops(Array.from(crops));
                }
            } catch (error) {
                console.error('Error loading existing crops:', error);
            }
        };

        loadExistingCrops();
    }, []);

    const filteredCrops = existingCrops.filter(crop => 
        crop.toLowerCase().includes(currentSeason.crop.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.crop-input-container')) {
                setShowCropSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSaveWork = async (workData) => {
        try {
            const dataToSave = {
                ...workData,
                fieldId: selectedField,
                status: 'planned'  // Добавляем статус по умолчанию
            };

            console.log('Saving work with data:', dataToSave);

            const response = await axios.post('/api/fields/works/add', dataToSave);

            if (response.data.success) {
                // Обновляем список работ локально
                setFieldWorks(prev => [...prev, response.data.work]);
                // Очищаем область обработки
                setProcessingArea(null);
                // Закрываем модальное окно
                setIsCreateWorkModalOpen(false);
                // Сбрасываем режим рисования
                setIsDrawingProcessingArea(false);
                return; // Добавляем return чтобы прервать выполнение функции
            }
            
            // Если нет success в ответе, выбрасываем ошибку
            throw new Error(response.data.error || 'Ошибка при сохранении работы');

        } catch (error) {
            console.error('Error saving work:', error);
            alert('Ошибка при сохранении работы');
            // НЕ закрываем модальное окно при ошибке
        }
    };

    const loadFieldWorks = async () => {
        try {
            const response = await axios.get(`/api/fields/works/getByField/${selectedField}`);
            setFieldWorks(response.data);
        } catch (error) {
            console.error('Ошибка при загрузке работ:', error);
        }
    };

    useEffect(() => {
        if (selectedField) {
            loadFieldWorks();
        }
    }, [selectedField]);

    const updateWorkStatus = async (workId, newStatus) => {
        try {
            const response = await axios.put(`/api/fields/works/updateStatus/${workId}`, {
                status: newStatus
            });
            
            if (response.data) {
                // Обновляем состояние работ локально
                setFieldWorks(prevWorks => 
                    prevWorks.map(work => 
                        work._id === workId 
                            ? { ...work, status: newStatus }
                            : work
                    )
                );
            }
        } catch (error) {
            console.error('Error updating work status:', error);
            alert('Ошибка при обновлении статуса работы');
        }
    };

    // Добавим функцию для перевода типа работы
    const getWorkTypeName = (type) => {
        const names = {
            plowing: 'Вспашка',
            seeding: 'Посев',
            fertilizing: 'Внесение удобрений',
            spraying: 'Опрыскивание',
            harvesting: 'Уборка'
        };
        return names[type] || type;
    };

    const handleWorkClick = (work, e) => {
        e.stopPropagation();
        const newSelectedWork = selectedWork?._id === work._id ? null : work;
        setSelectedWork(newSelectedWork);
        // Передаем информацию о выбранной области в родительский компонент
        onWorkSelect(newSelectedWork?.processingArea || null);
    };

    // Обновляем сортировку и добавляем фильтрацию
    const sortedWorks = useMemo(() => {
        if (!fieldWorks) return [];
        
        return [...fieldWorks]
            .filter(work => work.status !== 'completed') // Фильтруем завершенные работы
            .sort((a, b) => {
                const dateA = new Date(a.plannedDate);
                const dateB = new Date(b.plannedDate);
                return dateB - dateA; // Сортировка от новых к старым
            });
    }, [fieldWorks]);

    const loadArchiveWorks = async () => {
        try {
            if (!archiveDateRange.startDate || !archiveDateRange.endDate) return;

            // Исправляем путь к API
            const response = await axios.get(
                `/api/fields/works/archive/${selectedField}?` + // Изменено с archive на getArchive
                `startDate=${archiveDateRange.startDate}&` +
                `endDate=${archiveDateRange.endDate}`
            );
            setArchiveWorks(response.data);
        } catch (error) {
            console.error('Ошибка при загрузке архива работ:', error);
        }
    };

    useEffect(() => {
        if (selectedField) {
            loadArchiveWorks();
        }
    }, [selectedField]);

    // Добавьте функцию удаления работы
    const handleDeleteWork = async (workId, e) => {
        e.stopPropagation(); // Предотвращаем всплытие события

        if (window.confirm('Вы уверены, что хотите удалить эту работу?')) {
            try {
                const response = await fetch(`/api/fields/works/delete/${workId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Ошибка при удалении работы');
                }

                // Обновляем список работ после удаления
                const updatedWorks = fieldWorks.filter(work => work._id !== workId);
                setFieldWorks(updatedWorks);

                // Если удаляем выбранную работу, снимаем выделение
                if (selectedWork?._id === workId) {
                    setSelectedWork(null);
                    onWorkSelect(null);
                }

                // Обновляем архив, если работа была оттуда
                if (archiveWorks.some(work => work._id === workId)) {
                    const updatedArchive = archiveWorks.filter(work => work._id !== workId);
                    setArchiveWorks(updatedArchive);
                }
            } catch (error) {
                console.error('Error deleting work:', error);
                alert('Ошибка при удалении работы');
            }
        }
    };

    return field && field.properties ? (
        <div 
            className={`show-field ${isExpanded ? 'expanded' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <button 
                className="close-button"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowFieldVisible(false);
                }}
            >
                ✕
            </button>

            <div className="field-info">
                {!isEditingProperties ? (
                    <>
                    
                        <h3>{field?.properties?.Name || 'Без названия'}</h3>
                        <p>Общая площадь поля: {fieldArea} га</p>
                        {field?.properties?.descriptio && <p>Описание: {field.properties.descriptio}</p>}
                        
                        {field?.properties?.seasons?.[0] && (
                            <div className="season-info">
                                <h4>Текущий сезон</h4>
                                {field.properties.seasons[0].crop && (
                                    <p>Культура: {field.properties.seasons[0].crop}</p>
                                )}
                                {field.properties.seasons[0].variety && (
                                    <p>Сорт: {field.properties.seasons[0].variety}</p>
                                )}
                                {field.properties.seasons[0].yield && (
                                    <p>Средняя урожайность: {field.properties.seasons[0].yield} ц/га</p>
                                )}
                                {field.properties.seasons[0].sowingDate && (
                                    <p>Дата сева: {new Date(field.properties.seasons[0].sowingDate).toLocaleDateString()}</p>
                                )}
                                {field.properties.seasons[0].harvestDate && (
                                    <p>Дата сбора: {new Date(field.properties.seasons[0].harvestDate).toLocaleDateString()}</p>
                                )}
                            </div>
                        )}

                        <button 
                            className="edit-properties-button"
                            onClick={() => setIsEditingProperties(true)}
                        >
                            Редактировать свойства
                        </button>
                    </>
                ) : (
                    <div className="properties-form">
                        <div className="form-group">
                            <label>Название:</label>
                            <input
                                type="text"
                                value={editedProperties.Name}
                                onChange={(e) => handlePropertyChange('Name', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Описание:</label>
                            <textarea
                                value={editedProperties.descriptio}
                                onChange={(e) => handlePropertyChange('descriptio', e.target.value)}
                            />
                        </div>

                        <div className="season-form">
                            <h4>Информация о сезоне</h4>
                            <div className="form-group">
                                <label>Культура:</label>
                                <div className="crop-input-container">
                                    <input
                                        type="text"
                                        value={currentSeason.crop}
                                        onChange={(e) => {
                                            setCurrentSeason(prev => ({
                                                ...prev,
                                                crop: e.target.value
                                            }));
                                            setShowCropSuggestions(true);
                                        }}
                                        onFocus={() => setShowCropSuggestions(true)}
                                    />
                                    {showCropSuggestions && currentSeason.crop && filteredCrops.length > 0 && (
                                        <div className="crop-suggestions">
                                            {filteredCrops.map((crop, index) => (
                                                <div
                                                    key={index}
                                                    className="crop-suggestion"
                                                    onClick={() => {
                                                        setCurrentSeason(prev => ({
                                                            ...prev,
                                                            crop: crop
                                                        }));
                                                        setShowCropSuggestions(false);
                                                    }}
                                                >
                                                    {crop}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Сорт:</label>
                                <input
                                    type="text"
                                    value={currentSeason.variety}
                                    onChange={(e) => setCurrentSeason(prev => ({
                                        ...prev,
                                        variety: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Средняя урожайность (ц/га):</label>
                                <input
                                    type="number"
                                    value={currentSeason.yield}
                                    onChange={(e) => setCurrentSeason(prev => ({
                                        ...prev,
                                        yield: e.target.value
                                    }))}
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                            <div className="form-group">
                                <label>Дата сева:</label>
                                <input
                                    type="date"
                                    value={currentSeason.sowingDate}
                                    onChange={(e) => setCurrentSeason(prev => ({
                                        ...prev,
                                        sowingDate: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Дата сбора:</label>
                                <input
                                    type="date"
                                    value={currentSeason.harvestDate}
                                    onChange={(e) => setCurrentSeason(prev => ({
                                        ...prev,
                                        harvestDate: e.target.value
                                    }))}
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button onClick={handleSaveProperties}>Сохранить</button>
                            <button onClick={() => {
                                setIsEditingProperties(false);
                                setEditedProperties(field);
                            }}>Отмена</button>
                        </div>
                    </div>
                )}
            </div>

            {subFields.length > 0 && (
                <div className="subfields-info">
                    <h4>Подполя:</h4>
                    {subFields
                        .filter(subField => subField.properties.parentId === selectedField)
                        .map((subField, index) => {
                            const subFieldArea = calculateAreaInHectares(subField.coordinates);
                            return (
                                <div 
                                    key={index} 
                                    className={`subfield-item ${subField._id === selectedSubField ? 'selected' : ''}`}
                                >
                                    {editingSubField?._id === subField._id ? (
                                        <div className="edit-subfield-form">
                                            <input
                                                type="text"
                                                value={editingSubFieldName}
                                                onChange={(e) => setEditingSubFieldName(e.target.value)}
                                                placeholder="Название подполя"
                                            />
                                            <div className="season-form">
                                                <h4>Информация о сезоне</h4>
                                                <div className="form-group">
                                                    <label>Культура:</label>
                                                    <div className="crop-input-container">
                                                        <input
                                                            type="text"
                                                            value={currentSeason.crop}
                                                            onChange={(e) => {
                                                                setCurrentSeason(prev => ({
                                                                    ...prev,
                                                                    crop: e.target.value
                                                                }));
                                                                setShowCropSuggestions(true);
                                                            }}
                                                            onFocus={() => setShowCropSuggestions(true)}
                                                        />
                                                        {showCropSuggestions && currentSeason.crop && filteredCrops.length > 0 && (
                                                            <div className="crop-suggestions">
                                                                {filteredCrops.map((crop, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className="crop-suggestion"
                                                                        placeholder="Укажите культуру"
                                                                        onClick={() => {
                                                                            setCurrentSeason(prev => ({
                                                                                ...prev,
                                                                                crop: crop
                                                                            }));
                                                                            setShowCropSuggestions(false);
                                                                        }}
                                                                    >
                                                                        {crop}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>Сорт:</label>
                                                    <input
                                                        type="text"
                                                        value={currentSeason.variety}
                                                        onChange={(e) => setCurrentSeason(prev => ({
                                                            ...prev,
                                                            variety: e.target.value
                                                        }))}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Средняя урожайность (ц/га):</label>
                                                    <input
                                                        type="number"
                                                        value={currentSeason.yield}
                                                        onChange={(e) => setCurrentSeason(prev => ({
                                                            ...prev,
                                                            yield: e.target.value
                                                        }))}
                                                        min="0"
                                                        step="0.1"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Дата сева:</label>
                                                    <input
                                                        type="date"
                                                        value={currentSeason.sowingDate}
                                                        onChange={(e) => setCurrentSeason(prev => ({
                                                            ...prev,
                                                            sowingDate: e.target.value
                                                        }))}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Дата сбора:</label>
                                                    <input
                                                        type="date"
                                                        value={currentSeason.harvestDate}
                                                        onChange={(e) => setCurrentSeason(prev => ({
                                                            ...prev,
                                                            harvestDate: e.target.value
                                                        }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="edit-actions">
                                                <button onClick={handleSaveSubField}>
                                                    Сохранить
                                                </button>
                                                <button onClick={() => setEditingSubField(null)}>
                                                    Отмена
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="subfield-info" onClick={(e) => {
                                                e.stopPropagation();
                                                onSubFieldSelect(subField._id);
                                            }}>
                                                <p className="subfield-name">
                                                    {subField.properties.Name || `Подполе ${index + 1}`}: {subFieldArea.toFixed(2)} га
                                                </p>
                                                {subField.properties.seasons && subField.properties.seasons[0] && (
                                                    subField.properties.seasons[0].crop || 
                                                    subField.properties.seasons[0].variety ||
                                                    subField.properties.seasons[0].yield ||
                                                    subField.properties.seasons[0].sowingDate || 
                                                    subField.properties.seasons[0].harvestDate
                                                ) && (
                                                    <div className="subfield-season-info">
                                                        {subField.properties.seasons[0].crop && (
                                                            <p>Культура: {subField.properties.seasons[0].crop}</p>
                                                        )}
                                                        {subField.properties.seasons[0].variety && (
                                                            <p>Сорт: {subField.properties.seasons[0].variety}</p>
                                                        )}
                                                        {subField.properties.seasons[0].yield && (
                                                            <p>Средняя урожайность: {subField.properties.seasons[0].yield} ц/га</p>
                                                        )}
                                                        {subField.properties.seasons[0].sowingDate && (
                                                            <p>Дата сева: {new Date(subField.properties.seasons[0].sowingDate).toLocaleDateString()}</p>
                                                        )}
                                                        {subField.properties.seasons[0].harvestDate && (
                                                            <p>Дата сбора: {new Date(subField.properties.seasons[0].harvestDate).toLocaleDateString()}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="subfield-actions">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditSubField(subField);
                                                    }}
                                                    className="edit-button"
                                                >
                                                    ✎
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditSubFieldBoundaries(subField._id);
                                                    }}
                                                    className="edit-boundaries-button"
                                                >
                                                    ◈
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteSubField(subField._id);
                                                    }}
                                                    className="delete-button"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    <p>Общая площадь подполей: {totalArea.toFixed(2)} га</p>
                    <p>Свободная площадь: {(fieldArea - totalArea).toFixed(2)} га</p>
                </div>
            )}

            <div className="field-actions">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingMainField(!isEditingMainField);
                    }}
                >
                    {isEditingMainField ? 'Завершить редактирование границ' : 'Редактировать границы'}
                </button>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDrawingModeChange(!isDrawingMode);
                    }}
                >
                    {isDrawingMode ? 'Завершить создание подполя' : 'Создать подполе'}
                </button>
            </div>

            <button 
                className="create-work-btn"
                onClick={() => setIsCreateWorkModalOpen(true)}
            >
                Создать работу
            </button>

            {isCreateWorkModalOpen && (
                <CreateWork
                    fieldId={selectedField._id}
                    onClose={() => setIsCreateWorkModalOpen(false)}
                    onSave={handleSaveWork}
                    processingArea={processingArea}
                    isDrawingProcessingArea={isDrawingProcessingArea}
                    setIsDrawingProcessingArea={setIsDrawingProcessingArea}
                    selectedField={field}
                    fieldArea={fieldArea}
                />
            )}

            <div className="field-works">
                <h3>Работы</h3>
                <div className="works-list">
                    {sortedWorks.map(work => (
                        <div 
                            key={work._id} 
                            className={`work-item ${selectedWork?._id === work._id ? 'selected' : ''}`}
                            onClick={(e) => handleWorkClick(work, e)}
                        >
                            <div className="work-header">
                                <h4>{work.name}</h4>
                                <div className="work-status-controls">
                                    <span className={`work-status ${work.status}`}>
                                        {work.status === 'planned' ? 'Запланировано' : 
                                         work.status === 'in_progress' ? 'В процессе' : 
                                         'Завершено'}
                                    </span>
                                    {work.status === 'planned' && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateWorkStatus(work._id, 'in_progress');
                                            }}
                                        >
                                            Начать
                                        </button>
                                    )}
                                    {work.status === 'in_progress' && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateWorkStatus(work._id, 'completed');
                                            }}
                                        >
                                            Завершить
                                        </button>
                                    )}
                                    <button 
                                        className="delete-work-btn"
                                        onClick={(e) => handleDeleteWork(work._id, e)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="work-details">
                                <p>Тип: {getWorkTypeName(work.type)}</p>
                                <p>Дата: {new Date(work.plannedDate).toLocaleDateString()}</p>
                                <p>Площадь обработки: {work.area} га</p>
                                {work.description && <p>Описание: {work.description}</p>}
                                
                                <p>Работники:</p>
                                {work.workers && work.workers.length > 0 ? (
                                    <ul>
                                        {work.workers.map((worker, index) => (
                                            <li key={`${work._id}-worker-${worker._id || index}`}>
                                                {worker.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <ul><li>•</li></ul>
                                )}
                                
                                <p>Техника:</p>
                                {work.equipment && work.equipment.length > 0 ? (
                                    <ul>
                                        {work.equipment.map((tech, index) => (
                                            <li key={`${work._id}-tech-${tech._id || index}`}>
                                                {tech.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <ul><li>•</li></ul>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="field-works-archive">
                <h3>Архив работ</h3>
                <div className="archive-date-range">
                    <div className="date-input">
                        <label>С:</label>
                        <input 
                            type="date"
                            value={archiveDateRange.startDate}
                            onChange={(e) => setArchiveDateRange(prev => ({
                                ...prev,
                                startDate: e.target.value
                            }))}
                        />
                    </div>
                    <div className="date-input">
                        <label>По:</label>
                        <input 
                            type="date"
                            value={archiveDateRange.endDate}
                            onChange={(e) => setArchiveDateRange(prev => ({
                                ...prev,
                                endDate: e.target.value
                            }))}
                        />
                    </div>
                    <button 
                        className="search-archive-btn"
                        onClick={loadArchiveWorks}
                        disabled={!archiveDateRange.startDate || !archiveDateRange.endDate}
                    >
                        Найти работы
                    </button>
                </div>

                {archiveWorks.length > 0 ? (
                    <div className="archive-works-list">
                        {archiveWorks.map(work => (
                            <div 
                                key={work._id} 
                                className={`archive-work-item ${selectedWork?._id === work._id ? 'selected' : ''}`}
                                onClick={(e) => handleWorkClick(work, e)}
                            >
                                <div className="work-header">
                                    <h4>{work.name}</h4>
                                    <div className="work-status-controls">
                                        <span className="work-status completed">Завершено</span>
                                        <button 
                                            className="delete-work-btn"
                                            onClick={(e) => handleDeleteWork(work._id, e)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                                <div className="work-details">
                                    <p>Тип: {getWorkTypeName(work.type)}</p>
                                    <p>Дата: {new Date(work.plannedDate).toLocaleDateString()}</p>
                                    <p>Площадь обработки: {work.area} га</p>
                                    {work.description && <p>Описание: {work.description}</p>}
                                    
                                    <p>Работники:</p>
                                    {work.workers && work.workers.length > 0 ? (
                                        <ul>
                                            {work.workers.map((worker, index) => (
                                                <li key={`${work._id}-worker-${worker._id || index}`}>
                                                    {worker.name}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <ul><li>•</li></ul>
                                    )}
                                    
                                    <p>Техника:</p>
                                    {work.equipment && work.equipment.length > 0 ? (
                                        <ul>
                                            {work.equipment.map((tech, index) => (
                                                <li key={`${work._id}-tech-${tech._id || index}`}>
                                                    {tech.name}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <ul><li>•</li></ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-archive-works">
                        {archiveDateRange.startDate && archiveDateRange.endDate 
                            ? 'Нет завершенных работ за выбранный период' 
                            : 'Выберите период для просмотра архива работ'}
                    </p>
                )}
            </div>
        </div>
    ) : <div>Loading...</div>
}