import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';
import Field from '@/models/fields';
import * as turf from '@turf/turf';

export async function POST(req) {
    await dbConnect();

    try {
        const workData = await req.json();

        if (!workData.fieldId) {
            return NextResponse.json(
                { error: 'Field ID is required' },
                { status: 400 }
            );
        }

        // Убедимся, что fieldId это строка
        const fieldId = workData.fieldId.toString();

        try {
            // Проверяем существование поля
            const field = await Field.findById(fieldId);

            if (!field) {
                return NextResponse.json(
                    { error: `Field not found with ID: ${fieldId}` },
                    { status: 404 }
                );
            }

            // Рассчитываем площадь
            const geojsonPolygon = {
                type: "Feature",
                properties: {},
                geometry: workData.processingArea
            };
            
            const areaInSquareMeters = turf.area(geojsonPolygon);
            const areaInHectares = Math.round((areaInSquareMeters / 10000) * 100) / 100;

            // Создаем новую работу с площадью
            const work = new Work({
                fieldId: fieldId,
                name: workData.name,
                type: workData.type,
                plannedDate: workData.plannedDate,
                description: workData.description,
                processingArea: {
                    type: "Polygon",
                    coordinates: [workData.processingArea.coordinates[0].map(coord => [coord[0], coord[1]])]
                },
                status: workData.status || 'planned',
                area: areaInHectares,
                workers: workData.workers || [],
                equipment: workData.equipment || []
            });

            await work.save();

            return NextResponse.json({
                success: true,
                message: 'Work created successfully',
                work: work
            });

        } catch (error) {
            console.error('MongoDB error:', error);
            return NextResponse.json(
                { error: 'Database error: ' + error.message },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
