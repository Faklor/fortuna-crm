import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subtask from '@/models/subtasks';

export async function DELETE(request, { params }) {
    await dbConnect();
    
    try {
        const { workId, subtaskId } = params;

        // Находим и удаляем подработу
        const deletedSubtask = await Subtask.findOneAndDelete({ 
            _id: subtaskId,
            workId: workId 
        });

        if (!deletedSubtask) {
            return NextResponse.json({ 
                success: false, 
                error: 'Подработа не найдена' 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Подработа успешно удалена' 
        });

    } catch (error) {
        console.error('Error deleting subtask:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Ошибка при удалении подработы' 
        }, { status: 500 });
    }
} 