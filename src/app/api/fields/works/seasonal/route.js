import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';
import Fields from '@/models/fields';
import '@/models/workers';
import '@/models/tech';
import mongoose from 'mongoose';

export async function GET(request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const season = searchParams.get('season');
        
        // Получаем все поля
        const fields = await Fields.find().lean();
        const fieldsMap = new Map(fields.map(f => [f._id.toString(), f]));

        // Получаем только запланированные работы
        const works = await Work.find({
            status: 'planned',
            type: 'plowing'
        }).lean();

        // Получаем все ID работников и техники
        const workerIds = works.flatMap(work => work.workers || []);
        const equipmentIds = works.flatMap(work => work.equipment || []);

        // Получаем работников и технику
        const workers = await mongoose.model('workers').find({
            _id: { $in: workerIds }
        }).lean();

        const equipment = await mongoose.model('tech').find({
            _id: { $in: equipmentIds }
        }).lean();

        // Создаем Map для быстрого поиска
        const workersMap = new Map(workers.map(w => [w._id.toString(), w]));
        const equipmentMap = new Map(equipment.map(e => [e._id.toString(), e]));

        // Собираем финальный результат с информацией о поле
        const populatedWorks = works.map(work => ({
            ...work,
            field: fieldsMap.get(work.fieldId.toString()),
            workers: (work.workers || []).map(id => workersMap.get(id.toString()) || id),
            equipment: (work.equipment || []).map(id => equipmentMap.get(id.toString()) || id)
        }));

        return NextResponse.json(populatedWorks);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
} 