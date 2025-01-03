import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        // params.params будет массивом с параметрами из URL
        const [z, x, y] = params.params;
        
        // Получаем дату в правильном формате для NASA GIBS
        const today = new Date();
        today.setDate(today.getDate() - 8);
        const date = today.toISOString().split('T')[0];

        // Формируем URL для NASA GIBS
        const NASA_GIBS_URL = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${date}/GoogleMapsCompatible_Level${z}/${y}/${x}.png`;
        
        console.log('Fetching NDVI from:', NASA_GIBS_URL);

        const response = await fetch(NASA_GIBS_URL, {
            headers: {
                'Accept': 'image/png',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        if (!response.ok) {
            // Используем резервную дату при ошибке
            const fallbackDate = '2024-01-01';
            const fallbackURL = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${fallbackDate}/GoogleMapsCompatible_Level${z}/${y}/${x}.png`;
            
            console.log('Trying fallback URL:', fallbackURL);
            
            const fallbackResponse = await fetch(fallbackURL, {
                headers: {
                    'Accept': 'image/png',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            if (!fallbackResponse.ok) {
                throw new Error(`NASA GIBS responded with status: ${fallbackResponse.status}`);
            }

            const fallbackData = await fallbackResponse.arrayBuffer();
            return new NextResponse(fallbackData, {
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        }
        
        const data = await response.arrayBuffer();
        
        return new NextResponse(data, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        console.error('Error fetching NDVI tile:', error);
        return new NextResponse(null, {
            status: 204
        });
    }
} 