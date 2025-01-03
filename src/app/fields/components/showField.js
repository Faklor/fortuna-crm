'use client'
import '../scss/showFields.scss'
import axios from 'axios'
import { useState, useEffect } from 'react'
import { area, polygon } from '@turf/turf'
import * as turf from '@turf/turf'

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
    setEditingSubFieldId
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
        icon: ''
    })
    const [editingSubField, setEditingSubField] = useState(null);
    const [editingSubFieldName, setEditingSubFieldName] = useState('');

    const calculateAreaInHectares = (coordinates) => {
        try {
            if (!coordinates || coordinates.length < 3) {
                console.error('Invalid coordinates array:', coordinates);
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
                const coords = res.data.coordinates[0];
                const needsSwap = Math.abs(coords[0][0]) < 90;
                const normalizedCoords = needsSwap 
                    ? coords.map(point => [point[1], point[0]])
                    : coords;
                const mainFieldArea = calculateAreaInHectares(normalizedCoords);
                setFieldArea(mainFieldArea);
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
            const response = await axios.post('/api/fields/update', {
                _id: selectedField,
                properties: editedProperties
            });

            if (response.data.success) {
                setField(response.data.data.properties);
                setIsEditingProperties(false);
            }
        } catch (error) {
            console.error('Error updating field properties:', error);
            alert('Ошибка при обновлении свойств поля');
        }
    };

    const handleEditSubField = (subField) => {
        setEditingSubField(subField);
        setEditingSubFieldName(subField.properties.Name || '');
    };

    const handleSaveSubField = async () => {
        try {
            const response = await axios.post('/api/fields/subFields/update', {
                _id: editingSubField._id,
                properties: {
                    ...editingSubField.properties,
                    Name: editingSubFieldName
                }
            });

            if (response.data.success) {
                setSubFields(prev => prev.map(field => 
                    field._id === editingSubField._id 
                        ? { ...field, properties: { ...field.properties, Name: editingSubFieldName } }
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

    return field ? (
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
                        <h3>{field.Name || 'Без названия'}</h3>
                        <p>Общая площадь поля: {fieldArea} га</p>
                        {field.descriptio && <p>Описание: {field.descriptio}</p>}
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
                                            <p onClick={(e) => {
                                                e.stopPropagation();
                                                onSubFieldSelect(subField._id);
                                            }}>
                                                {subField.properties.Name || `Подполе ${index + 1}`}: {subFieldArea.toFixed(2)} га
                                            </p>
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
        </div>
    ) : <div>Loading...</div>
}