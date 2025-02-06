import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
            return NextResponse.json(
                { error: 'Файл не найден' },
                { status: 400 }
            );
        }

        // Преобразуем Blob в ArrayBuffer, затем в строку
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const xmlText = decoder.decode(buffer);

        // Проверяем, что получили валидный XML
        if (!xmlText.includes('<?xml')) {
            return NextResponse.json(
                { error: 'Неверный формат файла' },
                { status: 400 }
            );
        }

        // Настройки парсера
        const options = {
            ignoreAttributes: false,
            attributeNamePrefix: '',
            parseAttributeValue: true,
            trimValues: true,
            parseTagValue: true,
            allowBooleanAttributes: true
        };

        const parser = new XMLParser(options);
        
        try {
            const result = parser.parse(xmlText);
            
            // Проверяем структуру данных
            if (!result || !result.ISO11783_TaskData) {
                throw new Error('Неверная структура XML файла');
            }

            // Извлекаем данные
            const taskData = result.ISO11783_TaskData;
            
            const data = {
                deviceInfo: extractDeviceInfo(taskData),
                tasks: extractTasks(taskData),
                totalWorkingHours: calculateTotalWorkingHours(taskData),
                averageFuelConsumption: calculateAverageFuelConsumption(taskData),
                totalArea: calculateTotalArea(taskData)
            };

            return NextResponse.json(data);

        } catch (parseError) {
            console.error('XML parsing error:', parseError);
            return NextResponse.json(
                { error: 'Ошибка при парсинге XML: ' + parseError.message },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Error processing Fendt data:', error);
        return NextResponse.json(
            { error: 'Ошибка обработки данных: ' + error.message },
            { status: 500 }
        );
    }
}

// Вспомогательные функции
function extractDeviceInfo(data) {
    try {
        const device = data.DVC?.[0] || {};
        return {
            model: device.D || 'Н/Д',
            serialNumber: device.C || 'Н/Д',
            softwareVersion: device.E || 'Н/Д',
            deviceId: device.A || 'Н/Д'
        };
    } catch (error) {
        console.error('Error extracting device info:', error);
        return {};
    }
}

function extractTasks(data) {
    try {
        const tasks = Array.isArray(data.TSK) ? data.TSK : [data.TSK].filter(Boolean);
        
        return tasks.map(task => extractTaskData(task));
    } catch (error) {
        console.error('Error extracting tasks:', error);
        return [];
    }
}

function extractTaskData(task) {
    const taskData = {
        description: task.TSK?.DES || 'Без названия',
        trackPoints: [],
        workingHours: 0,
        processedArea: 0,
        fuelConsumption: {
            total: 0,
            perHectare: 0
        }
    };

    // Извлекаем статистику работы
    if (task.CNT) {
        const counters = Array.isArray(task.CNT) ? task.CNT : [task.CNT];
        counters.forEach(counter => {
            if (counter.A === "PDT") { // Время работы
                taskData.workingHours = Number(counter.B) / 3600; // конвертируем в часы
            }
            if (counter.A === "PDA") { // Обработанная площадь
                taskData.processedArea = Number(counter.B) / 10000; // конвертируем в гектары
            }
            if (counter.A === "PDV") { // Общий расход топлива
                taskData.fuelConsumption.total = Number(counter.B) / 1000; // конвертируем в литры
            }
        });
    }

    // Вычисляем средний расход на гектар
    if (taskData.processedArea > 0) {
        taskData.fuelConsumption.perHectare = taskData.fuelConsumption.total / taskData.processedArea;
    }

    // Существующий код извлечения точек трека
    if (task.TIM) {
        taskData.trackPoints = extractTrackPoints(task);
    }

    return taskData;
}

function extractTrackPoints(task) {
    const points = [];
    
    if (task.TIM) {
        const times = Array.isArray(task.TIM) ? task.TIM : [task.TIM];
        times.forEach(time => {
            if (time && time.PTN) {
                // Меняем местами A и B
                const rawLat = time.PTN.A;  // было B
                const rawLng = time.PTN.B;  // было A
                
                const lat = Number(rawLat);
                const lng = Number(rawLng);
                
                // Проверяем валидность координат
                if (!isNaN(lat) && !isNaN(lng) && 
                    lat >= -90 && lat <= 90 && 
                    lng >= -180 && lng <= 180) {
                    
                    const point = {
                        time: time.A,
                        coordinates: { lat, lng }
                    };

                    if (time.DLV) {
                        const dlvs = Array.isArray(time.DLV) ? time.DLV : [time.DLV];
                        
                        // Расход топлива
                        const fuelData = dlvs.find(d => d && d.A === "013C");
                        if (fuelData) {
                            point.fuelConsumption = Number(fuelData.B) * 0.001;
                        }

                        // Скорость
                        const speedData = dlvs.find(d => d && d.A === "0001");
                        if (speedData) {
                            point.speed = Number(speedData.B) * 0.36;
                        }
                    }

                    points.push(point);
                } else {
                    console.warn('Invalid coordinates:', { lat, lng });
                }
            }
        });
    }

    return points;
}

// Функция для конвертации координат из формата DDMM.MMMM в десятичные градусы
function convertDDMMToDecimal(coord) {
    if (typeof coord !== 'string' && typeof coord !== 'number') {
        return NaN;
    }
    
    const str = coord.toString();
    const degrees = parseInt(str.slice(0, 2));
    const minutes = parseFloat(str.slice(2)) / 60;
    
    return degrees + minutes;
}

function calculateTaskDuration(task) {
    if (!task.TIM?.[0]?.A || !task.TIM?.[task.TIM.length - 1]?.B) return 0;
    
    const start = new Date(task.TIM[0].A);
    const end = new Date(task.TIM[task.TIM.length - 1].B);
    
    return Number(((end - start) / (1000 * 60 * 60)).toFixed(2));
}

function calculateTotalWorkingHours(data) {
    try {
        let total = 0;
        if (data.TSK) {
            const tasks = Array.isArray(data.TSK) ? data.TSK : [data.TSK];
            tasks.forEach(task => {
                total += calculateTaskDuration(task);
            });
        }
        return Number(total.toFixed(2));
    } catch (error) {
        console.error('Error calculating total working hours:', error);
        return 0;
    }
}

function calculateAverageFuelConsumption(data) {
    try {
        let totalConsumption = 0;
        let count = 0;

        if (data.TSK) {
            const tasks = Array.isArray(data.TSK) ? data.TSK : [data.TSK];
            tasks.forEach(task => {
                if (task.TIM) {
                    const times = Array.isArray(task.TIM) ? task.TIM : [task.TIM];
                    times.forEach(time => {
                        if (time.DLV) {
                            const dlvs = Array.isArray(time.DLV) ? time.DLV : [time.DLV];
                            const fuelData = dlvs.find(d => d && d.A === "013C");
                            if (fuelData) {
                                totalConsumption += Number(fuelData.B) * 0.001;
                                count++;
                            }
                        }
                    });
                }
            });
        }

        return count > 0 ? Number((totalConsumption / count).toFixed(2)) : 0;
    } catch (error) {
        console.error('Error calculating average fuel consumption:', error);
        return 0;
    }
}

function calculateTotalArea(data) {
    // Здесь можно добавить расчет общей обработанной площади
    return 0;
} 