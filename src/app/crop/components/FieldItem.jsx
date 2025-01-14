'use client'
import { workTypeTranslations, workStatusTranslations } from './translations'
import { memo, useMemo } from 'react'

// Выносим подкомпоненты для оптимизации ререндеров
const WorkDetails = memo(({ work }) => (
    <div className="crop-rotation__work-info"> 
        {work.status && (
            <div className={`status ${work.status}`}>
                {workStatusTranslations[work.status] || work.status}
            </div>
        )}
        {work.plannedDate && <div>Дата: {work.plannedDate}</div>}
        {work.area && <div>Площадь: {work.area.toFixed(2)} га</div>}
        {work.description && <div>Описание: {work.description}</div>}
        {work.workers?.length > 0 && (
            <div className="crop-rotation__work-workers">
                <div className="crop-rotation__work-section-title">Работники:</div>
                <div className="crop-rotation__work-items">
                    {work.workers.map(worker => (
                        <span key={worker._id} className="crop-rotation__work-item">
                            {worker.name || worker.properties?.Name || 'Без имени'}
                        </span>
                    ))}
                </div>
            </div>
        )}
        {work.equipment?.length > 0 && (
            <div className="crop-rotation__work-equipment">
                <div className="crop-rotation__work-section-title">Техника:</div>
                <div className="crop-rotation__work-items">
                    {work.equipment.map((tech, techIndex) => (
                        <span key={techIndex} className="crop-rotation__work-item">
                            {tech.displayName || tech.name}
                        </span>
                    ))}
                </div>
            </div>
        )}
    </div>
));

const SubField = memo(({ subField }) => (
    <div key={subField.id} className="crop-rotation__subfield">
        <div className="crop-rotation__subfield-header">
            <div className="crop-rotation__subfield-name">{subField.name}</div>
            <div className="crop-rotation__subfield-area">{subField.area} га</div>
        </div>
        {subField.seasonInfo?.crop && (
            <div className="crop-rotation__subfield-season">
                <div className="crop-rotation__subfield-crop">
                    Культура: {subField.seasonInfo.crop}
                </div>
                {subField.seasonInfo.variety && (
                    <div className="crop-rotation__subfield-variety">
                        Сорт: {subField.seasonInfo.variety}
                    </div>
                )}
                {subField.seasonInfo.sowingDate && (
                    <div className="crop-rotation__subfield-date">
                        Посев: {subField.seasonInfo.sowingDate}
                    </div>
                )}
                {subField.seasonInfo.harvestDate && (
                    <div className="crop-rotation__subfield-date">
                        Уборка: {subField.seasonInfo.harvestDate}
                    </div>
                )}
            </div>
        )}
    </div>
));

const WorksGroup = memo(({ works, workType, seasonYear }) => {
    // Порядок типов работ для сортировки
    const workTypeOrder = {
        'plowing': 1,        // Вспашка
        'chiseling': 2,      // Чизелевание
        'deep_loosening': 3, // Глубокое рыхление
        'cultivation': 4,    // Культивация
        'disking': 5,        // Дискование
        'peeling': 6,        // Лущение
        'harrowing': 7,      // Боронование
        'rolling': 8,        // Прокатывание
        'fertilizing': 9,    // Внесение удобрений
        'seeding': 10,       // Посев
        'spraying': 11,      // Опрыскивание
        'harvesting': 12     // Уборка
    };

    const sortedWorks = useMemo(() => 
        works.sort((a, b) => {
            // Сначала сортируем по типу работы
            const typeOrderDiff = (workTypeOrder[a.type] || 99) - (workTypeOrder[b.type] || 99);
            if (typeOrderDiff !== 0) return typeOrderDiff;
            
            // Затем по дате
            return new Date(b.plannedDate) - new Date(a.plannedDate);
        }),
        [works]
    );

    return (
        <details 
            key={`worktype-${workType}-${seasonYear}`} 
            className="crop-rotation__works-group"
            data-type={workType}
        >
            <summary className="crop-rotation__works-type">
                {workTypeTranslations[workType] || workType}
                <span className="crop-rotation__works-count">{works.length}</span>
            </summary>
            <div className="crop-rotation__works-list">
                {sortedWorks.map(work => (
                    <div 
                        key={`work-${work.id}-${seasonYear}`}
                        className="crop-rotation__work"
                        data-type={work.type}
                    >
                        <div className="crop-rotation__work-name">
                            {work.name || workTypeTranslations[work.type] || 'Без названия'}
                        </div>
                        <WorkDetails work={work} />
                    </div>
                ))}
            </div>
        </details>
    );
});

const FieldItem = memo(({ field }) => {
    const sortedSeasons = useMemo(() => 
        [...field.seasons].sort((a, b) => b.year - a.year),
        [field.seasons]
    );

    return (
        <li className="crop-rotation__field">
            <div className="crop-rotation__field-header">
                <div className="crop-rotation__field-name">{field.name}</div>
                <div className="crop-rotation__field-area">
                    {field.seasons.map((season, index) => (
                        <span key={`area-${season.year}`}>
                            {field.area} га - {season.year}
                            {index < field.seasons.length - 1 ? ', ' : ''}
                        </span>
                    ))}
                </div>
            </div>
            
            {sortedSeasons.length > 0 ? (
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
                            {sortedSeasons.map((season, index) => (
                                <tr key={`${field.name}-season-${index}`}>
                                    <td>{season.year || 'Не указан'}</td>
                                    <td>
                                        <div className="crop-rotation__crop-info">
                                        {season.crop ? (
                                            <>
                                                <div className="crop-rotation__crop-main">
                                                    Культура: {season.crop}
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
                                                    {season.sowingDate && <div>Посев: {season.sowingDate}</div>}
                                                    {season.harvestDate && <div>Уборка: {season.harvestDate}</div>}
                                                </div>
                                            </>
                                        ) : (
                                            <span className="crop-rotation__no-crop">
                                                Нет данных
                                            </span>
                                        )}
                                        </div>
                                    </td>
                                    <td>
                                        {season.subFields?.length > 0 ? (
                                            <div className="crop-rotation__subfields">
                                                {season.subFields.map(subField => (
                                                    <SubField key={subField.id} subField={subField} />
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="crop-rotation__no-subfields">
                                                Нет подполей
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {season.works?.length > 0 ? (
                                            <div className="crop-rotation__works-grid">
                                                {Object.keys(workTypeTranslations).map(workType => {
                                                    const worksOfType = season.works
                                                        .filter(work => work.type === workType);
                                                    
                                                    return worksOfType.length ? (
                                                        <WorksGroup 
                                                            key={`${workType}-${season.year}`}
                                                            works={worksOfType}
                                                            workType={workType}
                                                            seasonYear={season.year}
                                                        />
                                                    ) : null;
                                                })}
                                            </div>
                                        ) : (
                                            <span className="crop-rotation__no-works">
                                                Нет работ
                                            </span>
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
    );
});

export default FieldItem; 