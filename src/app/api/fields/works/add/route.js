import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';
import Field from '@/models/fields';
import '@/models/workers';
import '@/models/tech';
import mongoose from 'mongoose';

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

        try {
            const field = await Field.findById(workData.fieldId);
            if (!field) {
                return NextResponse.json(
                    { error: 'Field not found' },
                    { status: 404 }
                );
            }

            // Подготавливаем данные в зависимости от типа обработки
            let processingAreaData;
            let areaInHectares;

            if (workData.useFullField) {
                processingAreaData = {
                    type: 'Polygon',
                    coordinates: field.coordinates
                };
                areaInHectares = workData.area;
            } else {
                processingAreaData = workData.processingArea;
                areaInHectares = workData.area;
            }

            // Создаем новую работу
            const work = new Work({
                name: workData.name,
                type: workData.type,
                fieldId: workData.fieldId,
                plannedDate: workData.plannedDate,
                description: workData.description,
                processingArea: processingAreaData,
                area: areaInHectares,
                useFullField: workData.useFullField,
                status: workData.status || 'planned',
                workers: workData.workers || [],
                equipment: workData.equipment || []
            });

            await work.save();

            // Получаем сохраненную работу
            const savedWork = await Work.findById(work._id).lean();

            // Получаем работников и технику
            const workers = await mongoose.model('workers').find({
                _id: { $in: savedWork.workers }
            }).lean();

            const equipment = await mongoose.model('tech').find({
                _id: { $in: savedWork.equipment }
            }).lean();

            // Собираем финальный результат
            const populatedWork = {
                ...savedWork,
                workers: workers,
                equipment: equipment
            };

            return NextResponse.json({
                success: true,
                message: 'Work created successfully',
                work: populatedWork
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
