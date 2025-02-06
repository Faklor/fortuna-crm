import React from 'react';
import { useMap } from 'react-leaflet';
import { Circle, FeatureGroup, Polygon, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getTrackColor } from '../utils/colors';
import * as turf from '@turf/turf';

export function RavenLayer({ data }) {
    const map = useMap();

    React.useEffect(() => {
        if (map && data?.tasks?.[0]?.passes) {
            const allPoints = data.tasks.flatMap(task => 
                task.passes.flatMap(pass => 
                    pass.map(point => [
                        point.coordinates.lat,
                        point.coordinates.lng
                    ])
                )
            );

            if (allPoints.length > 0) {
                const bounds = L.latLngBounds(allPoints);
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [map, data]);

    // Конвертация ECEF координат в lat/lng
    const ecefToLatLng = (X, Y, Z) => {
        const a = 6378137.0; // WGS84 полуось
        const e = 0.081819190842622; // WGS84 эксцентриситет

        const p = Math.sqrt(X * X + Y * Y);
        const theta = Math.atan2(Z * a, p * a * Math.sqrt(1 - e * e));
        const lon = Math.atan2(Y, X);
        const lat = Math.atan2(
            Z + e * e * a * Math.pow(Math.sin(theta), 3),
            p - e * e * a * Math.pow(Math.cos(theta), 3)
        );

        return [
            lat * 180 / Math.PI,
            lon * 180 / Math.PI
        ];
    };

    // Получаем точки линии из line.json
    const renderGuidanceLine = () => {
        if (!data?.rawFiles?.['line.json']?.line) return null;

        const linePoints = data.rawFiles['line.json'].line.map(point => 
            ecefToLatLng(point.X, point.Y, point.Z)
        );

        return (
            <FeatureGroup>
                <Polyline
                    positions={linePoints}
                    pathOptions={{
                        color: '#00ff00', // Зеленый цвет для линии навигации
                        weight: 2,
                        dashArray: '10, 10', // Пунктирная линия
                        opacity: 0.8
                    }}
                >
                    <Popup>
                        <div style={{ borderLeft: '4px solid #00ff00', paddingLeft: '10px' }}>
                            <h4>Линия навигации</h4>
                            <p>Режим: {data.rawFiles['line.json'].currentMode}</p>
                            <p>Длина: {data.rawFiles['line.json'].length?.toFixed(2)} м</p>
                            <p>Угол: {data.rawFiles['line.json'].cog?.toFixed(2)}°</p>
                        </div>
                    </Popup>
                </Polyline>
            </FeatureGroup>
        );
    };

    // Рендерим полигоны покрытия
    const renderCoveragePolygons = () => {
        if (!data?.jobInfo?.products) return null;

        return data.jobInfo.products.map((product, index) => {
            // Получаем данные покрытия из rad файла
            const coverageData = data.rawFiles[`${product.radId}.rad`] || 
                               data.rawFiles['coverage.json']?.products?.[product.id];
            
            if (!coverageData?.coverage) return null;

            const color = getTrackColor(index);
            
            // Преобразуем ECEF координаты в lat/lng
            const coveragePolygons = coverageData.coverage.map(section => {
                if (Array.isArray(section.points)) {
                    return section.points.map(point => 
                        ecefToLatLng(point.X || point.x, point.Y || point.y, point.Z || point.z)
                    );
                }
                return [];
            }).filter(points => points.length > 0);

            return (
                <FeatureGroup key={product.id}>
                    {coveragePolygons.map((polygon, polyIndex) => (
                        <Polygon
                            key={`${product.id}-${polyIndex}`}
                            positions={polygon}
                            pathOptions={{
                                color: color,
                                fillColor: color,
                                fillOpacity: 0.3,
                                weight: 1
                            }}
                        />
                    ))}
                    <Popup>
                        <div style={{ borderLeft: `4px solid ${color}`, paddingLeft: '10px' }}>
                            <h4>{product.name}</h4>
                            <p>Площадь: {product.area.toFixed(2)} га</p>
                            <p>Полигонов: {product.polygons}</p>
                            <p>Расстояние: {(product.distance / 1000).toFixed(2)} км</p>
                        </div>
                    </Popup>
                </FeatureGroup>
            );
        });
    };

    // Рендерим секции агрегата
    const renderImplementSections = (positions, implementInfo) => {
        if (!implementInfo?.sections) return null;

        return implementInfo.sections.map((section, index) => {
            // Создаем буфер для каждой секции с учетом её ширины
            const sectionLine = turf.lineString(positions);
            const buffer = turf.buffer(sectionLine, section.width / 2, { units: 'meters' });
            
            // Смещаем буфер на rightOffset если задан
            const shifted = section.rightOffset ? 
                turf.transformTranslate(buffer, section.rightOffset, 90) : 
                buffer;
            
            return (
                <Polygon
                    key={`section-${index}`}
                    positions={shifted.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
                    pathOptions={{
                        color: getTrackColor(index),
                        fillOpacity: 0.3,
                        weight: 1
                    }}
                />
            );
        });
    };

    if (!data?.tasks) return null;

    return (
        <>
            {/* Отображаем границы поля */}
            {data?.jobInfo?.fieldBoundary && (
                <Polygon
                    positions={data.jobInfo.fieldBoundary.coordinates.map(([lng, lat]) => [lat, lng])}
                    pathOptions={{
                        color: '#000000',
                        weight: 2,
                        fillOpacity: 0.1
                    }}
                >
                    <Popup>
                        <div>
                            <h4>Границы поля</h4>
                            <p>Общая площадь: {data.totalArea?.toFixed(2)} га</p>
                        </div>
                    </Popup>
                </Polygon>
            )}

            {/* Отображаем полигоны покрытия */}
            {renderCoveragePolygons()}

            {/* Отображаем линию навигации */}
            {data.navigationLine && renderGuidanceLine()}

            {/* Отображаем треки */}
            {data.tasks?.[0]?.passes.map((pass, index) => (
                <Polyline
                    key={index}
                    positions={pass.map(point => [
                        point.coordinates.lat,
                        point.coordinates.lng
                    ])}
                    pathOptions={{
                        color: getTrackColor(index),
                        weight: 3,
                        opacity: 0.8
                    }}
                >
                    <Popup>
                        <div style={{ borderLeft: `4px solid ${getTrackColor(index)}`, paddingLeft: '10px' }}>
                            <p>Проход #{index + 1}</p>
                            <p>Точек: {pass.length}</p>
                        </div>
                    </Popup>
                </Polyline>
            ))}
        </>
    );
}

function calculateTrackLength(positions) {
    let length = 0;
    for (let i = 1; i < positions.length; i++) {
        const p1 = positions[i - 1];
        const p2 = positions[i];
        length += L.latLng(p1).distanceTo(L.latLng(p2));
    }
    return length;
} 