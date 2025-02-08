import React from 'react';
import { useMap } from 'react-leaflet';
import { Circle, FeatureGroup, Polygon, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getTrackColor } from '../utils/colors';
import * as turf from '@turf/turf';

// Функция для конвертации ECEF в LLA (Latitude, Longitude, Altitude)
function ecefToLla(x, y, z) {
    const a = 6378137.0; // WGS84 semi-major axis
    const e2 = 6.69437999014e-3; // First eccentricity squared
    const a1 = 4.2697672707318e+4;
    const a2 = 1.8230912546491e+9;
    const a3 = 1.4291722289812e+2;
    const a4 = 4.5577281365839e-9;
    const a5 = 4.5721504783806e-12;
    const a6 = 1.0842021724855e-19;

    const p = Math.sqrt(x * x + y * y);
    const q = Math.atan2((z * a), (p * Math.sqrt(1 - e2)));
    const sin_q = Math.sin(q);
    const cos_q = Math.cos(q);
    const sin_q3 = sin_q * sin_q * sin_q;
    const cos_q3 = cos_q * cos_q * cos_q;
    const phi = Math.atan2((z + a3 * sin_q3), (p - a2 * cos_q3));
    const lambda = Math.atan2(y, x);

    const lat = phi * 180 / Math.PI;
    const lng = lambda * 180 / Math.PI;

    return { lat, lng };
}

