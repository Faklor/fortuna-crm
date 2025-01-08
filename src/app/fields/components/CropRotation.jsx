'use client'
import { useState, useEffect } from 'react'
import * as turf from '@turf/turf'
import axios from 'axios'
import '../scss/cropRotation.scss'

// Добавляем объект с типами работ и их цветами
const WORK_TYPES = {
    plowing: { name: 'Вспашка', color: '#8B4513' },  // коричневый
    fertilization: { name: 'Удобрение', color: '#228B22' },  // зеленый
    sowing: { name: 'Посев', color: '#FFD700' },  // золотой
    spraying: { name: 'Опрыскивание', color: '#4682B4' },  // синий
    harvesting: { name: 'Уборка', color: '#B8860B' },  // темно-золотой
    cultivation: { name: 'Культивация', color: '#CD853F' },  // светло-коричневый
    irrigation: { name: 'Полив', color: '#00CED1' },  // бирюзовый
    other: { name: 'Другое', color: '#808080' }  // серый
};

// Функция для получения типа работы
const getWorkTypeInfo = (workType) => {
    return WORK_TYPES[workType] || WORK_TYPES.other;
};

export default function CropRotation({ fields, works }) {
    const [statistics, setStatistics] = useState({
        totalArea: 0,
        byCrop: {},
        byYear: {},
        fieldDetails: {}
    })
    const [subFields, setSubFields] = useState([])

    // Получение подполей
    const getSubFields = async () => {
        try {
            const response = await axios.get('/api/fields/subFields/allSubfields')
            
            return response.data.subFields
        } catch (error) {
            console.error('Error fetching subfields:', error)
            return []
        }
    }

    // Улучшенная функция расчета площади с учетом геодезических особенностей
    const calculatePolygonArea = (coordinates) => {
        if (!coordinates || coordinates.length === 0 || !coordinates[0]) return 0;
        
        try {
            let coords = coordinates[0];
            
            // Проверяем, замкнут ли полигон
            if (!arraysEqual(coords[0], coords[coords.length - 1])) {
                // Если нет, добавляем первую точку в конец для замыкания
                coords = [...coords, coords[0]];
            }
            
            // Создаем полигон в формате GeoJSON
            const polygon = turf.polygon([coords]);
            
            // Вычисляем площадь в квадратных метрах с учетом кривизны Земли
            const area = turf.area(polygon);
            
            // Переводим в гектары
            return area / 10000;
        } catch (error) {
            console.error('Error calculating area:', error);
            return 0;
        }
    }

    // Вспомогательная функция для сравнения координат
    const arraysEqual = (a, b) => {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    useEffect(() => {
        // Загружаем подполя при монтировании компонента
        const fetchSubFields = async () => {
            const fetchedSubFields = await getSubFields()
            setSubFields(fetchedSubFields)
        }
        fetchSubFields()
    }, [])

    useEffect(() => {
        const calculateStatistics = () => {
            const stats = {
                totalArea: 0,
                byCrop: {},
                byYear: {},
                fieldDetails: {}
            };

            // Группируем работы по полям
            const worksByField = works.reduce((acc, work) => {
                if (!acc[work.fieldId]) {
                    acc[work.fieldId] = {};
                }
                const workYear = new Date(work.plannedDate).getFullYear().toString();
                if (!acc[work.fieldId][workYear]) {
                    acc[work.fieldId][workYear] = [];
                }
                acc[work.fieldId][workYear].push(work);
                return acc;
            }, {});

            // Группируем поля по названиям
            const groupedFields = fields.reduce((acc, field) => {
                const fieldName = field.properties.Name || 'Без названия';
                if (!acc[fieldName]) {
                    acc[fieldName] = [];
                }
                acc[fieldName].push(field);
                return acc;
            }, {});

            Object.entries(groupedFields).forEach(([fieldName, fieldGroup]) => {
                const baseField = fieldGroup[0];
                const fieldArea = calculatePolygonArea(baseField.coordinates);
                const allSeasons = [...new Set(fieldGroup.flatMap(f => 
                    f.properties.seasons?.map(s => s.year.toString()) || []
                ))];
                
                stats.fieldDetails[fieldName] = {
                    name: fieldName,
                    area: fieldArea,
                    subFields: [],
                    crops: {},
                    seasons: allSeasons,
                    works: {} // Хранение работ по годам
                };

                // Добавляем работы для поля
                fieldGroup.forEach(field => {
                    const fieldWorks = worksByField[field._id] || {};
                    Object.entries(fieldWorks).forEach(([year, yearWorks]) => {
                        if (!stats.fieldDetails[fieldName].works[year]) {
                            stats.fieldDetails[fieldName].works[year] = [];
                        }
                        stats.fieldDetails[fieldName].works[year].push(...yearWorks);
                    });

                    // Добавляем культуры из сезонов
                    if (field.properties.seasons) {
                        field.properties.seasons.forEach(season => {
                            const year = season.year.toString();
                            stats.fieldDetails[fieldName].crops[year] = season.crop || 'Не указано';
                        });
                    }
                });

                stats.totalArea += fieldArea;
            });

            setStatistics(stats);
        };

        if (fields?.length > 0) {
            calculateStatistics();
        }
    }, [fields, works]);

    return (
        <div className="crop-rotation">
            <h2>Статистика полей</h2>
            <div className="statistics-grid">
                <div className="stat-card total-area">
                    <h3>Общая площадь</h3>
                    <p>{statistics.totalArea.toFixed(2)} га</p>
                </div>

                <div className="stat-card fields">
                    <h3>Детали по полям</h3>
                    <div className="fields-list">
                        {Object.entries(statistics.fieldDetails)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([fieldId, field]) => (
                                <div key={fieldId} className="field-item">
                                    <h4>
                                        {field.name} ({field.area.toFixed(2)} га)
                                        <span className="field-seasons">
                                            Сезоны: {field.seasons.join(', ')}
                                        </span>
                                    </h4>
                                    <div className="field-crops">
                                        {Object.entries(field.crops)
                                            .sort(([a], [b]) => b.localeCompare(a))
                                            .map(([year, crop]) => (
                                                <div key={year} className="field-crop">
                                                    <div className="crop-info">
                                                        {year}: {crop}
                                                    </div>
                                                    {/* Отображаем работы для этого года */}
                                                    {field.works[year]?.length > 0 && (
                                                        <div className="field-works">
                                                            <h5>Работы:</h5>
                                                            {field.works[year]
                                                                .sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate))
                                                                .map(work => {
                                                                    const typeInfo = getWorkTypeInfo(work.type);
                                                                    return (
                                                                        <div 
                                                                            key={work._id} 
                                                                            className="field-work"
                                                                            style={{ 
                                                                                borderLeft: `4px solid ${typeInfo.color}`,
                                                                                backgroundColor: `${typeInfo.color}10`
                                                                            }}
                                                                        >
                                                                            <span className="work-name">
                                                                                {work.name}
                                                                                <span className="work-type">
                                                                                    {typeInfo.name}
                                                                                </span>
                                                                            </span>
                                                                            <span className="work-date">
                                                                                {new Date(work.plannedDate).toLocaleDateString()}
                                                                            </span>
                                                                            {work.status === 'completed' && 
                                                                                <span className="work-status">✓</span>
                                                                            }
                                                                        </div>
                                                                    );
                                                                })
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
           
        </div>
    )
} 