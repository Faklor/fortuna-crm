import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Work from '@/models/works';

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

        // Удаляем работу
        await Work.findByIdAndDelete(workId);

        return NextResponse.json({
            success: true,
            message: 'Work deleted successfully'
        });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
} 