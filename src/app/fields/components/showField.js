'use client'
import '../scss/showFields.scss'
import axios from 'axios'
import { useState, useEffect, useMemo, useRef } from 'react'
import { area, polygon } from '@turf/turf'
import * as turf from '@turf/turf'
import CreateWork from './createWork'
import '../scss/fieldWorks.scss'
import { useSearchParams } from 'next/navigation'
import { WORK_TYPES } from '../constants/workTypes';
import { WORK_STATUSES } from '../constants/workStatuses';
import SubtaskManager from './SubtaskManager';
import PropTypes from 'prop-types';
import DatePicker, { registerLocale } from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import ru from 'date-fns/locale/ru'
import { useSession } from 'next-auth/react';
import EditWork from './EditWork';

// Регистрируем русскую локаль
registerLocale('ru', ru)

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
    onWorkSelect,
    isCreateWorkModalOpen,
    setIsCreateWorkModalOpen,
    dialog,
    setDialog,
    onWialonTrackSelect,
    onSubtaskTracksSelect
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
    const [fieldWorks, setFieldWorks] = useState([]);
    const [selectedWork, setSelectedWork] = useState(null);
    const [archiveDateRange, setArchiveDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [archiveWorks, setArchiveWorks] = useState([]);
    const searchParams = useSearchParams();
    const urlSeason = searchParams.get('season');
    const showFieldRef = useRef(null);
    const [allWorkDates, setAllWorkDates] = useState([])
    const { data: session } = useSession();
    const [editingWork, setEditingWork] = useState(null);

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
        setDialog({
            isOpen: true,
            type: 'confirm',
            title: 'Подтверждение',
            message: 'Вы уверены, что хотите удалить это подполе?',
            onConfirm: async () => {
                try {
                    const response = await axios.delete('/api/fields/subFields/delete', {
                        data: { _id: subFieldId }
                    });

                    if (response.data.success) {
                        setSubFields(prevSubFields => 
                            prevSubFields.filter(sf => sf._id !== subFieldId)
                        );
                        setDialog({
                            isOpen: true,
                            type: 'alert',
                            title: 'Успешно',
                            message: 'Подполе успешно удалено',
                            onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
                        });
                    }
                } catch (error) {
                    console.error('Error deleting subfield:', error);
                    setDialog({
                        isOpen: true,
                        type: 'alert',
                        title: 'Ошибка',
                        message: 'Ошибка при удалении подполя',
                        onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false }))
                    });
                }
            },
            onClose: () => setDialog(prev => ({ ...prev, isOpen: false }))
        });
    };

    const handlePropertyChange = (key, value) => {
        setEditedProperties(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSaveProperties = async () => {
        try {
            // Получаем текущий сезон из URL или используем текущий год
            const season = urlSeason || new Date().getFullYear().toString();
            
            // Получаем существующие сезоны или создаем новый массив
            let updatedSeasons = [...(editedProperties.seasons || [])];
            
            // Находим индекс текущего сезона
            const seasonIndex = updatedSeasons.findIndex(s => 
                s.year && s.year.toString() === season.toString()
            );

            // Подготавливаем данные сезона
            const seasonData = {
                year: season,
                crop: currentSeason.crop || '',
                variety: currentSeason.variety || '',
                yield: currentSeason.yield || '',
                sowingDate: currentSeason.sowingDate || '',
                harvestDate: currentSeason.harvestDate || ''
            };

            // Обновляем или добавляем сезон
            if (seasonIndex !== -1) {
                // Обновляем существующий сезон
                updatedSeasons[seasonIndex] = {
                    ...updatedSeasons[seasonIndex],
                    ...seasonData
                };
            } else {
                // Добавляем новый сезон
                updatedSeasons.push(seasonData);
            }

            // Фильтруем сезоны, чтобы убрать строковые значения
            updatedSeasons = updatedSeasons.filter(s => typeof s === 'object' && s !== null);

            const response = await axios.post('/api/fields/update', {
                _id: selectedField,
                properties: {
                    ...editedProperties,
                    seasons: updatedSeasons
                }
            });

            if (response.data.success) {
                setField(prev => ({
                    ...prev,
                    properties: response.data.data.properties
                }));
                setEditedProperties(response.data.data.properties);
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
        
        // Используем сезон из URL вместо текущего года
        const season = urlSeason || new Date().getFullYear().toString();
        
        // Ищем данные для выбранного сезона
        const seasonData = subField.properties.seasons?.find(s => s.year === season) || {
            year: season,
            crop: '',
            variety: '',
            yield: '',
            sowingDate: '',
            harvestDate: ''
        };

        setCurrentSeason({
            year: season, // Используем выбранный сезон
            crop: seasonData.crop || '',
            variety: seasonData.variety || '',
            yield: seasonData.yield || '',
            sowingDate: seasonData.sowingDate ? new Date(seasonData.sowingDate).toISOString().split('T')[0] : '',
            harvestDate: seasonData.harvestDate ? new Date(seasonData.harvestDate).toISOString().split('T')[0] : ''
        });
    };

    const handleSaveSubField = async () => {
        try {
            const season = urlSeason || new Date().getFullYear().toString();
            const updatedSeasons = editingSubField.properties.seasons || [];
            const seasonIndex = updatedSeasons.findIndex(s => s.year === season);
            
            if (seasonIndex !== -1) {
                updatedSeasons[seasonIndex] = {
                    ...updatedSeasons[seasonIndex],
                    ...currentSeason,
                    year: season // Убеждаемся, что год соответствует выбранному сезону
                };
            } else {
                updatedSeasons.push({
                    ...currentSeason,
                    year: season
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
                // Обновляем состояние с учетом текущего сезона
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
                
                // Принудительно перезагружаем данные подполей для текущего сезона
                try {
                    const refreshResponse = await axios.get('/api/fields/subFields/get', {
                        params: {
                            parentId: selectedField,
                            season: season
                        }
                    });
                    if (refreshResponse.data.success) {
                        setSubFields(refreshResponse.data.subFields);
                    }
                } catch (error) {
                    console.error('Error refreshing subfields:', error);
                }
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

    const handleDeleteWork = async (workId) => {
        try {
            const work = fieldWorks.find(w => w._id === workId) || archiveWorks.find(w => w._id === workId);
            
            setDialog({
                isOpen: true,
                type: 'confirm',
                title: 'Подтверждение удаления',
                message: 'Вы уверены, что хотите удалить эту работу?',
                showNotificationCheckbox: true,
                defaultNotificationState: true,
                onConfirm: async (sendNotification) => {
                    try {
                        const response = await axios.delete(`/api/fields/works/delete/${workId}`);
                        
                        if (response.data.success) {
                            if (sendNotification) {
                                const date = new Date(work.plannedDate).toLocaleDateString('ru-RU', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                });

                                const message = `<b>❌ Работа удалена</b>

👤 Удалил: <code>${session?.user?.name || 'Система'}</code>
📅 Дата создания: ${date}
🏢 Объект: ${field?.properties?.Name || 'Без названия'}
📋 Работа: ${work.name}`;

                                await axios.post('/api/telegram/sendNotification', { 
                                    message,
                                    chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM,
                                    message_thread_id: 41,
                                    parse_mode: 'HTML'
                                });
                            }

                            setFieldWorks(prev => prev.filter(w => w._id !== workId));
                            setArchiveWorks(prev => prev.filter(w => w._id !== workId));
                            setDialog(null);
                        }
                    } catch (error) {
                        console.error('Error deleting work:', error);
                        setDialog({
                            isOpen: true,
                            type: 'alert',
                            title: 'Ошибка',
                            message: 'Ошибка при удалении работы',
                            onConfirm: () => setDialog(null)
                        });
                    }
                },
                onClose: () => setDialog(null)
            });
        } catch (error) {
            console.error('Error in handleDeleteWork:', error);
            alert('Ошибка при удалении работы');
        }
    };

    const updateWorkStatus = async (workId, newStatus) => {
        try {
            if (newStatus === 'completed') {
                const today = new Date().toISOString().split('T')[0];
                setDialog({
                    isOpen: true,
                    type: 'confirm',
                    title: 'Подтверждение изменения статуса',
                    message: (
                        <>
                            <div>Вы уверены, что хотите изменить статус работы на "Завершен"?</div>
                            <div style={{ marginTop: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px' }}>
                                    Дата завершения:
                                </label>
                                <input 
                                    type="date" 
                                    id="completionDate"
                                    name="completionDate"
                                    defaultValue={today}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                        </>
                    ),
                    showNotificationCheckbox: true,
                    defaultNotificationState: true,
                    onConfirm: async (sendNotification) => {
                        const dateInput = document.querySelector('input[name="completionDate"]');
                        const completedDate = dateInput?.value || today;

                        try {
                            const response = await axios.put(`/api/fields/works/updateStatus/${workId}`, {
                                status: newStatus,
                                completedDate: completedDate,
                                sendNotification
                            });
                            
                            if (response.data) {
                                setFieldWorks(prevWorks => 
                                    prevWorks.map(work => 
                                        work._id === workId 
                                            ? { 
                                                ...work, 
                                                status: newStatus, 
                                                completedDate: completedDate 
                                              }
                                            : work
                                    )
                                );
                                setDialog(null);
                            }
                        } catch (error) {
                            console.error('Error updating work status:', error);
                            setDialog({
                                isOpen: true,
                                type: 'alert',
                                title: 'Ошибка',
                                message: 'Ошибка при обновлении статуса работы',
                                onConfirm: () => setDialog(null)
                            });
                        }
                    },
                    onClose: () => setDialog(null)
                });
            } else if (newStatus === 'in_progress') {
                setDialog({
                    isOpen: true,
                    type: 'confirm',
                    title: 'Подтверждение изменения статуса',
                    message: 'Вы уверены, что хотите начать работу?',
                    showNotificationCheckbox: true,
                    defaultNotificationState: true,
                    onConfirm: async (sendNotification) => {
                        try {
                            const response = await axios.put(`/api/fields/works/updateStatus/${workId}`, {
                                status: newStatus,
                                sendNotification
                            });
                            
                            if (response.data) {
                                setFieldWorks(prevWorks => 
                                    prevWorks.map(work => 
                                        work._id === workId 
                                            ? { ...work, status: newStatus }
                                            : work
                                    )
                                );

                                if (sendNotification) {
                                    const work = fieldWorks.find(w => w._id === workId);
                                    if (work) {
                                        const message = `<b>▶️ Работа начата</b>

👤 Начал: <code>${session?.user?.name || 'Система'}</code>
🏢 Объект: ${field?.properties?.Name || 'Без названия'}
📋 Работа: ${work.name}

<b>Детали работы:</b>
• Тип: ${getWorkTypeName(work.type)}
• Площадь: ${work.area} га
${work.description ? `• Описание: ${work.description}` : ''}`;

                                        await axios.post('/api/telegram/sendNotification', { 
                                            message,
                                            chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID_FORTUNACRM,
                                            message_thread_id: 41,
                                            parse_mode: 'HTML'
                                        });
                                    }
                                }
                                setDialog(null);
                            }
                        } catch (error) {
                            console.error('Error updating work status:', error);
                            setDialog({
                                isOpen: true,
                                type: 'alert',
                                title: 'Ошибка',
                                message: 'Ошибка при обновлении статуса работы',
                                onConfirm: () => setDialog(null)
                            });
                        }
                    },
                    onClose: () => setDialog(null)
                });
            } else {
                // ... код для других статусов ...
            }
        } catch (error) {
            console.error('Error in updateWorkStatus:', error);
            alert('Ошибка при обновлении статуса работы');
        }
    };

    // Добавляем обработчик для кнопки "Начать"
    const handleStartWork = (workId) => {
        updateWorkStatus(workId, 'in_progress');
    };

    // Заменяем существующую функцию
    const getWorkTypeName = (type) => {
        return WORK_TYPES[type] || type;
    };

    // Добавляем эффект для очистки выбранной работы при смене поля
    useEffect(() => {
        // Очищаем выбранную работу при смене поля
        setSelectedWork(null);
        // Очищаем треки на карте
        if (onWialonTrackSelect) onWialonTrackSelect(null);
        if (onSubtaskTracksSelect) onSubtaskTracksSelect(null);
    }, [selectedField]);

    const handleWorkClick = (work) => {
        if (selectedWork?._id === work._id) {
            // Если кликнули по той же работе - отменяем выбор
            setSelectedWork(null);
            onWorkSelect(null); // Передаем null чтобы очистить область
            // Очищаем треки через пропсы
            onWialonTrackSelect(null);
            onSubtaskTracksSelect(null);
        } else {
            setSelectedWork(work);
            onWorkSelect(work.processingArea);
            // Загружаем треки для выбранной работы...
        }
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

    // Получаем все даты с работами при загрузке поля
    useEffect(() => {
        if (field && field.works && Array.isArray(field.works)) {
            const dates = field.works
                .filter(work => work.status === 'completed')
                .map(work => new Date(work.plannedDate))
            setAllWorkDates(dates)
        }
    }, [field])

    // Подсвечиваем даты с работами
    const highlightWithWorks = (date) => {
        return allWorkDates.some(d => 
            d.getDate() === date.getDate() &&
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
        )
    }

    // Функция форматирования даты
    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('ru-RU');
    };

    return field && field.properties ? (
        <div 
            ref={showFieldRef}
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
                        
                        {field?.properties?.seasons?.[0]?.crop && (
                            <div className="season-info">
                                
                                <p>Культура: {field.properties.seasons[0].crop}</p>
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
                    <p className='info-text'>Общая площадь подполей: {totalArea.toFixed(2)} га</p>
                    <p className='info-text'>Свободная площадь: {(fieldArea - totalArea).toFixed(2)} га</p>
                </div>
            )}

            <h4>Действия:</h4>
            <div className="field-actions">
                <button 
                    className="edit-boundaries-button"
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

                <button 
                    className="delete-field-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteField();
                    }}
                    style={{
                        backgroundColor: '#ff4444',
                        color: 'white'
                    }}
                >
                    Удалить поле
                </button>
            </div>

            <button 
                className="create-work-btn"
                onClick={() => {
                    // Прокручиваем к началу страницы
                    document.querySelector('.show-field').scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    setIsCreateWorkModalOpen(true);
                }}
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
                    subFields={subFields}
                    onWialonTrackSelect={onWialonTrackSelect}
                />
            )}

            <div className="field-works">
                <h3>Работы</h3>
                <div className="works-list">
                    {sortedWorks.map(work => (
                        <div 
                            key={work._id} 
                            data-type={work.type}
                            className={`work-item ${selectedWork?._id === work._id ? 'selected' : ''}`}
                            onClick={(e) => handleWorkClick(work)}
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
                                                handleStartWork(work._id);
                                            }}
                                            className="start-work-button"
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
                                            className="complete-work-button"
                                        >
                                            Завершить
                                        </button>
                                    )}
                                    <button 
                                        className="edit-work-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingWork(work);
                                        }}
                                    >
                                        ✎
                                    </button>
                                    <button 
                                        className="delete-work-btn"
                                        onClick={(e) => handleDeleteWork(work._id)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="work-details">
                                <p>Тип: {getWorkTypeName(work.type)}</p>
                                <p>Дата: {formatDate(work.plannedDate)}</p>
                                {work.status === 'completed' && (
                                    <p>Дата завершения: {formatDate(work.completedDate)}</p>
                                )}
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

            {selectedWork && (selectedWork.status === 'in_progress' || selectedWork.status === 'completed') && (
                <SubtaskManager 
                    work={selectedWork}
                    onUpdate={() => {
                        if (selectedWork.status === 'completed') {
                            loadArchiveWorks();
                        } else {
                            loadFieldWorks();
                        }
                    }}
                    onWialonTrackSelect={onWialonTrackSelect}
                    onSubtaskTracksSelect={onSubtaskTracksSelect}
                />
            )}

            <div className="field-works-archive">
                <h3>Архив работ</h3>
                <div className="archive-date-range">
                    <div className="date-picker-container">
                        <label>С:</label>
                        <DatePicker
                            selected={archiveDateRange.startDate ? new Date(archiveDateRange.startDate) : null}
                            onChange={(date) => setArchiveDateRange(prev => ({
                                ...prev,
                                startDate: date ? date.toISOString().split('T')[0] : ''
                            }))}
                            dateFormat="dd.MM.yyyy"
                            locale="ru"
                            highlightDates={allWorkDates}
                            dayClassName={date =>
                                highlightWithWorks(date) ? "has-works" : undefined
                            }
                            calendarClassName="custom-calendar"
                            className="date-picker"
                            placeholderText="Выберите дату"
                        />
                    </div>
                    <div className="date-picker-container">
                        <label>По:</label>
                        <DatePicker
                            selected={archiveDateRange.endDate ? new Date(archiveDateRange.endDate) : null}
                            onChange={(date) => setArchiveDateRange(prev => ({
                                ...prev,
                                endDate: date ? date.toISOString().split('T')[0] : ''
                            }))}
                            dateFormat="dd.MM.yyyy"
                            locale="ru"
                            highlightDates={allWorkDates}
                            dayClassName={date =>
                                highlightWithWorks(date) ? "has-works" : undefined
                            }
                            calendarClassName="custom-calendar"
                            className="date-picker"
                            placeholderText="Выберите дату"
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
                                onClick={(e) => handleWorkClick(work)}
                            >
                                <div className="work-header">
                                    <h4>{work.name}</h4>
                                    <div className="work-status-controls">
                                        <span className="work-status completed">Завершено</span>
                                        <button 
                                            className="edit-work-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingWork(work);
                                            }}
                                        >
                                            ✎
                                        </button>
                                        <button 
                                            className="delete-work-btn"
                                            onClick={(e) => handleDeleteWork(work._id)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                                <div className="work-details">
                                    <p>Тип: {getWorkTypeName(work.type)}</p>
                                    <p>Дата: {formatDate(work.plannedDate)}</p>
                                    {work.status === 'completed' && (
                                        <p>Дата завершения: {formatDate(work.completedDate)}</p>
                                    )}
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

            {editingWork && (
                <EditWork
                    work={editingWork}
                    onClose={() => setEditingWork(null)}
                    onUpdate={(updatedWork) => {
                        if (updatedWork.status === 'completed') {
                            setArchiveWorks(prevWorks => 
                                prevWorks.map(w => 
                                    w._id === updatedWork._id ? updatedWork : w
                                )
                            );
                        } else {
                            setFieldWorks(prevWorks => 
                                prevWorks.map(w => 
                                    w._id === updatedWork._id ? updatedWork : w
                                )
                            );
                        }
                    }}
                />
            )}
        </div>
    ) : null;
}

ShowField.propTypes = {
    // ... другие propTypes ...
    onSubtaskTracksSelect: PropTypes.func,
};

ShowField.defaultProps = {
    // ... другие defaultProps ...
    onSubtaskTracksSelect: () => {}, // Пустая функция по умолчанию
};