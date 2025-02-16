'use client'
import { workTypeTranslations, workStatusTranslations } from './translations'
import { memo, useMemo, useState } from 'react'
import '../scss/field-item.scss'

// Выносим подкомпоненты для оптимизации ререндеров
const WorkDetails = memo(({ work, subFields }) => (
    <div className="crop-rotation__work-info"> 
        {work.status && (
            <div className={`status ${work.status}`}>
                {workStatusTranslations[work.status] || work.status}
            </div>
        )}
        {work.plannedDate && <div>Дата: {work.plannedDate}</div>}
        {work.area && <div className="crop-rotation__work-area-type">
            <span className="crop-rotation__work-item area-type">
                {work.areaSelectionType === 'full' && 'Обработка всего поля'}
                {work.areaSelectionType === 'custom' && 'Выборочная обработка'}
                {work.areaSelectionType !== 'full' && work.areaSelectionType !== 'custom' && 
                    `Обработка подполя ${subFields?.find(sf => sf._id === work.areaSelectionType)?.name || 'Без названия'}`}
                {`: ${work.area.toFixed(2)} га`}
            </span>
        </div>}   
        {work.description && <div>Описание: {work.description}</div>}
        {work.workers?.length > 0 && (
            <div className="crop-rotation__work-workers">
                <div className="crop-rotation__work-section-title">Работники:</div>
                <div className="crop-rotation__work-items">
                    {work.workers.map(worker => (
                        <span key={worker._id} className="crop-rotation__work-item worker">
                            {worker.name || 'Без имени'}
                        </span>
                    ))}
                </div>
            </div>
        )}
        {work.equipment?.length > 0 && (
            <div className="crop-rotation__work-equipment">
                <div className="crop-rotation__work-section-title">Техника:</div>
                <div className="crop-rotation__work-items">
                    {work.equipment.map((tech, index) => (
                        <span key={`${tech._id}-${index}`} className="crop-rotation__work-item equipment">
                            {tech.category && `${tech.category} `}
                            {tech.displayName || tech.name}
                            {tech.captureWidth && ` (${tech.captureWidth.toFixed(1)}м)`}
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

const WorksGroup = memo(({ works, workType, seasonYear, subFields, subFieldId = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Сортируем работы по дате (будущие даты вверху)
    const sortedWorks = useMemo(() => {
        return [...works].sort((a, b) => {
            // Преобразуем строки дат в объекты Date
            const dateA = a.plannedDate ? new Date(a.plannedDate.split('.').reverse().join('-')) : new Date(0);
            const dateB = b.plannedDate ? new Date(b.plannedDate.split('.').reverse().join('-')) : new Date(0);
            // Сравниваем даты (более поздние даты будут вверху)
            return dateB - dateA;
        });
    }, [works]);

    const handleToggle = (e) => {
        e.preventDefault();
        setIsOpen(!isOpen);
    };

    return (
        <div 
            className={`crop-rotation__works-group ${isOpen ? 'open' : ''}`}
            data-type={workType}
        >
            <div 
                className="crop-rotation__works-type"
                onClick={handleToggle}
                role="button"
                tabIndex={0}
                data-type={workType}
            >
                {workTypeTranslations[workType] || workType}
                <span className="crop-rotation__works-count">{works.length}</span>
            </div>
            {isOpen && (
                <div 
                    className="crop-rotation__works-list"
                    data-type={workType}
                >
                    {sortedWorks.map(work => ( // Используем отсортированный массив
                        <div 
                            key={`work-${work.id}-${seasonYear}-${subFieldId}`}
                            className="crop-rotation__work"
                            data-type={workType}
                        >
                            <div className="crop-rotation__work-name">
                                {work.name || workTypeTranslations[work.type] || 'Без названия'}
                            </div>
                            <WorkDetails work={work} subFields={subFields} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

const FieldItem = memo(({ field, subFields }) => {
    const sortedSeasons = useMemo(() => 
        [...field.seasons].sort((a, b) => b.year - a.year),
        [field.seasons]
    );

    return (
        <li className="crop-rotation__field" data-field-name={field.name}>
            <div className="crop-rotation__field-header">
                <div className="crop-rotation__field-name">{field.name}</div>
                <div className="crop-rotation__field-area">
                    {sortedSeasons.map((season, index) => (
                        <span key={`area-${season.year}`}>
                            {season.area.toFixed(2)} га - {season.year}
                            {index < sortedSeasons.length - 1 ? ', ' : ''}
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
                                <th>Работы по полю</th>
                                {sortedSeasons[0].subFields?.map(subField => (
                                    <th key={`subfield-works-${subField.id}`}>
                                        Работы по подполю {subField.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSeasons.map((season, index) => (
                                <tr key={`${field.id}-season-${season.year}-${index}`}>
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
                                                        .filter(work => 
                                                            work.type === workType && 
                                                            (work.areaSelectionType === 'full' || work.areaSelectionType === 'custom')
                                                        );
                                                    
                                                    return worksOfType.length ? (
                                                        <WorksGroup 
                                                            key={`worktype-${workType}-${season.year}`}
                                                            works={worksOfType}
                                                            workType={workType}
                                                            seasonYear={season.year}
                                                            subFields={subFields}
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
                                    {season.subFields?.map(subField => (
                                        <td key={`subfield-works-${subField.id}`}>
                                            {season.works?.length > 0 ? (
                                                <div className="crop-rotation__works-grid">
                                                    {Object.keys(workTypeTranslations).map(workType => {
                                                        const worksOfType = season.works
                                                            .filter(work => 
                                                                work.type === workType && 
                                                                work.areaSelectionType === subField.id
                                                            );
                                                        
                                                        return worksOfType.length ? (
                                                            <WorksGroup 
                                                                key={`worktype-${workType}-${season.year}-${subField.id}`}
                                                                works={worksOfType}
                                                                workType={workType}
                                                                seasonYear={season.year}
                                                                subFields={subFields}
                                                                subFieldId={subField.id}
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
                                    ))}
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