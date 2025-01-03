import dbConnect from '@/lib/db';
import SubField from '@/models/subField';
import { NextResponse } from 'next/server';

export async function DELETE(request) {

    await dbConnect();
    try {
        // Подключаемся к БД
       

        // Получаем ID подполя из тела запроса
        const { _id } = await request.json();

        if (!_id) {
            return NextResponse.json({ 
                success: false, 
                error: 'ID подполя не указан' 
            }, { status: 400 });
        }

        // Удаляем подполе
        const deletedSubField = await SubField.findByIdAndDelete(_id);

        if (!deletedSubField) {
            return NextResponse.json({ 
                success: false, 
                error: 'Подполе не найдено' 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Подполе успешно удалено' 
        });

    } catch (error) {
        console.error('Error deleting subfield:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Ошибка при удалении подполя' 
        }, { status: 500 });
    }
} 