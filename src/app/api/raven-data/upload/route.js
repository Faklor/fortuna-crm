import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import * as turf from '@turf/turf';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
            return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const zip = new JSZip();
        const contents = await zip.loadAsync(buffer);
        
        // Читаем все файлы
        const rawData = {};
        for (const [filename, file] of Object.entries(contents.files)) {
            if (!file.dir) {
                const content = await file.async('text');
                try {
                    if (filename.endsWith('.json') || filename.endsWith('.geojson')) {
                        rawData[filename] = JSON.parse(content);
                        // Логируем содержимое каждого файла
                        console.log(`\n=== Content of ${filename} ===`);
                        console.log(JSON.stringify(rawData[filename], null, 2));
                    }
                } catch (e) {
                    console.error(`Error parsing ${filename}:`, e);
                }
            }
        }

        console.log('Available files:', Object.keys(rawData));

        // Ищем треки в line.json
        let tracks = [];
        if (rawData['line.json']) {
            const lineData = rawData['line.json'];
            if (Array.isArray(lineData)) {
                tracks = lineData.map(line => 
                    line.points.map(point => [point.longitude, point.latitude])
                );
            }
        }

        // Если треки не найдены в line.json, ищем в geojson файлах
        if (tracks.length === 0) {
            const geojsonFile = '{f4a4d73c-07b3-4400-ad77-f6020c99276d}.geojson';
            if (rawData[geojsonFile]?.features) {
                tracks = rawData[geojsonFile].features
                    .filter(feature => 
                        feature.geometry?.type === 'LineString' || 
                        feature.geometry?.type === 'MultiLineString'
                    )
                    .flatMap(feature => {
                        if (feature.geometry.type === 'LineString') {
                            return [feature.geometry.coordinates];
                        } else {
                            return feature.geometry.coordinates;
                        }
                    });
            }
        }

        // Если все еще нет треков, пробуем fieldExtent.geojson
        if (tracks.length === 0 && rawData['fieldExtent.geojson']?.features) {
            const features = rawData['fieldExtent.geojson'].features;
            const lineFeatures = features.filter(f => 
                f.geometry?.type === 'LineString' || 
                f.geometry?.type === 'MultiLineString'
            );
            
            if (lineFeatures.length > 0) {
                tracks = lineFeatures.flatMap(feature => {
                    if (feature.geometry.type === 'LineString') {
                        return [feature.geometry.coordinates];
                    } else {
                        return feature.geometry.coordinates;
                    }
                });
            }
        }

        console.log('Total tracks found:', tracks.length);

        // Улучшенное извлечение данных из job.json
        const jobData = rawData['job.json'];
        let jobInfo = {
            area: 0,
            implementWidth: 0,
            implementName: '',
            startTime: null,
            endTime: null,
            speed: 0,
            productivity: 0,
            distance: 0,
            products: []
        };

        if (jobData) {
            // Получаем информацию о продуктах и их статистику
            const products = Object.entries(jobData.productList || {}).map(([id, product]) => {
                const stats = product.sectionControlChannels?.[0]?.stats || {};
                return {
                    id,
                    name: product.name,
                    area: stats.area ? stats.area / 10000 : 0, // конвертируем в гектары
                    distance: stats.distance,
                    polygons: stats.polygons,
                    quantity: stats.quantity
                };
            });

            // Суммируем статистику по всем продуктам
            const totalStats = products.reduce((acc, product) => ({
                area: acc.area + product.area,
                distance: acc.distance + product.distance,
                polygons: acc.polygons + product.polygons
            }), { area: 0, distance: 0, polygons: 0 });

            // Получаем информацию об агрегате из implementTrain
            const implement = jobData.implementTrain?.segments?.find(s => s.implement);
            
            jobInfo = {
                name: jobData.name,
                startTime: jobData.lastStartEvent?.time,
                endTime: jobData.lastStopEvent?.time,
                totalArea: totalStats.area,
                totalDistance: totalStats.distance / 1000, // конвертируем в километры
                totalPolygons: totalStats.polygons,
                products,
                implement: implement ? {
                    id: implement.id,
                    width: implement.guidanceWidth,
                    sections: implement.implement.sections,
                    type: implement.segmentType
                } : null,
                units: jobData.units,
                state: jobData.state,
                gpsDistanceTraveled: jobData.gpsDistanceTraveled / 1000 // конвертируем в километры
            };
        }

        // Получаем границы поля из fieldExtent.geojson
        let fieldBoundary = null;
        if (rawData['fieldExtent.geojson']?.features?.[0]) {
            const feature = rawData['fieldExtent.geojson'].features[0];
            fieldBoundary = {
                type: feature.geometry.type,
                coordinates: feature.geometry.coordinates[0],
                bounds: {
                    north: Math.max(...feature.geometry.coordinates[0].map(coord => coord[1])),
                    south: Math.min(...feature.geometry.coordinates[0].map(coord => coord[1])),
                    east: Math.max(...feature.geometry.coordinates[0].map(coord => coord[0])),
                    west: Math.min(...feature.geometry.coordinates[0].map(coord => coord[0]))
                }
            };
        }

        // Формируем обновленную структуру данных
        const data = {
            deviceInfo: {
                model: 'Raven',
                serialNumber: jobData?.id || 'Н/Д',
                softwareVersion: jobData?.version || 'Н/Д'
            },
            jobInfo: {
                ...jobInfo,
                fieldBoundary
            },
            navigationLine: rawData['line.json'] ? {
                mode: jobData.currentLineMode,
                length: rawData['line.json'].length,
                angle: rawData['line.json'].cog,
                line: rawData['line.json'].line
            } : null,
            tasks: [{
                description: jobInfo.name,
                workingHours: calculateWorkingTime(tracks, jobInfo.totalArea),
                processedArea: jobInfo.totalArea,
                passes: tracks.map(track => track.map(point => ({
                    coordinates: {
                        lat: point[1],
                        lng: point[0],
                        elevation: point[2] // Добавляем высоту
                    }
                })))
            }],
            totalArea: jobInfo.totalArea,
            totalWorkingHours: calculateWorkingTime(tracks, jobInfo.totalArea),
            rawFiles: rawData
        };

        console.log('Processed data:', {
            taskCount: data.tasks.length,
            passCount: data.tasks[0].passes.length,
            area: data.totalArea,
            hours: data.totalWorkingHours
        });

        // Обработка rad файлов и coverage.json
        const coverageData = processCoverageData(rawData, jobInfo);
        data.coverage = coverageData;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error processing Raven data:', error);
        return NextResponse.json(
            { error: 'Ошибка обработки данных: ' + error.message },
            { status: 500 }
        );
    }
}