export function RavenLayer({ data }) {
    const map = useMap();
    
    console.log('Full data:', data);

    // Отображаем границы поля
    const renderFieldBoundary = () => {
        const coordinates = data?.jobInfo?.fieldBoundary?.coordinates;
        
        if (!coordinates?.length) {
            console.log('No field boundary coordinates found');
            return null;
        }

        // Проверяем структуру координат и конвертируем
        const positions = coordinates.map(coord => {
            if (!Array.isArray(coord) || coord.length < 2) {
                console.log('Invalid coordinate:', coord);
                return null;
            }
            return [coord[1], coord[0]]; // [lat, lon]
        }).filter(Boolean); // Удаляем null значения

        if (!positions.length) {
            console.log('No valid positions after conversion');
            return null;
        }

        console.log('Field boundary positions:', positions);

        return (
            <Polygon
                positions={positions}
                pathOptions={{
                    color: 'blue',
                    weight: 2,
                    fillOpacity: 0.1
                }}
            />
        );
    };

    // Отображаем навигационную линию
    const renderNavigationLine = () => {
        const { angle, length, line } = data?.navigationLine || {};
        
        if (!line?.length) {
            console.log('No valid navigation line data');
            return null;
        }

        // Конвертируем линию
        const positions = line.map(point => {
            if (!Array.isArray(point) || point.length < 2) {
                console.log('Invalid line point:', point);
                return null;
            }
            return [point[1], point[0]]; // [lat, lon]
        }).filter(Boolean);

        if (!positions.length) {
            console.log('No valid positions for navigation line');
            return null;
        }

        console.log('Navigation line positions:', positions);

        return (
            <Polyline
                positions={positions}
                pathOptions={{
                    color: 'yellow',
                    weight: 3,
                    dashArray: '10, 10'
                }}
            >
                <Popup>
                    <div>
                        Длина: {length?.toFixed(1)}м
                        <br/>
                        Угол: {(angle * 180 / Math.PI)?.toFixed(1)}°
                    </div>
                </Popup>
            </Polyline>
        );
    };

    // Генерируем параллельные проходы
    const renderSwaths = () => {
        const { angle, length } = data?.navigationLine || {};
        const implementWidth = data?.implementWidth || 6.5;
        const bounds = data?.jobInfo?.fieldBoundary?.bounds;

        if (!angle || !length || !bounds) {
            console.log('Missing data for swaths:', { angle, length, bounds });
            return null;
        }

        // Вычисляем центр поля
        const centerLat = (bounds.north + bounds.south) / 2;
        const centerLon = (bounds.east + bounds.west) / 2;

        // Количество проходов с каждой стороны
        const numSwaths = Math.ceil(length / implementWidth);
        const swaths = [];

        // Генерируем параллельные линии
        for (let i = -numSwaths; i <= numSwaths; i++) {
            const offset = i * implementWidth;
            // Вычисляем смещение перпендикулярно основной линии
            const offsetLat = Math.cos(angle) * offset / 111111;
            const offsetLon = Math.sin(angle) * offset / (111111 * Math.cos(centerLat * Math.PI / 180));

            const swathLine = [
                [centerLat - offsetLat, centerLon - offsetLon],
                [centerLat + offsetLat, centerLon + offsetLon]
            ];

            if (swathLine.every(point => point.every(coord => typeof coord === 'number' && !isNaN(coord)))) {
                swaths.push(swathLine);
            } else {
                console.log('Invalid swath line:', swathLine);
            }
        }

        console.log('Generated swaths:', swaths);

        return swaths.map((positions, index) => (
            <Polyline
                key={index}
                positions={positions}
                pathOptions={{
                    color: 'rgba(255,0,0,0.3)',
                    weight: 1,
                    dashArray: '5, 10'
                }}
            />
        ));
    };

    React.useEffect(() => {
        if (data?.jobInfo?.fieldBoundary?.bounds) {
            const { north, south, east, west } = data.jobInfo.fieldBoundary.bounds;
            if ([north, south, east, west].every(coord => typeof coord === 'number' && !isNaN(coord))) {
                map.fitBounds([
                    [south, west],
                    [north, east]
                ]);
            }
        }
    }, [map, data]);

    return (
        <>
            {renderFieldBoundary()}
            {renderNavigationLine()}
            {renderSwaths()}
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

const calculateABLine = (fieldBoundary) => {
    // Находим самые дальние точки поля
    const points = fieldBoundary.reduce((acc, point) => {
        const [lat, lon] = point;
        if (!acc.minLat || lat < acc.minLat) acc.minLat = lat;
        if (!acc.maxLat || lat > acc.maxLat) acc.maxLat = lat;
        if (!acc.minLon || lon < acc.minLon) acc.minLon = lon;
        if (!acc.maxLon || lon > acc.maxLon) acc.maxLon = lon;
        return acc;
    }, {});

    // Создаем AB линию по длинной стороне поля
    const latDiff = points.maxLat - points.minLat;
    const lonDiff = points.maxLon - points.minLon;
    
    const isVertical = latDiff > lonDiff;
    
    return {
        start: [
            isVertical ? points.minLat : (points.minLat + points.maxLat) / 2,
            isVertical ? (points.minLon + points.maxLon) / 2 : points.minLon
        ],
        end: [
            isVertical ? points.maxLat : (points.minLat + points.maxLat) / 2,
            isVertical ? (points.minLon + points.maxLon) / 2 : points.maxLon
        ]
    };
};

const generateSwaths = (abLine, implementWidth, fieldBoundary) => {
    const swaths = [];
    const numSwaths = 10; // Количество проходов с каждой стороны
    
    // Вычисляем вектор смещения для параллельных линий
    const [startLat, startLon] = abLine.start;
    const [endLat, endLon] = abLine.end;
    const angle = Math.atan2(endLat - startLat, endLon - startLon);
    const perpAngle = angle + Math.PI/2;
    
    // Создаем параллельные линии
    for (let i = -numSwaths; i <= numSwaths; i++) {
        const offset = i * implementWidth;
        const offsetLat = Math.sin(perpAngle) * offset;
        const offsetLon = Math.cos(perpAngle) * offset;
        
        swaths.push({
            start: [startLat + offsetLat, startLon + offsetLon],
            end: [endLat + offsetLat, endLon + offsetLon]
        });
    }
    
    return swaths;
}; 