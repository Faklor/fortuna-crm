'use client'
import { useState } from "react"
import * as turf from '@turf/turf'
import '../scss/crop.scss'
import FieldItem from './FieldItem'

export default function PageClient({
    fields,
    seasons,
    subFields,
    works,
    workers,
    tech
}){
    // Базовый парсинг данных
    const safeJSONParse = (data, fallback = []) => {
        try {
            return JSON.parse(data) || fallback;
        } catch (e) {
            console.error('JSON Parse error:', e);
            return fallback;
        }
    };

    // Улучшенная функция для расчета площади
    const calculateArea = (coordinates) => {
        try {
            if (!coordinates || !Array.isArray(coordinates)) {
                return 0;
            }

            let polygonCoords = Array.isArray(coordinates[0][0]) ? coordinates[0] : coordinates;

            if (polygonCoords.length < 3) {
                console.warn('Not enough points for polygon');
                return 0;
            }

            const firstPoint = polygonCoords[0];
            const lastPoint = polygonCoords[polygonCoords.length - 1];

            if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                polygonCoords = [...polygonCoords, firstPoint];
            }

            const polygon = turf.polygon([polygonCoords]);
            const area = turf.area(polygon);
            
            // Округляем до 2 знаков после запятой
            return Number((area / 10000).toFixed(2));
        } catch (e) {
            console.error('Error calculating area:', e);
            return 0;
        }
    };

    const [fieldsState] = useState(() => {
        const parsedFields = safeJSONParse(fields);
        const parsedSeasons = safeJSONParse(seasons);
        const parsedSubFields = safeJSONParse(subFields);
        const parsedWorks = safeJSONParse(works);
        const parsedWorkers = safeJSONParse(workers);
        const parsedTech = safeJSONParse(tech);

        // Сначала обрабатываем все поля
        const processedFields = parsedFields.map(field => {
            const fieldWorks = parsedWorks.filter(work => work.fieldId === field._id);
            const fieldSeasons = field.properties?.seasons || [];
            
            return {
                id: field._id,
                name: field.properties?.Name || 'Без названия',
                area: calculateArea(field.coordinates),
                coordinates: field.coordinates,
                seasons: field.seasons.map(seasonId => {
                    const seasonInfo = fieldSeasons.find(s => s.year.toString() === seasonId.toString());
                    
                    // Фильтруем работы для конкретного сезона
                    const seasonWorks = fieldWorks.filter(work => {
                        if (!work.plannedDate) return false;
                        
                        // Получаем даты начала и конца двухлетнего периода
                        const seasonYear = parseInt(seasonId);
                        const seasonStart = new Date(seasonYear - 1, 0, 1); // 1 января предыдущего года
                        const seasonEnd = new Date(seasonYear, 11, 31); // 31 декабря текущего года
                        const workDate = new Date(work.plannedDate);

                        console.log(`Checking work date ${workDate} against season range:`, {
                            seasonYear,
                            seasonStart,
                            seasonEnd,
                            isInRange: workDate >= seasonStart && workDate <= seasonEnd
                        });

                        // Проверяем, попадает ли дата работы в двухлетний диапазон
                        return workDate >= seasonStart && workDate <= seasonEnd;
                    });

                    console.log(`Works for season ${seasonId}:`, seasonWorks);

                    const fieldSubFields = parsedSubFields
                        .filter(sub => sub.properties?.parentId === field._id)
                        .map(sub => ({
                            id: sub._id,
                            name: sub.properties?.Name || 'Без названия',
                            area: calculateArea(sub.coordinates),
                            seasonInfo: sub.properties?.seasons?.[0] || {}
                        }));

                    return {
                        year: seasonId,
                        crop: seasonInfo?.crop || 'Ничего',
                        variety: seasonInfo?.variety || 'Не указан',
                        description: seasonInfo?.description || 'Не указано',
                        sowingDate: seasonInfo?.sowingDate || 'Не указана',
                        harvestDate: seasonInfo?.harvestDate || 'Не указана',
                        works: seasonWorks.map(work => ({
                            id: work._id,
                            name: work.name,
                            type: work.type,
                            status: work.status,
                            plannedDate: new Date(work.plannedDate).toLocaleDateString('ru-RU'),
                            description: work.description,
                            area: work.area,
                            workers: work.workers?.map(workerId => 
                                parsedWorkers.find(w => w._id === workerId)
                            ).filter(Boolean) || [],
                            equipment: work.equipment?.map(techId => 
                                parsedTech.find(t => t._id === techId)
                            ).filter(Boolean) || []
                        })),
                        subFields: fieldSubFields
                    };
                })
            };
        });

        // Группируем поля с одинаковыми названиями
        const groupedFields = processedFields.reduce((acc, field) => {
            const existingFieldIndex = acc.findIndex(f => f.name === field.name);
            
            if (existingFieldIndex !== -1 && field.name !== 'Без названия') {
                // Если нашли поле с таким же названием и это не "Без названия"
                const existingField = acc[existingFieldIndex];
                
                // Объединяем поля, но оставляем площадь первого поля
                acc[existingFieldIndex] = {
                    ...existingField,
                    area: existingField.area, // Оставляем площадь первого поля
                    seasons: [...existingField.seasons, ...field.seasons]
                        .sort((a, b) => b.year - a.year),
                    relatedIds: [...(existingField.relatedIds || [existingField.id]), field.id],
                    isGrouped: true
                };
            } else {
                // Если это уникальное название или "Без названия", добавляем как есть
                acc.push({
                    ...field,
                    relatedIds: [field.id],
                    isGrouped: false
                });
            }
            return acc;
        }, []);

        return groupedFields.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    });

    return (
        <div className="crop-rotation">
            <ul className="crop-rotation__fields-list">
                {fieldsState.map((field, fieldIndex) => (
                    <FieldItem 
                        key={`field-${field.relatedIds.join('-')}-${fieldIndex}`}
                        field={field}
                    />
                ))}
            </ul>
        </div>
    );
}