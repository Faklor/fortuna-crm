import { NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const bbox = searchParams.get('bbox');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!bbox) {
        return NextResponse.json({
            success: false,
            error: 'bbox parameter is required'
        }, { status: 400 });
    }

    try {
        // Разбиваем bbox на координаты
        const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
        
        // Формируем запрос к NASA MODIS API
        const nasaUrl = 'https://modis.ornl.gov/rst/api/v1/MOD13Q1';
        const response = await axios.get(nasaUrl, {
            params: {
                latitude: (minLat + maxLat) / 2, // центральная точка
                longitude: (minLon + maxLon) / 2,
                band: 'NDVI',
                date: date,
                format: 'GeoTIFF',
                api_key: API_KEY
            }
        });

        console.log('NASA API Response:', response.status);
        console.log('Response headers:', response.headers);

        return NextResponse.json({
            success: true,
            data: {
                imageUrl: `data:image/tiff;base64,${Buffer.from(response.data).toString('base64')}`,
                metadata: {
                    date,
                    bbox
                }
            }
        });

    } catch (error) {
        console.error('Error fetching NASA data:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch NASA data',
            details: error.message
        }, { status: 500 });
    }
} 