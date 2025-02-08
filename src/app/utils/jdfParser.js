class BinaryReader {
    constructor(buffer) {
        this.buffer = buffer;
        this.view = new DataView(buffer);
        this.offset = 0;
    }

    readFloat32() {
        if (this.offset + 4 > this.buffer.byteLength) return null;
        const value = this.view.getFloat32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readInt32() {
        if (this.offset + 4 > this.buffer.byteLength) return null;
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readUInt32() {
        if (this.offset + 4 > this.buffer.byteLength) return null;
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readUInt16() {
        if (this.offset + 2 > this.buffer.byteLength) return null;
        const value = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }

    readUInt8() {
        if (this.offset >= this.buffer.byteLength) return null;
        const value = this.view.getUint8(this.offset);
        this.offset += 1;
        return value;
    }

    skip(bytes) {
        this.offset = Math.min(this.offset + bytes, this.buffer.byteLength);
    }

    hasMoreData() {
        return this.offset < this.buffer.byteLength - 8;
    }

    peekBytes(count) {
        const bytes = new Uint8Array(count);
        for (let i = 0; i < count && (this.offset + i) < this.buffer.byteLength; i++) {
            bytes[i] = this.view.getUint8(this.offset + i);
        }
        return bytes;
    }
}

// Добавляем функцию для генерации цвета, если импорт не работает
export function generateColor(index) {
    const colors = [
        '#FF0000', // красный
        '#00FF00', // зеленый
        '#0000FF', // синий
        '#FFFF00', // желтый
        '#FF00FF', // пурпурный
        '#00FFFF', // голубой
        '#FFA500', // оранжевый
        '#800080', // фиолетовый
        '#008000', // темно-зеленый
        '#000080'  // темно-синий
    ];
    return colors[index % colors.length];
}

// Добавим функцию конвертации ECEF в LLA (Latitude, Longitude, Altitude)
function ecefToLla(x, y, z) {
    const a = 6378137.0; // WGS84 semi-major axis
    const e2 = 6.69437999014e-3; // First eccentricity squared
    const a1 = a * e2;
    const a2 = a1 * a1;
    const a3 = a1 * e2 / 2;
    const a4 = 2.5 * a2;
    const a5 = a1 + a3;

    const r2 = x*x + y*y;
    const r = Math.sqrt(r2);
    const z2 = z*z;
    const f = 54 * a2 * z2;
    const g = r2 + (1 - e2)*z2 - e2*a2;
    const c = (e2*e2 * f * r2)/(g*g*g);
    const s = Math.cbrt(1 + c + Math.sqrt(c*c + 2*c));
    const p = f/(3 * Math.pow((s + 1/s + 1), 2) * g*g);
    const q = Math.sqrt(1 + 2*e2*e2*p);
    const r0 = -(p*e2*r)/(1+q) + Math.sqrt((a2/2)*(1+1/q) - (p*(1-e2)*z2)/(q*(1+q)) - p*r2/2);
    const u = Math.sqrt(Math.pow(r - e2*r0, 2) + z2);
    const v = Math.sqrt(Math.pow(r - e2*r0, 2) + (1-e2)*z2);
    const z0 = (a2*z)/(a*v);

    const lat = Math.atan((z + a3 * Math.pow(z/r0, 3))/(r - a1 + a4 * Math.pow(r/r0, 3)));
    const lon = Math.atan2(y, x);
    const alt = u * (1 - a2/(a*v));

    return {
        lat: lat * 180/Math.PI,
        lng: lon * 180/Math.PI,
        alt: alt
    };
}

export function parseJdfFile(buffer) {
    try {
        const reader = new BinaryReader(buffer);
        console.log('Starting JDF parse, buffer size:', buffer.byteLength);

        // Читаем заголовок JDF файла
        const header = {
            version: reader.readUInt32(),
            timestamp: reader.readUInt32(),
            dataType: reader.readUInt16(),
            recordCount: reader.readUInt32()
        };

        console.log('JDF Header:', header);

        const records = [];
        while (reader.hasMoreData() && records.length < header.recordCount) {
            // Читаем ECEF координаты
            const x = reader.readFloat32();
            const y = reader.readFloat32();
            const z = reader.readFloat32();
            
            // Конвертируем в LLA
            const lla = ecefToLla(x, y, z);
            
            const record = {
                ...lla,
                speed: reader.readFloat32(),
                coverage: reader.readUInt8(),
                timestamp: reader.readUInt32()
            };
            
            if (isValidCoordinate(record.lat, record.lng)) {
                records.push(record);
            }
        }

        console.log('Parsed JDF records:', {
            count: records.length,
            sample: records[0],
            bounds: getBounds(records)
        });

        return {
            header,
            records
        };

    } catch (e) {
        console.error('Error parsing JDF:', e);
        throw e;
    }
}

// Вспомогательные функции
function isValidCoordinate(lat, lon) {
    return !isNaN(lat) && !isNaN(lon) && 
           Math.abs(lat) <= 90 && Math.abs(lon) <= 180 &&
           lat !== 0 && lon !== 0;
}

function isPointNearby(lat1, lon1, lat2, lon2) {
    const maxDistance = 0.001; // примерно 100 метров
    return Math.abs(lat1 - lat2) < maxDistance && 
           Math.abs(lon1 - lon2) < maxDistance;
}

function getBounds(points) {
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    
    for (const point of points) {
        minLat = Math.min(minLat, point.lat);
        maxLat = Math.max(maxLat, point.lat);
        minLng = Math.min(minLng, point.lng);
        maxLng = Math.max(maxLng, point.lng);
    }
    
    return { minLat, maxLat, minLng, maxLng };
}

function isValidBounds(bounds) {
    if (!bounds) return false;
    
    // Проверяем наличие всех необходимых свойств
    if (!bounds.north || !bounds.south || !bounds.east || !bounds.west) {
        return false;
    }

    // Проверяем, что границы имеют смысл
    if (bounds.north <= bounds.south || bounds.east <= bounds.west) {
        return false;
    }

    // Проверяем, что координаты находятся в разумных пределах
    if (bounds.north > 90 || bounds.south < -90 || 
        bounds.east > 180 || bounds.west < -180) {
        return false;
    }

    return Math.abs(bounds.minLat - targetLat) < maxDistance &&
           Math.abs(bounds.maxLat - targetLat) < maxDistance &&
           Math.abs(bounds.minLng - targetLon) < maxDistance &&
           Math.abs(bounds.maxLng - targetLon) < maxDistance;
} 