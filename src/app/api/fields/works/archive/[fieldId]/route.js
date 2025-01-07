import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';
import '@/models/workers';
import '@/models/tech';
import mongoose from 'mongoose';

export async function GET(request, { params: paramsPromise }) {
    await dbConnect();

    try {
        const params = await paramsPromise;
        const { fieldId } = params;
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Проверяем наличие обязательных параметров
        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Необходимо указать диапазон дат' },
                { status: 400 }
            );
        }

        // Формируем запрос для поиска завершенных работ в указанном диапазоне
        const query = {
            fieldId,
            status: 'completed',
            plannedDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };


        // Получаем работы
        const works = await Work.find(query).lean();

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

        // Собираем финальный результат
        const populatedWorks = works.map(work => ({
            ...work,
            workers: (work.workers || []).map(id => workersMap.get(id.toString()) || id),
            equipment: (work.equipment || []).map(id => equipmentMap.get(id.toString()) || id)
        }));

        return NextResponse.json(populatedWorks);
    } catch (error) {
        console.error('Error loading archive:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
} 