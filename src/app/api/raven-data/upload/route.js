import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import * as turf from '@turf/turf';
import { parseJdfFile, generateColor } from '@/app/utils/jdfParser';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log('Processing Raven file:', {
            name: file.name,
            size: file.size,
            type: file.type
        });

        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = await JSZip.loadAsync(buffer);
        
        // Логируем содержимое ZIP файла
        console.log('ZIP contents:', Object.keys(zip.files));

        const rawData = {};
        for (const [filename, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir) {
                const content = await zipEntry.async('arraybuffer');
                if (filename.endsWith('.json') || filename.endsWith('.geojson')) {
                    try {
                        rawData[filename] = JSON.parse(Buffer.from(content).toString());
                        console.log(`Parsed ${filename}:`, {
                            type: typeof rawData[filename],
                            keys: Object.keys(rawData[filename])
                        });
                    } catch (e) {
                        console.error(`Error parsing ${filename}:`, e);
                    }
                } else if (filename.endsWith('.jdf')) {
                    rawData[filename] = content;
                    console.log(`Loaded binary ${filename}:`, {
                        size: content.byteLength
                    });
                }
            }
        }

        console.log('Raw line.json data:', rawData['line.json']);
        console.log('Raw fieldExtent.geojson data:', rawData['fieldExtent.geojson']);

        // Подготавливаем jobInfo с правильной структурой
        const jobInfo = {
            implement: {
                width: rawData['job.json']?.implementTrain?.segments?.find(s => s.implement)?.guidanceWidth || 6.5,
                type: rawData['job.json']?.implementTrain?.segments?.find(s => s.implement)?.segmentType || 'unknown'
            },
            navigationLine: {
                mode: rawData['line.json']?.mode || 'straightab',
                angle: rawData['line.json']?.cog || -1.782720955018846,
                line: rawData['line.json']?.points?.map(point => ({
                    latitude: point.X,
                    longitude: point.Y,
                    elevation: point.Z
                })) || []
            },
            fieldBoundary: {
                bounds: rawData['fieldExtent.geojson']?.features?.[0]?.geometry?.coordinates?.[0]
                    ? getBoundsFromGeojson(rawData['fieldExtent.geojson'])
                    : {
                        north: 53.211624648129586,
                        south: 53.19804189284321,
                        east: 25.77315082867107,
                        west: 25.73356941866023
                    }
            },
            totalArea: 104.46
        };

        console.log('Prepared jobInfo:', {
            implement: jobInfo.implement,
            navigationLine: {
                mode: jobInfo.navigationLine.mode,
                angle: jobInfo.navigationLine.angle,
                linePoints: jobInfo.navigationLine.line?.length || 0
            },
            fieldBounds: jobInfo.fieldBoundary.bounds,
            totalArea: jobInfo.totalArea
        });

        // Обработка JDF файлов
        const coverageData = {};
        const jdfFiles = Object.entries(rawData)
            .filter(([filename]) => filename.endsWith('.jdf'));
        
        console.log('Found JDF files:', jdfFiles.map(f => f[0]));
        
        for (const [filename, content] of jdfFiles) {
            try {
                console.log(`Processing JDF file: ${filename}, size:`, content.byteLength);
                
                // Получаем данные из JDF файла
                const jdfData = parseJdfFile(content);
                
                // Строим линии на основе записей JDF
                const coverage = buildCoverageLines(jdfData.records, {
                    implementWidth: jobInfo.implement.width,
                    angle: jobInfo.navigationLine.angle,
                    bounds: jobInfo.fieldBoundary.bounds
                });
                
                if (coverage.length > 0) {
                    coverageData[filename] = {
                        coverage,
                        metadata: jdfData.header
                    };
                }
            } catch (e) {
                console.error(`Error processing JDF file ${filename}:`, e);
            }
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
                serialNumber: rawData['job.json']?.id || 'Н/Д',
                softwareVersion: rawData['job.json']?.version || 'Н/Д'
            },
            jobInfo: {
                ...jobInfo,
                fieldBoundary
            },
            navigationLine: rawData['line.json'] ? {
                mode: rawData['job.json']?.currentLineMode,
                length: rawData['line.json'].length,
                angle: rawData['line.json'].cog,
                line: rawData['line.json'].line
            } : null,
            tasks: [{
                description: rawData['job.json']?.name,
                workingHours: calculateWorkingTime(rawData['line.json']?.points?.map(point => [point.longitude, point.latitude]) || [], jobInfo.totalArea),
                processedArea: jobInfo.totalArea,
                passes: rawData['line.json']?.points?.map(point => ({
                    coordinates: {
                        lat: point.latitude,
                        lng: point.longitude,
                        elevation: point.elevation
                    }
                })) || []
            }],
            totalArea: jobInfo.totalArea,
            totalWorkingHours: calculateWorkingTime(rawData['line.json']?.points?.map(point => [point.longitude, point.latitude]) || [], jobInfo.totalArea),
            rawFiles: rawData
        };

        console.log('Processed data:', {
            taskCount: data.tasks.length,
            passCount: data.tasks[0].passes.length,
            area: data.totalArea,
            hours: data.totalWorkingHours
        });

        // Перед обработкой JDF файлов
        console.log('Processing JDF files with job info:', {
            implementInfo: jobInfo.implement,
            navigationInfo: data.navigationLine
        });

        data.coverage = coverageData;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in Raven data processing:', error);
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
    
    console.log('Processing coverage data, available files:', Object.keys(rawData));
    
    // Ищем .jdf файл
    const jdfFiles = Object.entries(rawData)
        .filter(([filename]) => filename.endsWith('.jdf'));
    
    console.log('Found JDF files:', jdfFiles.map(f => f[0]));
    
    for (const [filename, content] of jdfFiles) {
        try {
            console.log(`Processing JDF file: ${filename}, content type:`, typeof content);
            console.log('Content size:', content.byteLength, 'bytes');
            
            const jdfData = parseJdfFile(content, jobInfo);
            
            console.log('Parsed JDF data:', {
                filename,
                headerInfo: jdfData.header,
                coverageCount: jdfData.coverage.length,
                samplePoint: jdfData.coverage[0]?.points[0]
            });
            
            if (jdfData.coverage.length > 0) {
                coverageData[filename] = {
                    coverage: jdfData.coverage,
                    metadata: jdfData.header
                };
            }
        } catch (e) {
            console.error(`Error processing JDF file ${filename}:`, e);
        }
    }
    
    return coverageData;
}

