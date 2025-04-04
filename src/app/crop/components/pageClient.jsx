'use client'
import { useState } from "react"
import * as turf from '@turf/turf'
import '../scss/crop.scss'
import FieldItem from './FieldItem'
import FieldNavigation from './FieldNavigation'

export default function PageClient({
    fields,
    seasons,
    subFields,
    works,
    workers,
    tech,
    operations
}){
    const safeJSONParse = (data, fallback = []) => {
        try {
            return JSON.parse(data) || fallback;
        } catch (e) {
            return fallback;
        }
    };

    const calculateArea = (coordinates) => {
        try {
            if (!coordinates || !Array.isArray(coordinates)) {
                return 0;
            }

            let polygonCoords = Array.isArray(coordinates[0][0]) ? coordinates[0] : coordinates;

            if (polygonCoords.length < 3) {
                return 0;
            }

            const firstPoint = polygonCoords[0];
            const lastPoint = polygonCoords[polygonCoords.length - 1];

            if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                polygonCoords = [...polygonCoords, firstPoint];
            }

            const polygon = turf.polygon([polygonCoords]);
            const area = turf.area(polygon);
            
            return Number((area / 10000).toFixed(2));
        } catch (e) {
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
        

        const processedFields = parsedFields.map(field => {
            const fieldWorks = parsedWorks.filter(work => work.fieldId === field._id);
            const fieldSeasons = field.properties?.seasons || [];
            const fieldArea = calculateArea(field.coordinates);
            
            return {
                id: field._id,
                name: field.properties?.Name || 'Без названия',
                area: fieldArea,
                coordinates: field.coordinates,
                seasons: field.seasons.map(seasonId => {
                    const seasonInfo = fieldSeasons.find(s => s.year.toString() === seasonId.toString());
                    
                    const seasonWorks = fieldWorks.filter(work => {
                        if (!work.plannedDate) return false;
                        
                        const seasonYear = parseInt(seasonId);
                        const seasonStart = new Date(seasonYear - 1, 0, 1);
                        const seasonEnd = new Date(seasonYear, 11, 31);
                        const workDate = new Date(work.plannedDate);

                        return workDate >= seasonStart && workDate <= seasonEnd;
                    });

                    const fieldSubFields = parsedSubFields
                        .filter(sub => sub.properties?.parentId === field._id)
                        .map(sub => {
                            const coords = sub.coordinates;
                            let polygonCoords = Array.isArray(coords[0][0]) ? coords[0] : coords;
                            
                            // Проверяем и меняем местами координаты если нужно
                            if (Math.abs(polygonCoords[0][0]) < 90) {
                                polygonCoords = polygonCoords.map(coord => [coord[1], coord[0]]);
                            }

                            // Замыкаем полигон если нужно
                            const firstPoint = polygonCoords[0];
                            const lastPoint = polygonCoords[polygonCoords.length - 1];
                            if (JSON.stringify(firstPoint) !== JSON.stringify(lastPoint)) {
                                polygonCoords.push(firstPoint);
                            }

                            // Создаем полигон и считаем площадь
                            const geojsonPolygon = turf.polygon([polygonCoords]);
                            const areaInSquareMeters = turf.area(geojsonPolygon);
                            const areaInHectares = Math.round((areaInSquareMeters / 10000) * 100) / 100;

                            return {
                                id: sub._id,
                                name: sub.properties?.Name || 'Без названия',
                                area: areaInHectares,
                                seasonInfo: sub.properties?.seasons?.[0] || {}
                            };
                        });

                    return {
                        year: seasonId,
                        area: fieldArea,
                        crop: seasonInfo?.crop || '',
                        variety: seasonInfo?.variety || '',
                        description: seasonInfo?.description || '',
                        sowingDate: seasonInfo?.sowingDate || '',
                        harvestDate: seasonInfo?.harvestDate || '',
                        works: seasonWorks.map(work => ({
                            id: work._id,
                            name: work.name,
                            type: work.type,
                            status: work.status,
                            plannedDate: new Date(work.plannedDate).toLocaleDateString('ru-RU'),
                            description: work.description,
                            area: work.area,
                            areaSelectionType: work.areaSelectionType,
                            processingArea: work.processingArea,
                            workers: work.workers?.map(worker => ({
                                _id: worker._id,
                                name: worker.name
                            })) || [],
                            equipment: work.equipment?.map(tech => ({
                                _id: tech._id,
                                name: tech.name,
                                category: tech.category,
                                captureWidth: tech.captureWidth,
                                displayName: tech.category === '🚃 Прицепы' && tech.captureWidth ? 
                                    `${tech.name} (${tech.captureWidth.toFixed(1)}м)` : 
                                    tech.name
                            })) || []
                        })),
                        subFields: fieldSubFields
                    };
                })
            };
        });

        const groupedFields = processedFields.reduce((acc, field) => {
            const existingFieldIndex = acc.findIndex(f => f.name === field.name);
            
            if (existingFieldIndex !== -1 && field.name !== 'Без названия') {
                const existingField = acc[existingFieldIndex];
                
                acc[existingFieldIndex] = {
                    ...existingField,
                    area: existingField.area + field.area,
                    seasons: [...existingField.seasons, ...field.seasons]
                        .sort((a, b) => b.year - a.year),
                    relatedIds: [...(existingField.relatedIds || [existingField.id]), field.id],
                    isGrouped: true
                };
            } else {
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
            <FieldNavigation fields={fieldsState} />
            <div className="crop-rotation__content">
                <ul className="crop-rotation__fields-list">
                    {fieldsState.map((field, fieldIndex) => (
                        <FieldItem 
                            key={`field-${field.relatedIds.join('-')}-${fieldIndex}`}
                            field={field}
                            subFields={safeJSONParse(subFields).map(sub => ({
                                _id: sub._id,
                                name: sub.properties?.Name || 'Без названия'
                            }))}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
}