import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';
import Field from '@/models/fields';

export async function POST(req) {
    await dbConnect();

    try {
        const workData = await req.json();
        console.log('Received work data:', workData);

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

            // Создаем новую работу, сохраняя processingArea как есть
            const work = new Work({
                fieldId: fieldId,
                name: workData.name,
                type: workData.type,
                plannedDate: workData.plannedDate,
                description: workData.description,
                processingArea: workData.processingArea,
                status: workData.status || 'planned'
            });

            console.log('Work to save:', work);

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
