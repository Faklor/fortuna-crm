import React, { useState } from 'react';
import styles from '../scss/RavenInfoPanel.scss';
import { getTrackColor } from '../utils/colors';

export function RavenInfoPanel({ data }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' или 'files'
    
    if (!data) return null;

    const { deviceInfo, tasks, totalArea, totalWorkingHours, rawFiles } = data;

    const renderMachineInfo = () => {
        const machineConfig = rawFiles['machineConfig.json'];
        if (!machineConfig) return null;

        return (
            <div className="machine-info-section">
                <h4>Конфигурация техники</h4>
                <div className="machine-details">
                    {machineConfig.assignedImplements?.map((implement, index) => (
                        <div key={index} className="implement-item">
                            <h5>{implement.name}</h5>
                            <p><strong>Ширина захвата:</strong> {implement.guidanceWidth} м</p>
                            <p><strong>Количество секций:</strong> {implement.sectionCount}</p>
                            <div className="sections-info">
                                {implement.sections?.map((section, sIndex) => (
                                    <div key={sIndex} className="section-item">
                                        <p>Секция {sIndex + 1}:</p>
                                        <p>- Ширина: {section.width} м</p>
                                        <p>- Смещение вправо: {section.rightOffset} м</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderLineInfo = () => {
        const lineData = rawFiles['line.json'];
        if (!lineData) return null;

        return (
            <div className="line-info-section">
                <h4>Информация о линии</h4>
                <div className="line-details">
                    <p><strong>Режим:</strong> {lineData.currentMode}</p>
                    <p><strong>Длина:</strong> {lineData.length?.toFixed(2)} м</p>
                    <p><strong>Угол:</strong> {lineData.cog?.toFixed(2)}°</p>
                    <p><strong>Количество точек:</strong> {lineData.line?.length || 0}</p>
                    {lineData.line && lineData.line.length > 0 && (
                        <div className="coordinates-sample">
                            <h5>Пример координат (первая точка):</h5>
                            <p>X: {lineData.line[0].X}</p>
                            <p>Y: {lineData.line[0].Y}</p>
                            <p>Z: {lineData.line[0].Z}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFieldGeometry = () => {
        const fieldExtent = rawFiles['fieldExtent.geojson'];
        if (!fieldExtent) return null;

        return (
            <div className="field-geometry-section">
                <h4>Геометрия поля</h4>
                <div className="geometry-details">
                    <p><strong>Тип геометрии:</strong> {fieldExtent.features?.[0]?.geometry?.type || 'Н/Д'}</p>
                    <p><strong>Количество точек:</strong> {fieldExtent.features?.[0]?.geometry?.coordinates?.[0]?.length || 0}</p>
                </div>
            </div>
        );
    };

    const renderCoverageMap = () => {
        const fieldExtent = data.rawFiles['fieldExtent.geojson'];
        if (!fieldExtent?.features?.[0]?.geometry?.coordinates) return null;

        // Находим крайние точки
        const coordinates = fieldExtent.features[0].geometry.coordinates[0];
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        coordinates.forEach(([lng, lat]) => {
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        });

        return (
            <div className="coverage-map-section">
                <h4>Карта покрытия</h4>
                <div className="coordinates-grid">
                    <p><strong>Южная широта:</strong> {minLat.toFixed(6)}°</p>
                    <p><strong>Западная долгота:</strong> {minLng.toFixed(6)}°</p>
                    <p><strong>Северная широта:</strong> {maxLat.toFixed(6)}°</p>
                    <p><strong>Восточная долгота:</strong> {maxLng.toFixed(6)}°</p>
                    <p><strong>Общая площадь:</strong> {(data.totalArea || 0).toFixed(2)} га</p>
                </div>
            </div>
        );
    };

    const renderJobInfo = () => {
        const { jobInfo } = data;
        
        return (
            <div className="job-info-section">
                <h4>Информация о работе</h4>
                <div className="job-details">
                    <p><strong>Название:</strong> {jobInfo.name || 'Н/Д'}</p>
                    <p><strong>Агрегат:</strong> {jobInfo.implement?.width ? `Агрегат ${jobInfo.implement.width}м` : 'Н/Д'}</p>
                    <p><strong>Ширина захвата:</strong> {jobInfo.implement?.width || 'Н/Д'} м</p>
                    <p><strong>Количество секций:</strong> {jobInfo.implement?.sections?.length || 'Н/Д'}</p>
                    <p><strong>Обработанная площадь:</strong> {jobInfo.totalArea?.toFixed(2)} га</p>
                    <p><strong>Пройденное расстояние:</strong> {jobInfo.gpsDistanceTraveled?.toFixed(2)} км</p>
                    <p><strong>Время работы:</strong> {data.totalWorkingHours?.toFixed(2)} ч</p>
                    <p><strong>Начало работы:</strong> {jobInfo.startTime ? new Date(jobInfo.startTime).toLocaleString() : 'Н/Д'}</p>
                    <p><strong>Окончание работы:</strong> {jobInfo.endTime ? new Date(jobInfo.endTime).toLocaleString() : 'Н/Д'}</p>
                    
                    {jobInfo.products?.length > 0 && (
                        <div className="products-info">
                            <h5>Информация о продуктах:</h5>
                            {jobInfo.products.map((product, index) => (
                                <div key={product.id} className="product-item">
                                    <p><strong>{product.name}:</strong></p>
                                    <p>- Площадь: {product.area?.toFixed(2)} га</p>
                                    <p>- Расстояние: {(product.distance / 1000)?.toFixed(2)} км</p>
                                    <p>- Полигонов: {product.polygons}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="raven-info-panel">
            <div className="panel-tabs">
                <button 
                    className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    Сводка
                </button>
                <button 
                    className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                >
                    Файлы
                </button>
            </div>

            {activeTab === 'summary' ? (
                <>
                    <div className="raven-info-header">
                        <h3>Информация о работах Raven</h3>
                        <div className="device-info">
                            <p><strong>Модель:</strong> {deviceInfo.model || 'Н/Д'}</p>
                            <p><strong>Серийный номер:</strong> {deviceInfo.serialNumber || 'Н/Д'}</p>
                            <p><strong>Версия ПО:</strong> {deviceInfo.softwareVersion || 'Н/Д'}</p>
                        </div>
                    </div>

                    {renderCoverageMap()}
                    {renderJobInfo()}
                    {renderMachineInfo()}
                    {renderLineInfo()}
                    {renderFieldGeometry()}
                </>
            ) : (
                <div className="raw-files-section">
                    <div className="file-selector">
                        {rawFiles && Object.keys(rawFiles).map(filename => (
                            <button
                                key={filename}
                                onClick={() => setSelectedFile(filename)}
                                className={`file-button ${selectedFile === filename ? 'selected' : ''}`}
                            >
                                {filename}
                            </button>
                        ))}
                    </div>
                    {selectedFile && (
                        <div className="file-content">
                            <h5>{selectedFile}</h5>
                            <pre>
                                {JSON.stringify(rawFiles[selectedFile], null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 