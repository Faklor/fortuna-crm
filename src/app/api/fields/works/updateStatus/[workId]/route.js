import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';

export async function PUT(request, { params: paramsPromise }) {
    await dbConnect();

    try {
        const params = await paramsPromise;
        const workId = params.workId;
        const { status, completedDate } = await request.json();

        const updateData = { status };
        
        // Если статус "completed", добавляем дату завершения
        if (status === 'completed' && completedDate) {
            updateData.completedDate = new Date(completedDate);
        }

        const work = await Work.findByIdAndUpdate(
            workId,
            updateData,
            { new: true }
        );

        if (!work) {
            return NextResponse.json(
                { error: 'Работа не найдена' },
                { status: 404 }
            );
        }

        return NextResponse.json(work);
    } catch (error) {
        console.error('Error updating work status:', error);
        return NextResponse.json(
            { error: 'Ошибка при обновлении статуса работы' },
            { status: 500 }
        );
    }
}