import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';
import mongoose from 'mongoose';

export async function GET(request, { params: paramsPromise }) {
    await dbConnect();

    try {
        const params = await paramsPromise;
        const { fieldId } = params;

        // Сначала получаем работы
        const works = await Work.find({ fieldId }).lean();

        // Получаем все ID работников и техники
        const workerIds = works.flatMap(work => work.workers || []);
        const equipmentIds = works.flatMap(work => work.equipment || []);

        // Получаем работников и технику отдельными запросами
        const workers = await mongoose.model('workers').find({
            _id: { $in: workerIds }
        }).lean();

        const equipment = await mongoose.model('tech').find({
            _id: { $in: equipmentIds }
        }).lean();

        // Создаем Map для быстрого поиска
        const workersMap = new Map(workers.map(w => [w._id.toString(), w]));
        const equipmentMap = new Map(equipment.map(e => [e._id.toString(), e]));

        // Собираем финальный результат
        const populatedWorks = works.map(work => ({
            ...work,
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