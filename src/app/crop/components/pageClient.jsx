'use client'
import { useState } from "react"
import * as turf from '@turf/turf'
import '../scss/crop.scss'

export default function PageClient({
    fields,
    seasons,
    subFields
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

            // Если координаты переданы как массив точек
            let polygonCoords = Array.isArray(coordinates[0][0]) ? coordinates[0] : coordinates;

            // Проверяем, достаточно ли точек для полигона
            if (polygonCoords.length < 3) {
                console.warn('Not enough points for polygon');
                return 0;
            }

            // Проверяем, замкнут ли полигон
            const firstPoint = polygonCoords[0];
            const lastPoint = polygonCoords[polygonCoords.length - 1];

            // Если полигон не замкнут, добавляем первую точку в конец
            if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                polygonCoords = [...polygonCoords, firstPoint];
            }

            // Создаем полигон из координат
            const polygon = turf.polygon([polygonCoords]);
            
            // Получаем площадь в квадратных метрах
            const area = turf.area(polygon);
            
            // Переводим в гектары
            return area / 10000;
        } catch (e) {
            console.error('Error calculating area:', e);
            return 0;
        }
    };

    const [fieldsState] = useState(() => {
        const parsedFields = safeJSONParse(fields);
        const parsedSeasons = safeJSONParse(seasons);
        const parsedSubFields = safeJSONParse(subFields);
        
        const fieldsWithAreas = parsedFields.map(field => {
            const fieldSeasons = field.properties?.seasons || [];
            
            return {
                ...field,
                area: calculateArea(field.coordinates),
                seasons: field.seasons.map(seasonId => {
                    const seasonInfo = fieldSeasons.find(s => s.year.toString() === seasonId.toString());
                    
                    return {
                        year: seasonId,
                        crop: seasonInfo?.crop || 'Ничего',
                        variety: seasonInfo?.variety || 'Не указан',
                        description: seasonInfo?.description || 'Не указано',
                        sowingDate: seasonInfo?.sowingDate || 'Не указана',
                        harvestDate: seasonInfo?.harvestDate || 'Не указана'
                    };
                }),
                subFields: parsedSubFields
                    .filter(sub => sub.properties?.parentId === field._id)
                    .map(sub => ({
                        id: sub._id,
                        name: sub.properties?.Name || 'Без названия',
                        area: calculateArea(sub.coordinates),
                        seasons: sub.properties?.seasons || []
                    }))
            };
        });

        const groupedFields = fieldsWithAreas.reduce((acc, field) => {
            const fieldName = field.properties?.Name || 'Без названия';
            
            if (!acc[fieldName]) {
                acc[fieldName] = {
                    id: field._id,
                    name: fieldName,
                    area: field.area,
                    seasons: field.seasons,
                    coordinates: field.coordinates,
                    subFields: field.subFields
                };
            } else {
                // Объединяем сезоны, избегая дубликатов
                const existingSeasonYears = acc[fieldName].seasons.map(s => s.year);
                const newSeasons = field.seasons.filter(season => 
                    !existingSeasonYears.includes(season.year)
                );
                acc[fieldName].seasons = [...acc[fieldName].seasons, ...newSeasons];
                
                // Сортируем сезоны по году в обратном порядке
                acc[fieldName].seasons.sort((a, b) => b.year - a.year);
                
                // Обновляем площадь (можно суммировать или взять максимальную)
                acc[fieldName].area = Math.max(acc[fieldName].area, field.area);
                
                // Объединяем подполя
                acc[fieldName].subFields = [...acc[fieldName].subFields, ...field.subFields];
            }
            
            return acc;
        }, {});

        return Object.values(groupedFields).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    });

    return (
        <div className="crop-rotation">
            <ul className="crop-rotation__fields-list">
                {fieldsState.map(field => (
                    <li key={field.name} className="crop-rotation__field-item">
                        <div className="crop-rotation__field-header">
                            <div className="crop-rotation__field-name">
                                {field.name}
                            </div>
                            <div className="crop-rotation__field-area">
                                {field.area.toFixed(2)} га
                            </div>
                        </div>
                        
                        {field.seasons.length > 0 ? (
                            <div className="crop-rotation__seasons-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Сезон</th>
                                            <th>Культура</th>
                                            <th>Сорт</th>
                                            <th>Описание</th>
                                            <th>Дата сева</th>
                                            <th>Дата уборки</th>
                                            <th>Подполя</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {field.seasons.map((season, index) => (
                                            <tr key={`${field.name}-season-${index}`}>
                                                <td>{season.year || 'Не указан'}</td>
                                                <td>{season.crop || 'Не указана'}</td>
                                                <td>{season.variety || 'Не указан'}</td>
                                                <td>{season.description || 'Не указано'}</td>
                                                <td>{season.sowingDate || 'Не указана'}</td>
                                                <td>{season.harvestDate || 'Не указана'}</td>
                                                <td>
                                                    {field.subFields?.length > 0 ? (
                                                        <div className="crop-rotation__subfields">
                                                            {field.subFields.map((subField, subIndex) => {
                                                                const subFieldSeason = subField.seasons.find(s => s.year === season.year);
                                                                return (
                                                                    <div key={subIndex} className="crop-rotation__subfield">
                                                                        <div className="crop-rotation__subfield-name">
                                                                            {subField.name}
                                                                        </div>
                                                                        <div className="crop-rotation__subfield-area">
                                                                            {subField.area.toFixed(2)} га
                                                                        </div>
                                                                        {subFieldSeason && (
                                                                            <div className="crop-rotation__subfield-info">
                                                                                <div>Культура: {subFieldSeason.crop || 'Не указана'}</div>
                                                                                {subFieldSeason.variety && <div>Сорт: {subFieldSeason.variety}</div>}
                                                                                {subFieldSeason.sowingDate && <div>Посев: {subFieldSeason.sowingDate}</div>}
                                                                                {subFieldSeason.harvestDate && <div>Уборка: {subFieldSeason.harvestDate}</div>}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span className="crop-rotation__no-subfields">Нет подполей</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="crop-rotation__no-seasons">
                                Нет данных о сезонах
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}