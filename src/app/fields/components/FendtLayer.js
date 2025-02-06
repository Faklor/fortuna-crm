import React from 'react';
import { useMap } from 'react-leaflet';
import { Circle, FeatureGroup, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getTrackColor } from '../utils/colors';

const getColorByFuelConsumption = (consumption, baseColor) => {
    if (!consumption) return '#808080'; // серый для нет данных
    return baseColor; // используем цвет трека
};

export function FendtLayer({ data }) {
    const map = useMap();

    // Добавим детальное логирование
    React.useEffect(() => {
        if (data?.tasks) {
            data.tasks.forEach((task, taskIndex) => {
                console.log(`Task ${taskIndex + 1}: ${task.description}`, {
                    total: task.trackPoints?.length,
                    valid: task.trackPoints?.filter(p => 
                        p.coordinates.lat !== 0 && 
                        p.coordinates.lng !== 0
                    ).length,
                });

                // Выведем первые 5 точек для проверки структуры данных
                console.log('Sample points:', task.trackPoints?.slice(0, 5).map(point => ({
                    lat: point.coordinates.lat,
                    lng: point.coordinates.lng,
                    time: point.time,
                    fuel: point.fuelConsumption,
                    speed: point.speed
                })));
            });
        }
    }, [data]);

    React.useEffect(() => {
        if (map && data?.tasks?.[0]?.trackPoints?.[0]?.coordinates) {
            const validPoints = data.tasks.flatMap(task => 
                task.trackPoints
                    .filter(point => 
                        point.coordinates.lat !== 0 && 
                        point.coordinates.lng !== 0 &&
                        Math.abs(point.coordinates.lat) <= 90 &&
                        Math.abs(point.coordinates.lng) <= 180
                    )
                    .map(point => [
                        point.coordinates.lat,
                        point.coordinates.lng
                    ])
            );

            if (validPoints.length > 0) {
                const bounds = L.latLngBounds(validPoints);
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [map, data]);

    if (!data?.tasks) return null;

    return (
        <>
            {data.tasks.map((task, taskIndex) => {
                const trackColor = getTrackColor(taskIndex);
                const validPoints = (task.trackPoints || []).filter(point => 
                    point.coordinates.lat !== 0 && 
                    point.coordinates.lng !== 0 &&
                    Math.abs(point.coordinates.lat) <= 90 &&
                    Math.abs(point.coordinates.lng) <= 180
                );

                return validPoints.length > 0 && (
                    <FeatureGroup key={`fendt-task-${taskIndex}`}>
                        <Polyline
                            positions={validPoints.map(point => [
                                point.coordinates.lat,
                                point.coordinates.lng
                            ])}
                            pathOptions={{
                                color: trackColor,
                                weight: 3,
                                opacity: 0.7
                            }}
                        >
                            <Popup>
                                <div style={{ borderLeft: `4px solid ${trackColor}`, paddingLeft: '10px' }}>
                                    <h4>{task.description}</h4>
                                    {task.workingHours && <p>Время работы: {task.workingHours.toFixed(2)} ч</p>}
                                    {task.processedArea && <p>Обработанная площадь: {task.processedArea.toFixed(2)} га</p>}
                                    {task.fuelConsumption && (
                                        <>
                                            <p>Общий расход топлива: {task.fuelConsumption.total.toFixed(2)} л</p>
                                            <p>Средний расход на га: {task.fuelConsumption.perHectare.toFixed(2)} л/га</p>
                                        </>
                                    )}
                                    <p>Количество точек трека: {validPoints.length}</p>
                                </div>
                            </Popup>
                        </Polyline>
                        
                        {validPoints.map((point, index) => (
                            <Circle
                                key={`point-${index}`}
                                center={[
                                    point.coordinates.lat,
                                    point.coordinates.lng
                                ]}
                                radius={3}
                                pathOptions={{
                                    color: trackColor,
                                    fillOpacity: 0.7,
                                    fillColor: trackColor
                                }}
                            >
                                <Popup>
                                    <div style={{ borderLeft: `4px solid ${trackColor}`, paddingLeft: '10px' }}>
                                        <h4>Точка {index + 1}</h4>
                                        <p>Время: {new Date(point.time).toLocaleString()}</p>
                                        <p>Координаты: {point.coordinates.lat}, {point.coordinates.lng}</p>
                                        {point.fuelConsumption && <p>Расход топлива: {point.fuelConsumption.toFixed(2)} л/ч</p>}
                                        {point.speed && <p>Скорость: {point.speed.toFixed(2)} км/ч</p>}
                                    </div>
                                </Popup>
                            </Circle>
                        ))}
                    </FeatureGroup>
                );
            })}
        </>
    );
} 