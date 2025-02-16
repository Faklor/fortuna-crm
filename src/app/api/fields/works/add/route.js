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

            // Если это подполе, сохраняем его ID как areaSelectionType
            let areaSelectionType;
            if (workData.useFullField) {
                areaSelectionType = 'full';
            } else if (workData.useSubField) {
                areaSelectionType = workData.selectedSubFieldId; // Сохраняем ID подполя
            } else {
                areaSelectionType = 'custom';
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

            // Преобразуем массивы работников и техники
            const workers = await mongoose.model('workers').find({
                _id: { $in: workData.workers }
            }).lean();

            const equipment = await mongoose.model('tech').find({
                _id: { $in: workData.equipment }
            }).lean();

            // Создаем новую работу с расширенной информацией
            const work = new Work({
                name: workData.name,
                type: workData.type,
                fieldId: workData.fieldId,
                plannedDate: workData.plannedDate,
                description: workData.description,
                processingArea: processingAreaData,
                area: areaInHectares,
                useFullField: workData.useFullField,
                useSubField: workData.useSubField,
                selectedSubFieldId: workData.selectedSubFieldId,
                areaSelectionType: areaSelectionType,
                status: workData.status || 'planned',
                workers: workers.map(worker => ({
                    _id: worker._id,
                    name: worker.name || worker.properties?.Name || 'Без имени'
                })),
                equipment: equipment.map(tech => ({
                    _id: tech._id,
                    name: tech.name,
                    category: tech.catagory || '',
                    captureWidth: tech.captureWidth || null
                }))
            });

            await work.save();

            // Возвращаем сохраненную работу без дополнительных запросов
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
