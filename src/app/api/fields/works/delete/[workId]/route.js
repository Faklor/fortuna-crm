import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';
import Subtask from '@/models/subtasks';

export async function DELETE(request, { params: paramsPromise }) {
    await dbConnect();

    try {
        const params = await paramsPromise;
        const workId = params.workId;

        // Проверяем существование работы
        const work = await Work.findById(workId);
        
        if (!work) {
            return NextResponse.json(
                { error: 'Work not found' },
                { status: 404 }
            );
        }

        // Сначала удаляем все связанные подработы
        await Subtask.deleteMany({ workId });

        // Затем удаляем саму работу
        await Work.findByIdAndDelete(workId);

        return NextResponse.json({
            success: true,
            message: 'Work and related subtasks deleted successfully'
        });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
} 