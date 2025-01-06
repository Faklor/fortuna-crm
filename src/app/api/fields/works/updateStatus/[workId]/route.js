import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';

export async function PATCH(request, { params }) {
    await dbConnect();

    try {
        const workId = params.workId;
        const { status } = await request.json();

        const work = await Work.findByIdAndUpdate(
            workId,
            { status },
            { new: true }
        );

        if (!work) {
            return NextResponse.json({ success: false, error: 'Работа не найдена' }, { status: 404 });
        }

        return NextResponse.json({ success: true, work });
    } catch (error) {
        console.error('Error updating work status:', error);
        return NextResponse.json({ success: false, error: 'Ошибка при обновлении статуса работы' }, { status: 500 });
    }
} 