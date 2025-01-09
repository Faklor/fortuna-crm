'use client'
import { useState } from "react"
import * as turf from '@turf/turf'
import '../scss/crop.scss'

// Добавляем словари для перевода
const workTypeTranslations = {
    'plowing': 'Вспашка',
    'cultivation': 'Культивация',
    'sowing': 'Посев',
    'fertilizing': 'Внесение удобрений',
    'spraying': 'Опрыскивание',
    'harvesting': 'Уборка',
    'other': 'Другое'
};

const workStatusTranslations = {
    'planned': 'Запланирована',
    'in_progress': 'В процессе',
    'completed': 'Завершена',
    'cancelled': 'Отменена',
    'delayed': 'Отложена'
};

export default function PageClient({
    fields,
    seasons,
    subFields,
    works
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
        const parsedWorks = safeJSONParse(works);

        // Сначала обрабатываем каждое поле как раньше
        const fieldsWithAreas = parsedFields.map(field => {
            const fieldSeasons = field.properties?.seasons || [];
            const fieldWorks = parsedWorks.filter(work => work.fieldId === field._id);
            
            return {
                id: field._id,
                name: field.properties?.Name || 'Без названия',
                area: calculateArea(field.coordinates),
                coordinates: field.coordinates,
                seasons: field.seasons.map(seasonId => {
                    const seasonInfo = fieldSeasons.find(s => s.year.toString() === seasonId.toString());
                    const seasonWorks = fieldWorks; // Все работы поля в каждом сезоне

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
                            area: work.area
                        })),
                        subFields: fieldSubFields
                    };
                })
            };
        });

        // Теперь группируем поля с одинаковыми названиями
        const groupedFields = fieldsWithAreas.reduce((acc, field) => {
            if (!acc[field.name]) {
                acc[field.name] = {
                    id: field.name, // Используем имя как ID группы
                    name: field.name,
                    area: field.area,
                    fields: [field]
                };
            } else {
                acc[field.name].area += field.area;
                acc[field.name].fields.push(field);
            }
            return acc;
        }, {});

        // Преобразуем обратно в массив и объединяем сезоны
        const mergedFields = Object.values(groupedFields).map(group => ({
            id: group.id,
            name: group.name,
            area: group.area,
            seasons: [...new Set(group.fields.flatMap(f => f.seasons.map(s => s.year)))]
                .sort((a, b) => b - a)
                .map(year => ({
                    year,
                    crop: group.fields[0].seasons.find(s => s.year === year)?.crop || 'Ничего',
                    variety: group.fields[0].seasons.find(s => s.year === year)?.variety || 'Не указан',
                    description: group.fields[0].seasons.find(s => s.year === year)?.description || 'Не указано',
                    sowingDate: group.fields[0].seasons.find(s => s.year === year)?.sowingDate || 'Не указана',
                    harvestDate: group.fields[0].seasons.find(s => s.year === year)?.harvestDate || 'Не указана',
                    works: group.fields.flatMap(f => 
                        f.seasons.find(s => s.year === year)?.works || []
                    ),
                    subFields: group.fields.flatMap(f => 
                        f.seasons.find(s => s.year === year)?.subFields || []
                    )
                }))
        }));

        return mergedFields.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    });

    return (
        <div className="crop-rotation">
            <ul className="crop-rotation__fields-list">
                {fieldsState.map((field, fieldIndex) => (
                    <li key={`field-${field.id}-${fieldIndex}`} className="crop-rotation__field-item">
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
                                            <th>Данные культуры</th>
                                            <th>Подполя</th>
                                            <th>Работы</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {field.seasons.map((season, index) => (
                                            <tr key={`${field.name}-season-${index}`}>
                                                <td>{season.year || 'Не указан'}</td>
                                                <td>
                                                    <div className="crop-rotation__crop-info">
                                                        <div className="crop-rotation__crop-main">
                                                            Культура: {season.crop || 'Не указана'}
                                                        </div>
                                                        {season.variety && (
                                                            <div className="crop-rotation__crop-detail">
                                                                Сорт: {season.variety}
                                                            </div>
                                                        )}
                                                        {season.description && (
                                                            <div className="crop-rotation__crop-detail">
                                                                Описание: {season.description}
                                                            </div>
                                                        )}
                                                        <div className="crop-rotation__crop-dates">
                                                            <div>Посев: {season.sowingDate || 'Не указана'}</div>
                                                            <div>Уборка: {season.harvestDate || 'Не указана'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {season.subFields?.length > 0 ? (
                                                        <div className="crop-rotation__subfields">
                                                            {season.subFields.map((subField) => {
                                                                const { seasonInfo } = subField;
                                                                return (
                                                                    <div key={subField.id} className="crop-rotation__subfield">
                                                                        <div className="crop-rotation__subfield-header">
                                                                            <div className="crop-rotation__subfield-name">
                                                                                {subField.name}
                                                                            </div>
                                                                            <div className="crop-rotation__subfield-area">
                                                                                {subField.area.toFixed(2)} га
                                                                            </div>
                                                                        </div>
                                                                        <div className="crop-rotation__subfield-info">
                                                                            {seasonInfo?.crop && (
                                                                                <div className="crop-rotation__subfield-crop">
                                                                                    Культура: {seasonInfo.crop}
                                                                                </div>
                                                                            )}
                                                                            {seasonInfo?.variety && (
                                                                                <div className="crop-rotation__subfield-variety">
                                                                                    Сорт: {seasonInfo.variety}
                                                                                </div>
                                                                            )}
                                                                            {seasonInfo?.description && (
                                                                                <div className="crop-rotation__subfield-description">
                                                                                    Описание: {seasonInfo.description}
                                                                                </div>
                                                                            )}
                                                                            {(seasonInfo?.sowingDate || seasonInfo?.harvestDate) && (
                                                                                <div className="crop-rotation__subfield-dates">
                                                                                    {seasonInfo.sowingDate && (
                                                                                        <div>Посев: {seasonInfo.sowingDate}</div>
                                                                                    )}
                                                                                    {seasonInfo.harvestDate && (
                                                                                        <div>Уборка: {seasonInfo.harvestDate}</div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span className="crop-rotation__no-subfields">Нет подполей</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {console.log('Rendering works cell for season:', season.year)}
                                                    {console.log('Works array:', season.works)}
                                                    {season.works && season.works.length > 0 ? (
                                                        <div className="crop-rotation__works-grid">
                                                            {Object.keys(workTypeTranslations).map(workType => {
                                                                const worksOfType = season.works.filter(work => work.type === workType);
                                                                
                                                                if (!worksOfType || worksOfType.length === 0) return null;
                                                                
                                                                return (
                                                                    <div key={`${workType}-${field.id}-${season.year}`} className="crop-rotation__works-column">
                                                                        <div className="crop-rotation__works-type">
                                                                            {workTypeTranslations[workType]}
                                                                        </div>
                                                                        <div className="crop-rotation__works-list">
                                                                            {worksOfType.map(work => (
                                                                                <div 
                                                                                    key={`${work.id}-${workType}`}
                                                                                    className="crop-rotation__work"
                                                                                    data-type={work.type}
                                                                                >
                                                                                    <div className="crop-rotation__work-name">
                                                                                        {work.name || 'Без названия'}
                                                                                    </div>
                                                                                    <div className="crop-rotation__work-info">
                                                                                        {work.status && (
                                                                                            <div>Статус: {workStatusTranslations[work.status] || work.status}</div>
                                                                                        )}
                                                                                        {work.plannedDate && (
                                                                                            <div>Дата: {work.plannedDate}</div>
                                                                                        )}
                                                                                        {work.area && (
                                                                                            <div>Площадь: {work.area.toFixed(2)} га</div>
                                                                                        )}
                                                                                        {work.description && (
                                                                                            <div>Описание: {work.description}</div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span className="crop-rotation__no-works">Нет работ</span>
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