function calculateAreaFromBoundary(points) {
    if (!points || points.length < 3) return 0;
    
    // Создаем полигон с учетом рельефа
    const line = turf.lineString(points);
    const polygon = turf.polygon([points]);
    
    // Получаем длину периметра для учета рельефа
    const length = turf.length(line, { units: 'kilometers' });
    
    // Площадь в квадратных метрах с учетом рельефа
    const flatArea = turf.area(polygon);
    const reliefFactor = length / turf.length(turf.lineString(turf.flatten(polygon).features[0].geometry.coordinates[0]));
    
    // Переводим в гектары с учетом рельефа
    return (flatArea * reliefFactor) / 10000;
}

function calculateWorkingTime(tracks, area) {
    // Средняя скорость работы 12 км/ч
    const averageSpeed = 12; // км/ч
    // Средняя ширина захвата 12 метров
    const workWidth = 12; // метров
    
    // Расчет времени на основе площади и ширины захвата
    // Площадь в га * 10000 (перевод в м²) / (ширина захвата * скорость в м/ч)
    const estimatedTime = (area * 10000) / (workWidth * (averageSpeed * 1000));
    
    // Добавляем 15% на развороты и перекрытия
    return estimatedTime * 1.15;
}

function processCoverageData(rawData, jobInfo) {
    const coverageData = {};
    
    // Ищем файлы coverage
    for (const [filename, content] of Object.entries(rawData)) {
        if (filename.endsWith('.rad') || filename === 'coverage.json') {
            try {
                // Парсим данные покрытия
                const coverage = content.coverage || content.sections || [];
                if (coverage.length > 0) {
                    coverageData[filename] = {
                        coverage: coverage.map(section => ({
                            points: section.points || section.coordinates || [],
                            width: section.width || jobInfo.implement?.width || 6.5,
                            timestamp: section.timestamp
                        }))
                    };
                }
            } catch (e) {
                console.error(`Error processing coverage from ${filename}:`, e);
            }
        }
    }
    
    return coverageData;
} 