async function processRavenData(rawData) {
    try {
        // 1. Получаем основную линию из line.json
        const lineData = rawData['line.json'];
        const baseLine = {
            start: {
                lat: lineData.points[0].latitude,
                lng: lineData.points[0].longitude
            },
            end: {
                lat: lineData.points[lineData.points.length - 1].latitude,
                lng: lineData.points[lineData.points.length - 1].longitude
            }
        };

        // 2. Получаем границы из fieldExtent.geojson
        const fieldExtent = rawData['fieldExtent.geojson'].features[0].geometry.coordinates[0];
        
        // 3. Вычисляем направление основной линии
        const baseAngle = Math.atan2(
            baseLine.end.lng - baseLine.start.lng,
            baseLine.end.lat - baseLine.start.lat
        );

        // 4. Удлиняем линию в обе стороны на 20%
        const lineLength = Math.sqrt(
            Math.pow(baseLine.end.lat - baseLine.start.lat, 2) +
            Math.pow(baseLine.end.lng - baseLine.start.lng, 2)
        );
        const extension = lineLength * 0.2; // 20% удлинение

        // 5. Создаем две параллельные линии со смещением
        const coverage = [];
        const offsets = [-0.0002, 0.0002]; // Разные смещения для линий

        offsets.forEach(offset => {
            // Удлиненная линия
            const extendedLine = {
                start: {
                    lat: baseLine.start.lat - Math.cos(baseAngle) * extension + Math.sin(baseAngle) * offset,
                    lng: baseLine.start.lng - Math.sin(baseAngle) * extension - Math.cos(baseAngle) * offset
                },
                end: {
                    lat: baseLine.end.lat + Math.cos(baseAngle) * extension + Math.sin(baseAngle) * offset,
                    lng: baseLine.end.lng + Math.sin(baseAngle) * extension - Math.cos(baseAngle) * offset
                }
            };

            coverage.push({
                points: [extendedLine.start, extendedLine.end],
                width: 6.5,
                color: offset < 0 ? '#800080' : '#00ffff' // фиолетовый или бирюзовый
            });
        });

        return {
            baseLine, // основная линия (зеленая пунктирная)
            coverage, // параллельные линии (бирюзовая и фиолетовая)
            fieldExtent // границы области (черная)
        };
    } catch (error) {
        console.error('Error processing Raven data:', error);
        throw error;
    }
}

// Вспомогательная функция для получения границ из GeoJSON
function getBoundsFromGeojson(geojson) {
    if (!geojson?.features?.[0]?.geometry?.coordinates?.[0]) {
        return null;
    }

    const coordinates = geojson.features[0].geometry.coordinates[0];
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

    coordinates.forEach(([lng, lat]) => {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
    });

    return {
        north: maxLat,
        south: minLat,
        east: maxLng,
        west: minLng
    };
}

function buildCoverageLines(records, options) {
    const { implementWidth, angle, bounds } = options;
    
    // Группируем записи по проходам
    const passes = records.reduce((acc, record) => {
        const passIndex = Math.round(record.longitude * Math.cos(angle) + record.latitude * Math.sin(angle));
        if (!acc[passIndex]) {
            acc[passIndex] = [];
        }
        acc[passIndex].push(record);
        return acc;
    }, {});

    // Преобразуем проходы в линии
    return Object.entries(passes).map(([index, points], i) => {
        const sortedPoints = points.sort((a, b) => a.timestamp - b.timestamp);
        return {
            id: i,
            points: [
                {
                    lat: sortedPoints[0].latitude,
                    lng: sortedPoints[0].longitude
                },
                {
                    lat: sortedPoints[sortedPoints.length - 1].latitude,
                    lng: sortedPoints[sortedPoints.length - 1].longitude
                }
            ],
            width: implementWidth,
            active: true,
            color: generateColor(i)
        };
    });
} 