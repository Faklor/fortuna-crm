import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';

export async function DELETE(request, { params }) {
    await dbConnect();

    try {
        const { workId } = params;

        // Проверяем существование работы
        const work = await Work.findById(workId);
        if (!work) {
            return NextResponse.json(
                { error: 'Работа не найдена' },
                { status: 404 }
            );
        }

        // Удаляем работу
        await Work.findByIdAndDelete(workId);

        return NextResponse.json({ message: 'Работа успешно удалена' });
    } catch (error) {
        console.error('Error deleting work:', error);
        return NextResponse.json(
            { error: 'Ошибка при удалении работы' },
            { status: 500 }
        );
    }
} 