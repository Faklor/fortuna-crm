'use client'
import { workTypeTranslations, workStatusTranslations } from './translations'

export default function FieldItem({ field }) {
    const renderWorkDetails = (work) => (
        <div className="crop-rotation__work-info">
            {work.status && (
                <div className={`status ${work.status}`}>
                    {workStatusTranslations[work.status] || work.status}
                </div>
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
            {work.workers && work.workers.length > 0 && (
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
            {work.equipment && work.equipment.length > 0 && (
                <div className="crop-rotation__work-equipment">
                    <div className="crop-rotation__work-section-title">Техника:</div>
                    <div className="crop-rotation__work-items">
                        {work.equipment.map(tech => (
                            <span key={tech._id} className="crop-rotation__work-item">
                                {tech.name || tech.properties?.Name || 'Без названия'}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <li className="crop-rotation__field-item">
            <div className="crop-rotation__field-header">
                <div className="crop-rotation__field-name">
                    {field.name}
                    
                </div>
                <div className="crop-rotation__field-area">
                    {Number(field.area).toFixed(2)} га
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
                            {field.seasons.map((season, index) => {
                                return (
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
                                                    {season.subFields.map((subField) => (
                                                        <div key={subField.id} className="crop-rotation__subfield">
                                                            <div className="crop-rotation__subfield-header">
                                                                <div className="crop-rotation__subfield-name">
                                                                    {subField.name}
                                                                </div>
                                                                <div className="crop-rotation__subfield-area">
                                                                    {subField.area.toFixed(2)} га
                                                                </div>
                                                            </div>
                                                            {subField.seasonInfo && (
                                                                <div className="crop-rotation__subfield-season">
                                                                    {subField.seasonInfo.crop && (
                                                                        <div className="crop-rotation__subfield-crop">
                                                                            Культура: {subField.seasonInfo.crop}
                                                                        </div>
                                                                    )}
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
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="crop-rotation__no-subfields">Нет подполей</span>
                                            )}
                                        </td>
                                        <td>
                                            {season.works && season.works.length > 0 ? (
                                                <div className="crop-rotation__works-grid">
                                                    {Object.keys(workTypeTranslations).map(workType => {
                                                        const worksOfType = season.works
                                                            .filter(work => work.type === workType)
                                                            // Сортируем работы по дате (будущие сверху)
                                                            .sort((a, b) => new Date(b.plannedDate) - new Date(a.plannedDate));
                                                        
                                                        if (!worksOfType.length) return null;
                                                        
                                                        return (
                                                            <details 
                                                                key={`worktype-${workType}-${season.year}`} 
                                                                className="crop-rotation__works-group"
                                                            >
                                                                <summary className="crop-rotation__works-type">
                                                                    {workTypeTranslations[workType]}
                                                                    <span className="crop-rotation__works-count">
                                                                        {worksOfType.length}
                                                                    </span>
                                                                </summary>
                                                                <div className="crop-rotation__works-list">
                                                                    {worksOfType.map(work => (
                                                                        <div 
                                                                            key={`work-${work.id}-${season.year}`}
                                                                            className="crop-rotation__work"
                                                                            data-type={work.type}
                                                                        >
                                                                            <div className="crop-rotation__work-name">
                                                                                {work.name || 'Без названия'}
                                                                            </div>
                                                                            {renderWorkDetails(work)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </details>
                                                        );
                                                    }).filter(Boolean)}
                                                </div>
                                            ) : (
                                                <span className="crop-rotation__no-works">Нет работ</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="crop-rotation__no-seasons">
                    Нет данных о сезонах
                </div>
            )}
        </li>
    )
} 